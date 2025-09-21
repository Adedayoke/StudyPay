/**
 * Vendor Dashboard Page
 * Interface for campus vendors to accept payments from students
 */

"use client";

import React from "react";
import { Card, Button, Alert, Badge } from "@/components/ui";
import { WalletGuard, WalletButton } from "@/components/wallet/WalletProvider";
import { StudyPayIcon } from "@/lib/utils/iconMap";
import { FoodPaymentQR } from "@/components/payments/SolanaPayQR";
import VendorAnalyticsDashboard from "@/components/analytics/VendorAnalyticsDashboard";
import { usePriceConversion } from "@/hooks/usePriceConversion";
import { useVendorDashboard } from "@/hooks/vendor";
import { useVendorPayments } from "@/hooks/vendor";
import { useVendorAnalytics } from "@/hooks/vendor";
import { BigNumber } from "bignumber.js";
import Logo from "@/components/ui/Logo";

export default function VendorDashboard() {
  const {
    balance,
    connected,
    publicKey,
    vendorInfo,
    vendorProfile,
    activeTab,
    setActiveTab,
    activePayments,
    setActivePayments,
    completedPayments,
    setCompletedPayments,
    handlePaymentComplete,
    totalToday,
    salesCount,
    averageSale,
    recentSales,
    hasCompletedPayments,
    isActive,
    // Currency formatting functions
    solToNaira,
    formatCurrency,
    formatNaira,
    formatSol
  } = useVendorDashboard();

  const {
    paymentRequests,
    isGeneratingQR,
    createPaymentRequest,
    getActiveRequests,
    getCompletedRequests,
    hasActiveRequests,
    hasCompletedRequests,
  } = useVendorPayments();

  const {
    todaysSales,
    weeklySales,
    monthlySales,
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    peakHours,
    hasPeakHours,
  } = useVendorAnalytics(completedPayments);

  return (
    <div className="min-h-screen bg-vendor-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo />
            </div>
            {/* <div className="flex items-center space-x-4"> */}
            <WalletButton />
            {/* </div> */}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold  mb-6">Vendor Portal</h1>
        <WalletGuard>
          {/* Vendor Info */}
          <div className="mb-8">
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-dark-text-primary">
                    {vendorInfo.businessName}
                  </h2>
                  <p className="text-dark-text-secondary">
                    {vendorInfo.category}
                  </p>
                  <p className="text-sm text-dark-text-muted">
                    {vendorInfo.location}
                  </p>
                  <Badge variant="success">
                    <div className="flex items-center gap-1">
                      {vendorInfo.isVerified ? (
                        <>
                          <StudyPayIcon name="verified" size={14} />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <StudyPayIcon name="warning" size={14} />
                          <span>Pending</span>
                        </>
                      )}
                    </div>
                  </Badge>
                </div>
                <div className="md:text-right">
                  <div className="text-sm text-dark-text-secondary">
                    Wallet Balance
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(solToNaira(new BigNumber(balance)), "NGN")}
                  </div>
                  <div className="text-sm text-dark-text-muted">
                    ≈{" "}
                    {formatCurrency(new BigNumber(balance), "SOL")}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-dark-border-primary">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-solana-purple-500 text-solana-purple-500"
                      : "border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StudyPayIcon name="analytics" size={16} />
                    <span>Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "analytics"
                      ? "border-solana-purple-500 text-solana-purple-500"
                      : "border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary"
                  }`}
                >
                  📈 Analytics
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "settings"
                      ? "border-solana-purple-500 text-solana-purple-500"
                      : "border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary"
                  }`}
                >
                  ⚙️ Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">{renderOverviewTab()}</div>
          )}

          {activeTab === "analytics" && vendorProfile && (
            <VendorAnalyticsDashboard
              vendor={vendorProfile}
              walletAddress={publicKey?.toBase58() || ""}
            />
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">{renderSettingsTab()}</div>
          )}
        </WalletGuard>
      </main>
    </div>
  );

  function renderOverviewTab() {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Generator */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
              Create Payment Request
            </h3>
            <FoodPaymentQR
              vendorWallet={publicKey?.toString()} // Pass connected wallet
              onPaymentGenerated={(url) => {
                console.log("Payment URL generated:", url);
                // Handle payment completion logic here
                handlePaymentComplete?.("demo-signature");
              }}
            />
          </div>

          {/* Sales Summary */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
                Today's Sales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {completedPayments.length}
                  </div>
                  <div className="text-sm text-dark-text-secondary">
                    Transactions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(solToNaira(totalToday), "NGN")}
                  </div>
                  <div className="text-sm text-dark-text-secondary">
                    Total Earned
                  </div>
                  <div className="text-xs text-dark-text-muted">
                    ≈ {formatCurrency(totalToday, "SOL")}
                  </div>
                </div>
              </div>
            </Card>

            {/* Active Payments */}
            {activePayments > 0 && (
              <Alert type="info" title="Active Payment Requests">
                You have {activePayments} pending payment request(s). Students
                can scan the QR code to pay.
              </Alert>
            )}

            {/* Quick Actions */}
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <h4 className="font-semibold mb-3 text-dark-text-primary">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab("analytics")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <StudyPayIcon name="analytics" size={16} />
                    <span>View Analytics</span>
                  </div>
                </Button>
                <Button variant="secondary" size="sm" className="w-full">
                  <div className="flex items-center justify-center gap-2">
                    <StudyPayIcon name="settings" size={16} />
                    <span>Manage Menu</span>
                  </div>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveTab("settings")}
                >
                  ⚙️ Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-dark-text-primary">
              Recent Transactions
            </h3>
            <Button size="sm" variant="secondary">
              Export Data
            </Button>
          </div>

          <div className="space-y-3">
            {completedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🍽️</div>
                  <div>
                    <div className="font-medium text-sm text-dark-text-primary">
                      {payment.description}
                    </div>
                    <div className="text-xs text-dark-text-muted">
                      {payment.time.toLocaleTimeString()} • Student:{" "}
                      {payment.studentId}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-green-500">
                    +{formatCurrency(solToNaira(payment.amount), "NGN")}
                  </div>
                  <div className="text-xs text-dark-text-muted">
                    ≈ {formatCurrency(payment.amount, "SOL")}
                  </div>
                </div>
              </div>
            ))}

            {completedPayments.length === 0 && (
              <div className="text-center py-8 text-dark-text-secondary">
                No transactions today. Create a payment request to get started!
              </div>
            )}
          </div>
        </Card>

        {/* Popular Items */}
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
            Popular Items Today
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🍛</div>
              <div className="font-medium text-dark-text-primary">
                Jollof Rice
              </div>
              <div className="text-sm text-dark-text-secondary">5 orders</div>
            </div>

            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🍗</div>
              <div className="font-medium text-dark-text-primary">
                Fried Chicken
              </div>
              <div className="text-sm text-dark-text-secondary">3 orders</div>
            </div>

            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🥤</div>
              <div className="font-medium text-dark-text-primary">
                Soft Drinks
              </div>
              <div className="text-sm text-dark-text-secondary">8 orders</div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function renderSettingsTab() {
    return (
      <>
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
            Business Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={vendorInfo.businessName}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Category
              </label>
              <input
                type="text"
                value={vendorInfo.category}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Location
              </label>
              <input
                type="text"
                value={vendorInfo.location}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
            Payment Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">
                  Auto-accept payments
                </h4>
                <p className="text-sm text-dark-text-secondary">
                  Automatically accept valid payments
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">
                  Send notifications
                </h4>
                <p className="text-sm text-dark-text-secondary">
                  Get notified of new payments
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
            Analytics Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">
                  Real-time updates
                </h4>
                <p className="text-sm text-dark-text-secondary">
                  Show live analytics updates
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">
                  Share anonymous data
                </h4>
                <p className="text-sm text-dark-text-secondary">
                  Help improve campus analytics
                </p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </Card>
      </>
    );
  }
}
