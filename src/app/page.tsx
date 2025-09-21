/**
 * StudyPay Homepage
 * Complete Campus Marketplace Ecosystem Landing Page
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            {/* <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-solana-purple-400 via-white to-solana-green-400 bg-clip-text text-transparent">
              Nigeria's First
            </h1> */}
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-solana-purple-400 via-white to-solana-green-400 bg-clip-text text-transparent mb-4">
              Campus Digital Marketplace
            </h2>
            <div className="inline-flex items-center gap-2 bg-solana-purple-500/20 border border-solana-purple-400/30 rounded-full px-4 py-2 mb-6">
              <StudyPayIcon name="trophy" size={20} className="text-solana-purple-400" />
              <span className="text-sm font-medium text-solana-purple-300">
                Solana Students Africa Hackathon
              </span>
            </div>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            <span className="font-semibold text-white">Complete ecosystem</span> connecting
            <span className="text-solana-green-400 font-semibold"> 500K+ students</span>,
            <span className="text-solana-purple-400 font-semibold"> diaspora parents</span>, and
            <span className="text-yellow-400 font-semibold"> 10K+ campus vendors</span> through
            instant Solana Pay transactions
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-solana-purple-500 to-solana-green-500 hover:from-solana-purple-600 hover:to-solana-green-600 text-white font-semibold px-8 py-4 text-lg"
              onClick={() => window.open("/marketplace", "_blank")}
            >
              <StudyPayIcon name="store" size={24} className="mr-3" />
              Explore Campus Marketplace
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="border-solana-purple-400/50 text-solana-purple-300 hover:bg-solana-purple-500/10 px-8 py-4 text-lg"
              onClick={() => window.open("/student", "_blank")}
            >
              <StudyPayIcon name="student" size={24} className="mr-3" />
              Student Experience
            </Button>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center bg-gradient-to-br from-solana-purple-500/10 to-solana-purple-600/5 border-solana-purple-400/20">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-solana-purple-500/20 rounded-full">
                <StudyPayIcon name="store" size={32} className="text-solana-purple-400" />
              </div>
            </div>
            <h3 className="font-bold mb-2 text-white text-lg">
              Complete Marketplace
            </h3>
            <p className="text-sm text-gray-300">
              16+ verified campus vendors with real menus and instant ordering
            </p>
          </Card>

          <Card className="text-center bg-gradient-to-br from-solana-green-500/10 to-solana-green-600/5 border-solana-green-400/20">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-solana-green-500/20 rounded-full">
                <StudyPayIcon name="speed" size={32} className="text-solana-green-400" />
              </div>
            </div>
            <h3 className="font-bold mb-2 text-white text-lg">
              Instant Payments
            </h3>
            <p className="text-sm text-gray-300">
              30-second Solana Pay transactions with real blockchain settlement
            </p>
          </Card>

          <Card className="text-center bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-400/20">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <StudyPayIcon name="analytics" size={32} className="text-yellow-400" />
              </div>
            </div>
            <h3 className="font-bold mb-2 text-white text-lg">
              Real-Time Analytics
            </h3>
            <p className="text-sm text-gray-300">
              Business intelligence dashboards for students, vendors, and universities
            </p>
          </Card>

          <Card className="text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-400/20">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <StudyPayIcon name="mobile" size={32} className="text-blue-400" />
              </div>
            </div>
            <h3 className="font-bold mb-2 text-white text-lg">
              Offline PWA
            </h3>
            <p className="text-sm text-gray-300">
              Installable mobile app that works without internet connectivity
            </p>
          </Card>
        </div>

        {/* Ecosystem Overview */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              Complete Campus Ecosystem
            </h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              StudyPay isn't just payments - it's Nigeria's first comprehensive digital campus economy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - User Types */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 border-solana-purple-400/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-solana-purple-500/20 rounded-lg">
                    <StudyPayIcon name="student" size={24} className="text-solana-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">For Students</h4>
                    <p className="text-sm text-gray-300">Browse vendors → Order → Pay instantly</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Discover 16+ campus vendors by category</li>
                  <li>• Real-time menus with availability</li>
                  <li>• QR payments settling in 30 seconds</li>
                  <li>• Spending insights and budget tracking</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-r from-solana-green-500/10 to-yellow-500/10 border-solana-green-400/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-solana-green-500/20 rounded-lg">
                    <StudyPayIcon name="parent" size={24} className="text-solana-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">For Parents</h4>
                    <p className="text-sm text-gray-300">Send money → Track spending → Set budgets</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• $0.50 instant transfers vs $45 fees</li>
                  <li>• Real-time spending visibility</li>
                  <li>• Smart budget alerts and limits</li>
                  <li>• Emergency fund capabilities</li>
                </ul>
              </Card>
            </div>

            {/* Right Column - Business Side */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <StudyPayIcon name="vendor" size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">For Vendors</h4>
                    <p className="text-sm text-gray-300">List products → Receive orders → Get paid</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Zero POS fees (keep 99.5% of revenue)</li>
                  <li>• Real-time order notifications</li>
                  <li>• Sales analytics and insights</li>
                  <li>• No chargebacks or payment disputes</li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <StudyPayIcon name="books" size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">For Universities</h4>
                    <p className="text-sm text-gray-300">Track economy → Collect fees → Manage vendors</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Campus economic activity dashboard</li>
                  <li>• Direct fee collection integration</li>
                  <li>• Vendor verification and management</li>
                  <li>• Multi-university scalability</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        {/* Hackathon Context */}
        {/* <div className="mb-12">
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <StudyPayIcon name="trophy" size={32} className="text-red-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Solana Students Africa Hackathon
              </h3>
              <p className="text-gray-300 mb-4">
                <span className="font-semibold text-solana-purple-400">Campus Tools with Solana Pay</span> Track
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="font-bold text-red-400">1st Place</div>
                  <div className="text-gray-300">$2,000 USDC</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-3">
                  <div className="font-bold text-orange-400">2nd Place</div>
                  <div className="text-gray-300">$1,500 USDC</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3">
                  <div className="font-bold text-yellow-400">3rd Place</div>
                  <div className="text-gray-300">$500 USDC</div>
                </div>
              </div>
            </div>
          </Card>
        </div> */}

        {/* Wallet Status Section */}
        <div className="mb-8">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
              Connect Your Solana Wallet
            </h3>
            <WalletStatus />
          </Card>
        </div>

        {/* Demo Section */}
        <WalletGuard
          fallback={
            <Alert type="info" title="Connect Your Wallet">
              Connect your Phantom wallet to explore the complete StudyPay marketplace ecosystem and experience real Solana Pay transactions.
            </Alert>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="store" size={24} className="text-solana-purple-400" />
                <h3 className="text-lg font-semibold text-solana-purple-400">
                  Campus Marketplace
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Browse 16+ verified vendors, filter by category, and place orders with real menus
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-solana-purple-500 hover:bg-solana-purple-600"
                onClick={() => window.open("/marketplace", "_blank")}
              >
                Explore Marketplace
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="student" size={24} className="text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-600">
                  Student Dashboard
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Receive money instantly, browse vendors, place orders, and track spending
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.open("/student", "_blank")}
              >
                Student Experience
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="parent" size={24} className="text-solana-green-600" />
                <h3 className="text-lg font-semibold text-solana-green-600">
                  Parent Dashboard
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Send money instantly, track spending, set budgets, and manage allowances
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-solana-green-500 hover:bg-solana-green-600"
                onClick={() => window.open("/parent", "_blank")}
              >
                Parent Portal
              </Button>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="vendor" size={24} className="text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-600">
                  Vendor Dashboard
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Manage your business, receive orders, track sales, and get paid instantly
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
            <strong>Hackathon Demo:</strong> Experience Nigeria's first complete campus digital marketplace ecosystem.
            Built for the University of Lagos Solana + AI Development Hackathon 2025.
          </Alert>
        </div>
      </main>
    </div>
  );
}
