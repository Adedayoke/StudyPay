/**
 * Parent Dashboard Page
 * Interface for diaspora parents to send money to their children
 */

"use client";

import React from "react";
import { Card, Button, Alert, Badge, Input } from "@/components/ui";
import {
  WalletGuard,
} from "@/components/wallet/WalletProvider";
import ParentTransfer from "@/components/transfers/ParentTransfer";
import StudentManagement from "@/components/transfers/StudentManagement";
import TransactionHistory from "@/components/transactions/TransactionHistory";
import { formatCurrency, solToNaira } from "@/lib/solana/utils";
import { getMockStudentAddress } from "@/lib/solana/payment";
import BigNumber from "bignumber.js";
import { useParentDashboard } from "@/hooks/parent";

interface Student {
  id: string;
  name: string;
  university: string;
  walletAddress: string;
  currentBalance: BigNumber;
  lastSeen: Date;
  totalReceived?: BigNumber;
  monthlyLimit?: BigNumber;
  isActive: boolean;
}

// Initial mock students data
const initialStudents: Student[] = [
  {
    id: "student_1",
    name: "Funmi Adebayo",
    university: "University of Lagos",
    currentBalance: new BigNumber(0.15),
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    walletAddress: getMockStudentAddress(), // Using proper base58 address
    totalReceived: new BigNumber(2.4),
    monthlyLimit: new BigNumber(5.0),
    isActive: true,
  },
];

export default function ParentDashboard() {
  const {
    balance,
    activeTab,
    setActiveTab,
    transactions,
    transactionsLoading,
    handleTransferComplete,
    recentTransfers,
    students,
    connectedStudents,
    handleStudentAdded,
    handleStudentUpdated,
    totalSentThisMonth
  } = useParentDashboard();

  // Mock data for charts and recent transfers
  const spendingData = [
    { category: "Food & Dining", amount: new BigNumber(1.2), percentage: 40 },
    { category: "Transport", amount: new BigNumber(0.6), percentage: 20 },
    {
      category: "Academic Materials",
      amount: new BigNumber(0.9),
      percentage: 30,
    },
    { category: "Emergency", amount: new BigNumber(0.3), percentage: 10 },
  ];

  // const recentTransfers = transactions.slice(0, 3);

  return (
    <div className="min-h-screen bg-parent-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-solana-purple-500">
                StudyPay
              </h1>
              <span className="ml-2 text-sm text-dark-text-secondary">
                Parent Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="primary">Parent Account</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Tab Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              {[
                { key: "overview", label: "📊 Overview" },
                { key: "transfer", label: "💸 Send Money" },
                { key: "students", label: "👥 Manage Students" },
                { key: "history", label: "📋 Transaction History" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? "bg-solana-purple-500 text-white"
                      : "text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-bg-tertiary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Account Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(new BigNumber(balance), "SOL")}
                      </div>
                      <div className="text-sm text-gray-600">Wallet Balance</div>
                      <div className="text-xs text-gray-500">
                        ≈{" "}
                        {formatCurrency(solToNaira(new BigNumber(balance)), "NGN")}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalSentThisMonth, "SOL")}
                      </div>
                      <div className="text-sm text-gray-600">Sent This Month</div>
                      <div className="text-xs text-gray-500">
                        ≈ {formatCurrency(solToNaira(totalSentThisMonth), "NGN")}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {connectedStudents.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Connected Students
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h4 className="font-semibold mb-3">Quick Actions</h4>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setActiveTab("transfer")}
                      className="w-full"
                    >
                      💸 Send Money
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("students")}
                      variant="secondary" 
                      className="w-full"
                    >
                      👥 Manage Students
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("history")}
                      variant="secondary" 
                      className="w-full"
                    >
                      📋 View History
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Connected Students */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Connected Students</h3>
                  <div className="space-y-4">
                    {connectedStudents.map((student) => (
                      <div key={student.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-gray-600">
                              {student.university}
                            </p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Current Balance:</span>
                            <div className="font-semibold">
                              {formatCurrency(student.currentBalance, "SOL")}
                            </div>
                            <div className="text-xs text-gray-500">
                              ≈{" "}
                              {formatCurrency(
                                solToNaira(student.currentBalance),
                                "NGN"
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Seen:</span>
                            <div className="text-xs">
                              {student.lastSeen.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => setActiveTab("transfer")}
                        >
                          Send Money to {student.name.split(" ")[0]}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Transfers */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
                  <div className="space-y-3">
                    {recentTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">💰</div>
                          <div>
                            <div className="font-medium text-sm">
                              {transfer.purpose || "Student Transfer"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transfer.timestamp.toLocaleDateString()}{" "}
                              {transfer.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(transfer.amount, "SOL")}
                          </div>
                          <div className="text-xs text-gray-500">
                            ≈ {formatCurrency(solToNaira(transfer.amount), "NGN")}
                          </div>
                          <Badge variant="success" className="text-xs mt-1">
                            {transfer.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "transfer" && (
            <ParentTransfer
              students={students}
              onTransferComplete={handleTransferComplete}
            />
          )}

          {activeTab === "students" && (
            <StudentManagement
              students={students}
              onStudentAdded={handleStudentAdded}
              onStudentUpdated={handleStudentUpdated}
            />
          )}

          {activeTab === "history" && (
            <TransactionHistory
              transactions={transactions}
              isLoading={transactionsLoading}
            />
          )}
        </WalletGuard>
      </main>
    </div>
  );
}
