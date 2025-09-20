/**
 * StudyPay Homepage
 * Clean landing page showcasing the wallet integration
 */

"use client";

import {
  WalletButton,
  WalletStatus,
  WalletGuard,
} from "@/components/wallet/WalletProvider";
import { Card, Button, Alert } from "@/components/ui";
import Logo from "@/components/ui/Logo";
import { StudyPayIcon } from "@/lib/utils/iconMap";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-student-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-text-primary mb-4">
            Instant Campus Payments
          </h2>
          <p className="text-base md:text-xl text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Connect diaspora parents with Nigerian students through fast,
            affordable Solana blockchain payments for food, transport, and
            campus services.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <StudyPayIcon name="speed" size={48} className="text-yellow-500" />
              </div>
              <h3 className="font-semibold mb-2 text-dark-text-primary">
                Instant Transfers
              </h3>
              <p className="text-sm text-dark-text-muted">
                30-second transfers vs 3-7 days
              </p>
            </Card>

            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <StudyPayIcon name="money" size={48} className="text-green-500" />
              </div>
              <h3 className="font-semibold mb-2 text-dark-text-primary">
                Low Fees
              </h3>
              <p className="text-sm text-dark-text-muted">
                $2 vs $45 Western Union fees
              </p>
            </Card>

            <Card className="text-center">
              <div className="flex justify-center mb-2">
                <StudyPayIcon name="student" size={48} className="text-blue-500" />
              </div>
              <h3 className="font-semibold mb-2 text-dark-text-primary">
                Campus Focused
              </h3>
              <p className="text-sm text-dark-text-muted">
                Built for university students
              </p>
            </Card>
          </div>
        </div>

        {/* Wallet Status Section */}
        <div className="mb-8">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
              Wallet Connection Status
            </h3>
            <WalletStatus />
          </Card>
        </div>

        {/* Demo Section */}
        <WalletGuard
          fallback={
            <Alert type="info" title="Connect Your Wallet">
              Connect your Phantom wallet to explore StudyPay features and see
              your Solana balance.
            </Alert>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="parent" size={24} className="text-solana-green-500" />
                <h3 className="text-lg font-semibold text-solana-green-500">
                  For Parents
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Send money to your children instantly from anywhere in the world
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.open("/parent", "_blank")}
              >
                Parent Dashboard
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="student" size={24} className="text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-600">
                  For Students
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Receive money instantly and pay for campus services with QR
                codes
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.open("/student", "_blank")}
              >
                Student Dashboard
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="vendor" size={24} className="text-green-600" />
                <h3 className="text-lg font-semibold text-green-600">
                  For Vendors
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Accept instant payments from students without cash hassles
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.open("/vendor", "_blank")}
              >
                Vendor Portal
              </Button>
            </Card>
          </div>
        </WalletGuard>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <Alert type="info">
            <strong>Hackathon Demo:</strong> This is a prototype built for the
            University of Lagos Solana + AI Development Hackathon. Currently
            running on Solana Devnet.
          </Alert>
        </div>
      </main>
    </div>
  );
}
