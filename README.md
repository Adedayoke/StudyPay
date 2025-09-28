# StudyPay - Campus Payments with Solana Pay

**Instant, low-cost payments connecting Nigerian students with diaspora parents through blockchain technology.**

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-14F195?style=for-the-badge)](https://studypay-sable.vercel.app)
[![Solana Pay](https://img.shields.io/badge/⚡-Solana%20Pay-9945FF?style=for-the-badge)](https://solanapay.com)

---

## The Problem

Nigerian parents working abroad currently face significant challenges sending money to their children at university:
- Western Union/MoneyGram fees: $15-45 per transfer
- Transfer time: 3-7 business days
- Students wait for funds while missing meals or unable to pay for transport
- Parents have no visibility into how money is spent on campus

This affects Nigerian diaspora families sending an estimated $21+ billion in remittances annually.

## The Solution

StudyPay leverages Solana Pay to enable:
- **30-second transfers** from parent wallets to student campus accounts
- **Sub-dollar fees** instead of $15-45 traditional remittance costs
- **Campus spending integration** via QR code payments at vendors
- **Real-time transparency** for parents to track spending

## Live Demo

**Try the full system:** [studypay-sable.vercel.app](https://studypay-sable.vercel.app)

- **Student Dashboard**: Receive funds, pay campus vendors
- **Parent Portal**: Send money, monitor spending
- **Vendor Interface**: Accept payments via QR codes

## Key Features

### Real Solana Pay Integration
- Official Solana Pay protocol implementation
- QR code generation for payment requests
- Transaction confirmation with blockchain verification
- Multi-wallet support (Phantom, Solflare)

### Campus-Focused Utility
- Student-to-vendor payments for food, transport, services
- Parent-to-student international transfers
- Transaction categorization and spending tracking
- Emergency fund allocation and controls

### Progressive Web App
- Mobile-responsive interface
- Works offline with service worker caching
- Push notifications for payments and alerts
- Installable like native mobile apps

## How It Works

### For Students
1. Receive instant transfers from parents abroad
2. Pay campus vendors by scanning QR codes
3. Track spending by category (food, transport, books)
4. Request emergency funds when needed

### For Parents
1. Send money instantly via Solana Pay (vs days with traditional services)
2. Monitor real-time spending with transaction notifications
3. Set spending limits and emergency fund controls
4. Pay significantly lower fees (under $1 vs $15-45)

### For Campus Vendors
1. Generate QR codes for specific payment amounts
2. Receive instant settlement confirmation
3. Avoid cash handling and change-making issues
4. Track daily sales with digital receipts

## Technical Implementation

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Blockchain**: Solana Pay SDK, Web3.js
- **Styling**: Tailwind CSS with Solana color scheme
- **PWA**: Service Worker, Push API, Background Sync
- **Deployment**: Vercel with automatic deployments

### Solana Pay Compliance
- Transaction request API endpoints (`/api/pay/*`)
- Proper reference-based payment tracking
- Error handling for failed transactions
- Address validation and security measures
- Real blockchain transactions (devnet for demo)

## Development Setup

```bash
# Clone repository
git clone https://github.com/Adedayoke/StudyPay.git
cd StudyPay

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Student: http://localhost:3000/student
# Parent: http://localhost:3000/parent
# Vendor: http://localhost:3000/vendor
```

## Hackathon Compliance

### Solana Pay Implementation ✅
- **Protocol Integration**: Full Solana Pay SDK implementation
- **Transaction Handling**: Comprehensive error management and confirmation flows
- **Security Measures**: Address validation, amount verification, fraud prevention

### Campus-Specific Utility ✅
- **Real Campus Needs**: Addresses food, transport, academic services, and emergency funds
- **User Research**: Based on actual challenges facing Nigerian university students
- **Multi-University Potential**: Scalable architecture for deployment across institutions

### Technical Excellence ✅
- **Production-Ready Code**: TypeScript, error handling, responsive design
- **Working Integration**: Actual Solana blockchain transactions (not simulations)
- **Modern Architecture**: Progressive Web App with offline capabilities

## Market Opportunity

Nigeria's diaspora community sends over $20 billion annually in remittances. With approximately 4+ million university students across Nigerian institutions, StudyPay addresses a significant market need for instant, affordable educational financial support.

The solution reduces costs by 90%+ compared to traditional remittance services while providing real-time spending transparency that parents currently lack.

## Project Status

**Build Status**: ✅ Successful compilation  
**Demo Status**: ✅ Fully functional on live URL  
**Integration Status**: ✅ Working Solana Pay transactions  
**Mobile Ready**: ✅ Progressive Web App with offline support

## Competition

**Built for**: University of Lagos Solana + AI Development Hackathon 2025  
**Track**: Campus Tools with Solana Pay  
**Developer**: Oke Habeeb (Lagos State University)

---

**Connecting Nigerian families through instant, affordable blockchain payments.**