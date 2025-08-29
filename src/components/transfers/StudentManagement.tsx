'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Alert, Badge } from '@/components/ui';
import { formatSOL, formatRelativeTime } from '@/lib/utils/formatting';
import BigNumber from 'bignumber.js';

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

interface StudentManagementProps {
  students: Student[];
  onStudentAdded: (student: Omit<Student, 'id' | 'isActive'>) => void;
  onStudentUpdated: (studentId: string, updates: Partial<Student>) => void;
}

export default function StudentManagement({ 
  students, 
  onStudentAdded, 
  onStudentUpdated 
}: StudentManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    walletAddress: '',
    monthlyLimit: ''
  });
  const [error, setError] = useState<string>('');

  const validateWalletAddress = (address: string): boolean => {
    // Basic Solana address validation (44 characters, base58)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const handleAddStudent = () => {
    setError('');
    
    // Validation
    if (!formData.name.trim()) {
      setError('Student name is required');
      return;
    }
    
    if (!formData.university.trim()) {
      setError('University name is required');
      return;
    }
    
    if (!validateWalletAddress(formData.walletAddress)) {
      setError('Please enter a valid Solana wallet address');
      return;
    }
    
    // Check if wallet already exists
    if (students.some(s => s.walletAddress === formData.walletAddress)) {
      setError('This wallet address is already connected');
      return;
    }

    const newStudent = {
      name: formData.name.trim(),
      university: formData.university.trim(),
      walletAddress: formData.walletAddress.trim(),
      currentBalance: new BigNumber(0),
      lastSeen: new Date(),
      totalReceived: new BigNumber(0),
      monthlyLimit: formData.monthlyLimit ? new BigNumber(formData.monthlyLimit) : undefined
    };

    onStudentAdded(newStudent);
    
    // Reset form
    setFormData({ name: '', university: '', walletAddress: '', monthlyLimit: '' });
    setShowAddForm(false);
  };

  const handleUpdateLimit = (studentId: string, newLimit: string) => {
    const limit = newLimit ? new BigNumber(newLimit) : undefined;
    onStudentUpdated(studentId, { monthlyLimit: limit });
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Connected Students</h3>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            + Add Student
          </Button>
        </div>

        {/* Students List */}
        {students.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h4 className="text-lg font-medium text-white mb-2">No Students Connected</h4>
            <p className="text-gray-400 mb-4">
              Add your children's wallet addresses to start sending money instantly.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Student
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="bg-[#2D2D2D] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-white">{student.name}</h4>
                      <Badge variant={student.isActive ? 'success' : 'secondary'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-400">
                        University: <span className="text-white">{student.university}</span>
                      </div>
                      <div className="text-gray-400">
                        Balance: <span className="text-white font-mono">{formatSOL(student.currentBalance)} SOL</span>
                      </div>
                      <div className="text-gray-400">
                        Wallet: <span className="text-white font-mono text-xs">
                          {student.walletAddress.slice(0, 8)}...{student.walletAddress.slice(-8)}
                        </span>
                      </div>
                      <div className="text-gray-400">
                        Last active: <span className="text-white">{formatRelativeTime(student.lastSeen)}</span>
                      </div>
                    </div>

                    {/* Monthly Limit */}
                    <div className="mt-3">
                      {editingStudent === student.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Monthly limit (SOL)"
                            defaultValue={student.monthlyLimit?.toString() || ''}
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateLimit(student.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input');
                              if (input) {
                                handleUpdateLimit(student.id, input.value);
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingStudent(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-400">Monthly limit: </span>
                            <span className="text-white">
                              {student.monthlyLimit ? `${formatSOL(student.monthlyLimit)} SOL` : 'No limit set'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingStudent(student.id)}
                          >
                            Edit Limit
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Statistics */}
                    {student.totalReceived && student.totalReceived.isGreaterThan(0) && (
                      <div className="mt-3 pt-3 border-t border-[#444]">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Total received:</span>
                            <div className="font-mono text-white">{formatSOL(student.totalReceived)} SOL</div>
                          </div>
                          <div>
                            <span className="text-gray-400">This month:</span>
                            <div className="font-mono text-white">
                              {/* This would be calculated from transaction history */}
                              0.0 SOL
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Add Student</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Student Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter student's full name"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  University
                </label>
                <Input
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="e.g., University of Lagos"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Student's Wallet Address
                </label>
                <Input
                  value={formData.walletAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                  placeholder="Solana wallet address (44 characters)"
                  className="w-full font-mono text-sm"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Ask your child to share their wallet address from their StudyPay account
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monthly Limit (Optional)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                  placeholder="Maximum SOL per month"
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <Alert type="error" className="mt-4">
                {error}
              </Alert>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', university: '', walletAddress: '', monthlyLimit: '' });
                  setError('');
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                className="flex-1"
              >
                Add Student
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
