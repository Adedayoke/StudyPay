/**
 * Campus Transport Payment API
 * Specialized endpoint for campus shuttle/transport payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// Transport service configuration
const TRANSPORT_SERVICES = {
  'campus-shuttle': {
    name: 'Campus Shuttle Service',
    wallet: 'TransportWallet1234567890123456789012345678',
    routes: {
      'main-gate-to-library': { name: 'Main Gate → Library', price: 0.01 },
      'library-to-hostel': { name: 'Library → Hostel Complex', price: 0.015 },
      'hostel-to-cafeteria': { name: 'Hostel → Cafeteria', price: 0.008 },
      'full-campus-tour': { name: 'Full Campus Circuit', price: 0.025 },
    },
  },
  'bike-rental': {
    name: 'Campus Bike Rental',
    wallet: 'BikeRentalWallet1234567890123456789012345678',
    rates: {
      'hourly': { name: 'Hourly Rental', price: 0.005 },
      'daily': { name: 'Daily Rental', price: 0.03 },
      'weekly': { name: 'Weekly Rental', price: 0.15 },
    },
  },
};

/**
 * GET /api/pay/transport - Create transport payment request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const serviceType = searchParams.get('service') || 'campus-shuttle';
    const route = searchParams.get('route');
    const duration = searchParams.get('duration');
    const passengers = parseInt(searchParams.get('passengers') || '1');
    
    const service = TRANSPORT_SERVICES[serviceType as keyof typeof TRANSPORT_SERVICES];
    if (!service) {
      return NextResponse.json(
        { error: 'Invalid transport service' },
        { status: 400 }
      );
    }

    let basePrice: number;
    let description: string;

    if (serviceType === 'campus-shuttle' && route) {
      const shuttleService = service as typeof TRANSPORT_SERVICES['campus-shuttle'];
      const routeInfo = shuttleService.routes[route as keyof typeof shuttleService.routes];
      if (!routeInfo) {
        return NextResponse.json(
          { error: 'Invalid shuttle route' },
          { status: 400 }
        );
      }
      basePrice = routeInfo.price;
      description = `Shuttle: ${routeInfo.name}`;
    } else if (serviceType === 'bike-rental' && duration) {
      const bikeService = service as typeof TRANSPORT_SERVICES['bike-rental'];
      const rateInfo = bikeService.rates[duration as keyof typeof bikeService.rates];
      if (!rateInfo) {
        return NextResponse.json(
          { error: 'Invalid rental duration' },
          { status: 400 }
        );
      }
      basePrice = rateInfo.price;
      description = `Bike: ${rateInfo.name}`;
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const totalAmount = new BigNumber(basePrice).multipliedBy(passengers);
    const reference = Keypair.generate().publicKey;

    const label = `${service.name} - ${description}`;
    const message = passengers > 1 
      ? `${description} for ${passengers} passengers`
      : description;

    return NextResponse.json({
      label,
      icon: `${request.nextUrl.origin}/icons/transport-icon.png`,
      transaction: {
        recipient: new PublicKey(service.wallet),
        amount: totalAmount,
        reference,
        memo: `StudyPay Transport: ${message}`,
      },
      message,
      service: {
        type: serviceType,
        name: service.name,
        route: route || duration,
        passengers,
        unitPrice: basePrice,
        totalPrice: totalAmount.toNumber(),
      },
    });

  } catch (error) {
    console.error('Transport payment request error:', error);
    return NextResponse.json(
      { error: 'Failed to create transport payment request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pay/transport - Process transport payment
 */
export async function POST(request: NextRequest) {
  try {
    const { transaction, account, serviceType, bookingId } = await request.json();

    const service = TRANSPORT_SERVICES[serviceType as keyof typeof TRANSPORT_SERVICES];
    if (!service) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    // Generate booking confirmation
    const confirmationCode = `STPAY-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      bookingId,
      confirmationCode,
      service: service.name,
      message: 'Transport booking confirmed!',
      instructions: [
        'Save your confirmation code',
        'Show code to driver/rental station',
        'Enjoy your ride!',
      ],
      qrCode: `studypay://booking/${confirmationCode}`, // QR for driver scanning
    });

  } catch (error) {
    console.error('Transport payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process transport payment' },
      { status: 500 }
    );
  }
}
