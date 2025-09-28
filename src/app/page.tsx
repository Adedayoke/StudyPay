/**
 * StudyPay Homepage
 * Campus Payment System with Solana Pay Integration
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-solana-purple-400 via-white to-solana-green-400 bg-clip-text text-transparent">
              StudyPay
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Campus Payments with Solana Pay
            </h2>
            <div className="inline-flex items-center gap-2 bg-solana-purple-500/20 border border-solana-purple-400/30 rounded-full px-4 py-2 mb-6">
              <StudyPayIcon name="speed" size={20} className="text-solana-purple-400" />
              <span className="text-sm font-medium text-solana-purple-300">
                Solana + AI Students Hackathon Entry
              </span>
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            <span className="font-semibold text-white">Instant, low-cost payments</span> connecting 
            Nigerian students with diaspora parents through blockchain technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-solana-purple-500 to-solana-green-500 hover:from-solana-purple-600 hover:to-solana-green-600 text-white font-semibold px-8 py-4 text-lg"
              onClick={() => window.open("/student", "_blank")}
            >
              <StudyPayIcon name="student" size={24} className="mr-3" />
              Try Student Demo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="border-solana-purple-400/50 text-solana-purple-300 hover:bg-solana-purple-500/10 px-8 py-4 text-lg"
              onClick={() => window.open("/parent", "_blank")}
            >
              <StudyPayIcon name="parent" size={24} className="mr-3" />
              Parent Dashboard
            </Button>
          </div>
        </div>

        {/* Problem & Solution */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problem */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/30">
              <h3 className="text-xl font-bold text-white mb-4">The Problem</h3>
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-red-400 font-semibold">$15-45 fees</span> for Western Union/MoneyGram transfers</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-orange-400 font-semibold">3-7 days</span> waiting for money to arrive</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-yellow-400 font-semibold">No spending visibility</span> for parents sending money</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-red-500 font-semibold">Cash-only</span> campus transactions create friction</span>
                </li>
              </ul>
            </Card>

            {/* Solution */}
            <Card className="bg-gradient-to-r from-solana-green-500/10 to-solana-purple-500/10 border-solana-green-400/30">
              <h3 className="text-xl font-bold text-white mb-4">The Solution</h3>
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-solana-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-solana-green-400 font-semibold">30-second transfers</span> with Solana Pay</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-solana-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-solana-purple-400 font-semibold">Sub-dollar fees</span> instead of $15-45</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-blue-400 font-semibold">Real-time notifications</span> for all transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><span className="text-green-400 font-semibold">QR code payments</span> at campus vendors</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              Working Solana Pay Integration
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Functional blockchain transactions demonstrating real-world campus payment flows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center bg-gradient-to-br from-solana-purple-500/10 to-solana-purple-600/5 border-solana-purple-400/20">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-solana-purple-500/20 rounded-full">
                  <StudyPayIcon name="parent" size={32} className="text-solana-purple-400" />
                </div>
              </div>
              <h3 className="font-bold mb-2 text-white text-lg">
                Parent Transfers
              </h3>
              <p className="text-sm text-gray-300">
                Send money instantly from abroad with real Solana Pay transactions
              </p>
            </Card>

            <Card className="text-center bg-gradient-to-br from-solana-green-500/10 to-solana-green-600/5 border-solana-green-400/20">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-solana-green-500/20 rounded-full">
                  <StudyPayIcon name="student" size={32} className="text-solana-green-400" />
                </div>
              </div>
              <h3 className="font-bold mb-2 text-white text-lg">
                Campus Payments
              </h3>
              <p className="text-sm text-gray-300">
                Students pay vendors via QR codes with blockchain confirmation
              </p>
            </Card>

            <Card className="text-center bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-400/20">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <StudyPayIcon name="analytics" size={32} className="text-yellow-400" />
                </div>
              </div>
              <h3 className="font-bold mb-2 text-white text-lg">
                Transaction Tracking
              </h3>
              <p className="text-sm text-gray-300">
                Real-time spending visibility with blockchain verification
              </p>
            </Card>
          </div>
        </div>

        {/* User Journey */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              How It Works
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 border-solana-purple-400/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-solana-purple-500/20 rounded-lg">
                  <StudyPayIcon name="student" size={24} className="text-solana-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">For Students</h4>
                </div>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Receive money instantly from parents</li>
                <li>• Pay campus vendors with QR codes</li>
                <li>• Track spending by category</li>
                <li>• Get balance alerts and notifications</li>
              </ul>
            </Card>

            <Card className="bg-gradient-to-r from-solana-green-500/10 to-yellow-500/10 border-solana-green-400/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-solana-green-500/20 rounded-lg">
                  <StudyPayIcon name="parent" size={24} className="text-solana-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">For Parents</h4>
                </div>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Send money in 30 seconds vs 3-7 days</li>
                <li>• Pay under $1 fees instead of $15-45</li>
                <li>• See real-time spending notifications</li>
                <li>• Set emergency fund controls</li>
              </ul>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <StudyPayIcon name="vendor" size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">For Vendors</h4>
                </div>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Generate QR codes for payments</li>
                <li>• Receive instant confirmations</li>
                <li>• Avoid cash handling issues</li>
                <li>• Track sales digitally</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
              Connect Your Solana Wallet to Try the Demo
            </h3>
            <WalletStatus />
          </Card>
        </div>

        {/* Demo Links */}
        <WalletGuard
          fallback={
            <Alert type="info" title="Connect Your Wallet">
              Connect your Phantom wallet to experience working Solana Pay transactions in the demo.
            </Alert>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <StudyPayIcon name="student" size={24} className="text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-600">
                  Student Dashboard
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Receive funds, pay vendors via QR codes, track spending with real blockchain transactions
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => window.open("/student", "_blank")}
              >
                Try Student Demo
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
                Send money instantly, monitor spending, experience diaspora-to-student transfers
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-solana-green-500 hover:bg-solana-green-600"
                onClick={() => window.open("/parent", "_blank")}
              >
                Parent Experience
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
                Generate payment QR codes, receive orders, track sales with instant settlement
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

        {/* Technical Details */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-solana-purple-500/10 to-solana-green-500/10 border border-solana-purple-400/30 rounded-xl p-6">
            <div className="text-center">
              <h4 className="text-xl font-bold text-white mb-2">Built for Solana + AI Students Hackathon</h4>
              <p className="text-gray-300 mb-4">
                Demonstrating real Solana Pay integration for campus-specific payment solutions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-solana-purple-500/20 rounded-lg p-3">
                  <div className="font-bold text-solana-purple-400">Working Blockchain</div>
                  <div className="text-gray-300">Real Solana Pay transactions</div>
                </div>
                <div className="bg-solana-green-500/20 rounded-lg p-3">
                  <div className="font-bold text-solana-green-400">Campus Focus</div>
                  <div className="text-gray-300">Student-vendor-parent ecosystem</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-3">
                  <div className="font-bold text-yellow-400">Nigerian Context</div>
                  <div className="text-gray-300">Diaspora remittance solution</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}