/**
 * Student Dashboard Page
 * Main interface for students to manage their wallet and payments
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, Button, Alert, Badge } from "@/components/ui";
import { WalletGuard, WalletButton } from "@/components/wallet/WalletProvider";
import { StudyPayIcon } from "@/lib/utils/iconMap";
import {
  SolanaPayScanner,
  PaymentConfirmation,
} from "@/components/payments/SolanaPayQR";
import TransactionHistory from "@/components/transactions/TransactionHistory";
import VendorDiscovery from "@/components/vendors/VendorDiscovery";
import VendorProfileView from "@/components/vendors/VendorProfileView";
import StudentInsightsDashboard from "@/components/analytics/StudentInsightsDashboard";
import ShoppingCart from "@/components/cart/ShoppingCart";
import { useStudentDashboard, useQRPayment } from "@/hooks/student";
import { formatCurrency, solToNaira } from "@/lib/solana/utils";
import { usePriceConversion } from "@/hooks/usePriceConversion";
import {
  PWAStatusIndicator,
  PWANotificationPermission,
} from "@/components/pwa/PWAComponents";
import { BigNumber } from "bignumber.js";
import Logo from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";
import { cartService } from "@/lib/services/cartService";

export default function StudentDashboard() {
  const { publicKey } = useWallet();

  const {
    balance,
    connected,
    refreshBalance,
    activeTab,
    setActiveTab,
    transactions,
    transactionsLoading,
    refreshingBlockchain,
    refreshBlockchainTransactions,
    loadTransactions,
    selectedVendor,
    handleVendorSelect,
    handleVendorClose,
    refreshAfterPayment,
    recentTransactions,
    hasTransactions,
    isLowBalance,
  } = useStudentDashboard();

  const {
    showScanner,
    paymentUrl,
    showConfirmation,
    handleQRScanned,
    handlePaymentConfirm,
    handlePaymentCancel,
    openScanner,
    closeScanner,
  } = useQRPayment();
  const { convertSolToNaira, isLoading: priceLoading, error: priceError } = usePriceConversion();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [navMenu, setNavMenu] = useState(false)
  // Wrapper functions to maintain compatibility
  const solToNaira = (amount: BigNumber) => convertSolToNaira(amount).amount;
  const formatCurrency = (amount: BigNumber, currency: string) => {
    if (currency === 'SOL') {
      return `${amount.toFixed(4)} SOL`;
    } else if (currency === 'NGN') {
      return `₦${amount.toFormat(2)}`;
    }
    return amount.toString();
  };

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      setCartItemCount(cartService.getItemCount());
    };

    updateCartCount();
    const interval = setInterval(updateCartCount, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-student-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab("cart")}
                className="relative"
              >
                <StudyPayIcon name="cart" size={16} />
                {cartItemCount > 0 && (
                  <Badge
                    variant="primary"
                    className="absolute -top-2 -right-2 text-xs px-1 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
              
              {/* <PWAStatusIndicator /> */}
              {/* <Badge variant="success">Student</Badge> */}
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <div className="block md:hidden relative">
                {navMenu ? (
                  <>
                    <X onClick={() => setNavMenu(false)} />
                  </>
                ) : (
                  <Menu onClick={() => setNavMenu(!navMenu)} />
                )}
                {navMenu && (
                  <ul className="absolute right-0 mt-2 w-52 bg-dark-bg-secondary border border-dark-border-primary rounded-lg shadow-lg z-10 p-2 flex flex-col gap-2">
                    <li
                      onClick={() => setActiveTab("overview")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "overview"
                          ? "border-[#9945FF] text-[#9945FF]"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                      }`}
                    >
                      Overview
                    </li>
                    <li
                      onClick={() => setActiveTab("transactions")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "transactions"
                          ? "border-[#9945FF] text-[#9945FF]"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                      }`}
                    >
                      Transaction History
                      {transactions.length > 0 && (
                        <span className="ml-2 bg-[#9945FF] text-white text-xs rounded-full px-2 py-1">
                          {transactions.length}
                        </span>
                      )}
                    </li>
                    <li
                      onClick={() => {
                        setActiveTab("vendors");
                        handleVendorClose();
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "vendors"
                          ? "border-[#9945FF] text-[#9945FF]"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                      }`}
                    >
                      🏪 Discover Vendors
                    </li>
                    <li
                      onClick={() => setActiveTab("cart")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "cart"
                          ? "border-[#9945FF] text-[#9945FF]"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                      }`}
                    >
                      🛒 Cart
                    </li>
                  </ul>
                )}
              </div>
            </div>
            <div className="border-b border-[#333]">
              <nav className="-mb-px hidden md:flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-[#9945FF] text-[#9945FF]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "transactions"
                      ? "border-[#9945FF] text-[#9945FF]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  Transaction History
                  {transactions.length > 0 && (
                    <span className="ml-2 bg-[#9945FF] text-white text-xs rounded-full px-2 py-1">
                      {transactions.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("vendors");
                    handleVendorClose();
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "vendors"
                      ? "border-[#9945FF] text-[#9945FF]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  🏪 Discover Vendors
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "insights"
                      ? "border-[#9945FF] text-[#9945FF]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StudyPayIcon name="analytics" size={16} />
                    <span>Insights</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("cart")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "cart"
                      ? "border-[#9945FF] text-[#9945FF]"
                      : "border-transparent text-gray-400 hover:text-white hover:border-gray-300"
                  }`}
                >
                  🛒 Cart
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <>
              {/* Balance Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <h3 className="text-lg font-semibold mb-3">
                    Current Balance
                  </h3>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-solana-purple-500">
                      {formatCurrency(
                        solToNaira(new BigNumber(balance)),
                        "NGN"
                      )}
                    </div>
                    <div className="text-lg text-gray-600">
                      ≈{" "}
                      {formatCurrency(new BigNumber(balance), "SOL")}
                    </div>
                    <Button
                      onClick={refreshBalance}
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button onClick={openScanner} className="w-full">
                      <div className="flex items-center justify-center gap-2">
                        <StudyPayIcon name="scan" size={16} />
                        <span>Scan & Pay</span>
                      </div>
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setActiveTab("transactions")}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <StudyPayIcon name="analytics" size={16} />
                        <span>View Transactions</span>
                      </div>
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === "transactions" && (
            <TransactionHistory
              transactions={transactions}
              isLoading={transactionsLoading}
            />
          )}

          {activeTab === "vendors" && (
            <>
              {selectedVendor ? (
                <VendorProfileView
                  vendor={selectedVendor}
                  onBack={handleVendorClose}
                  onPaymentRequest={(amount, memo) => {
                    // Handle payment request - could integrate with existing QR payment flow
                    console.log("Payment requested:", {
                      amount: amount.toString(),
                      memo,
                    });
                    // Refresh transactions after payment
                    loadTransactions();
                  }}
                />
              ) : (
                <VendorDiscovery
                  onVendorSelect={handleVendorSelect}
                  showSearch={true}
                />
              )}
            </>
          )}

          {activeTab === "insights" && (
            <StudentInsightsDashboard
              walletAddress={publicKey?.toBase58() || ""}
              studentId={`student_${
                publicKey?.toBase58().slice(-8) || "unknown"
              }`}
            />
          )}

          {activeTab === "cart" && (
            <ShoppingCart
              onOrderPlaced={(orderId) => {
                // Refresh transactions after order is placed
                loadTransactions();
                // Switch back to transactions tab to show the new order
                setActiveTab("transactions");
              }}
            />
          )}

          {/* Recent Activity - only show on overview */}
          {activeTab === "overview" && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-2">
                    <StudyPayIcon name="analytics" size={48} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your payment history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-[#2D2D2D] rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">
                          {tx.status === "confirmed"
                            ? "✅"
                            : tx.status === "pending"
                            ? "⏳"
                            : "❌"}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {tx.purpose || "Campus Payment"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">
                          ₦{solToNaira(new BigNumber(tx.amount)).toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-400">{tx.status}</div>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 3 && (
                    <Button
                      variant="secondary"
                      className="w-full mt-3"
                      onClick={() => setActiveTab("transactions")}
                    >
                      View All Transactions ({transactions.length})
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Low Balance Alert */}
          {balance < 0.1 && (
            <Alert type="warning" className="mb-6" title="Low Balance">
              Your balance is running low. Consider requesting money from your
              parents or guardian to continue making campus payments.
            </Alert>
          )}

          {/* Recent Transactions */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <Button size="sm" variant="secondary">
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto"></div>
                  <p className="mt-2 text-dark-text-secondary">
                    Loading transactions...
                  </p>
                </div>
              ) : transactions.length > 0 ? (
                <>
                  {/* Show transaction type indicator */}
                  {transactions.some((tx) => tx.isBlockchainTransaction) && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-dark-text-secondary">
                          Live blockchain data
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={refreshBlockchainTransactions}
                        disabled={refreshingBlockchain}
                      >
                        {refreshingBlockchain ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          "🔄 Refresh"
                        )}
                      </Button>
                    </div>
                  )}

                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border-primary"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {tx.category === "food" && <StudyPayIcon name="food" size={24} className="text-orange-500" />}
                          {tx.category === "transport" && <StudyPayIcon name="transport" size={24} className="text-blue-500" />}
                          {tx.category === "books" && <StudyPayIcon name="books" size={24} className="text-green-500" />}
                          {tx.category === "services" && <StudyPayIcon name="services" size={24} className="text-purple-500" />}
                          {tx.category === "electronics" && <StudyPayIcon name="other" size={24} className="text-gray-500" />}
                          {tx.category === "printing" && <StudyPayIcon name="other" size={24} className="text-gray-500" />}
                          {tx.category === "micro" && <StudyPayIcon name="money" size={24} className="text-yellow-500" />}
                          {tx.category === "snacks" && <StudyPayIcon name="food" size={24} className="text-red-500" />}
                          {![
                            "food",
                            "transport",
                            "books",
                            "services",
                            "electronics",
                            "printing",
                            "micro",
                            "snacks",
                          ].includes(tx.category) && <StudyPayIcon name="payment" size={24} className="text-gray-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-dark-text-primary">
                            {tx.description}
                          </div>
                          <div className="text-xs text-dark-text-secondary flex flex-col gap md:flex-row md:items-center md:space-x-2">
                            <span>
                              {tx.timestamp.toLocaleDateString()}{" "}
                              {tx.timestamp.toLocaleTimeString()}
                            </span>
                            {tx.isBlockchainTransaction && (
                              <Badge
                                variant="primary"
                                className="text-xs px-1 py-0 w-fit"
                              >
                                Blockchain
                              </Badge>
                            )}
                            {tx.otherPartyName && (
                              <span>• {tx.otherPartyName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            tx.type === "incoming"
                              ? "text-green-500"
                              : "text-red-400"
                          }`}
                        >
                          {tx.type === "incoming" ? "+" : "-"}
                          ₦{solToNaira(tx.amount).toFixed(0)}
                        </div>
                        <div className="text-xs text-dark-text-secondary">
                          ≈ {formatCurrency(tx.amount, "SOL")}
                        </div>
                        <Badge
                          variant={
                            tx.status === "confirmed" ? "success" : "warning"
                          }
                          className="text-xs mt-1"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-dark-text-secondary">
                  {connected ? (
                    <div>
                      <p>No transactions found.</p>
                      <p className="text-sm mt-2">
                        {publicKey
                          ? "Try making a payment or refreshing blockchain data."
                          : "Connect your wallet to see transactions."}
                      </p>
                      {publicKey && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-3"
                          onClick={refreshBlockchainTransactions}
                          disabled={refreshingBlockchain}
                        >
                          {refreshingBlockchain
                            ? "Checking blockchain..."
                            : "Check blockchain transactions"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    "Connect your wallet to view transactions."
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Spending Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {(() => {
              // Calculate spending by category from real transactions
              const categorySpending = transactions
                .filter(
                  (tx) => tx.type === "outgoing" && tx.status === "confirmed"
                )
                .reduce((acc, tx) => {
                  const category = tx.category || "other";
                  acc[category] = (acc[category] || new BigNumber(0)).plus(
                    tx.amount
                  );
                  return acc;
                }, {} as Record<string, BigNumber>);

              const categories = [
                { key: "food", icon: "food", label: "Food & Drinks", color: "text-orange-500" },
                { key: "transport", icon: "transport", label: "Transport", color: "text-blue-500" },
                { key: "books", icon: "books", label: "Academic", color: "text-green-500" },
              ] as const;

              return categories.map((category) => (
                <Card
                  key={category.key}
                  className="text-center bg-dark-bg-secondary border-dark-border-primary"
                >
                  <div className="flex justify-center mb-2">
                    <StudyPayIcon name={category.icon} size={32} className={category.color} />
                  </div>
                  <div className="text-sm text-dark-text-secondary">
                    {category.label}
                  </div>
                  <div className="font-semibold text-dark-text-primary">
                    {categorySpending[category.key]
                      ? `₦${solToNaira(categorySpending[category.key]).toFixed(0)}`
                      : "₦0"}
                  </div>
                  <div className="text-xs text-dark-text-secondary mt-1">
                    ≈{" "}
                    {categorySpending[category.key]
                      ? formatCurrency(categorySpending[category.key], "SOL")
                      : "0.000 SOL"}
                  </div>
                </Card>
              ));
            })()}
          </div>
        </WalletGuard>
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Payment QR</h3>
              <button
                onClick={closeScanner}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SolanaPayScanner
              onPaymentDetected={handleQRScanned}
              onError={(error) => console.error("Scanner error:", error)}
            />
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showConfirmation && paymentUrl && (
        <PaymentConfirmation
          paymentURL={paymentUrl}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
          isVisible={showConfirmation}
        />
      )}
    </div>
  );
}
