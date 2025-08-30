import { useState } from 'react';
import { Student } from './useParentDashboard';
import BigNumber from 'bignumber.js';

interface AddStudentForm {
  name: string;
  university: string;
  walletAddress: string;
  monthlyLimit: string;
}

export const useStudentManagement = (
  students: Student[],
  onStudentAdded: (student: Omit<Student, 'id' | 'isActive'>) => void,
  onStudentUpdated: (studentId: string, updates: Partial<Student>) => void
) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddStudentForm>({
    name: '',
    university: '',
    walletAddress: '',
    monthlyLimit: ''
  });
  const [error, setError] = useState<string>('');

  // Validation
  const validateWalletAddress = (address: string): boolean => {
    // Basic Solana address validation (44 characters, base58)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Student name is required';
    }
    
    if (!formData.university.trim()) {
      return 'University name is required';
    }
    
    if (!formData.walletAddress.trim()) {
      return 'Wallet address is required';
    }
    
    if (!validateWalletAddress(formData.walletAddress)) {
      return 'Please enter a valid Solana wallet address';
    }
    
    // Check if wallet already exists
    if (students.some(s => s.walletAddress === formData.walletAddress)) {
      return 'This wallet address is already connected';
    }

    return null;
  };

  const handleAddStudent = () => {
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
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
    resetForm();
  };

  const handleEditStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({
        name: student.name,
        university: student.university,
        walletAddress: student.walletAddress,
        monthlyLimit: student.monthlyLimit?.toString() || ''
      });
      setEditingStudent(studentId);
      setShowAddForm(true);
    }
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;

    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const updates: Partial<Student> = {
      name: formData.name.trim(),
      university: formData.university.trim(),
      walletAddress: formData.walletAddress.trim(),
      monthlyLimit: formData.monthlyLimit ? new BigNumber(formData.monthlyLimit) : undefined
    };

    onStudentUpdated(editingStudent, updates);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      university: '',
      walletAddress: '',
      monthlyLimit: ''
    });
    setShowAddForm(false);
    setEditingStudent(null);
    setError('');
  };

  const updateFormField = (field: keyof AddStudentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const toggleStudentStatus = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      onStudentUpdated(studentId, { isActive: !student.isActive });
    }
  };

  return {
    // Form state
    showAddForm,
    setShowAddForm,
    editingStudent,
    formData,
    error,
    
    // Form actions
    handleAddStudent,
    handleEditStudent,
    handleUpdateStudent,
    resetForm,
    updateFormField,
    openAddForm,
    
    // Student actions
    toggleStudentStatus,
    
    // Validation
    validateWalletAddress,
    canSubmit: !validateForm(),
    
    // Computed
    isEditing: !!editingStudent,
    hasStudents: students.length > 0,
    activeStudents: students.filter(s => s.isActive)
  };
};