import { renderHook, act, waitFor } from '@testing-library/react'
import { useStudentDashboard } from '@/hooks/useStudentDashboard'

// Mock the required modules
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
  useConnection: jest.fn()
}))

jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn().mockImplementation((key) => ({ toString: () => key })),
  LAMPORTS_PER_SOL: 1000000000,
  Transaction: jest.fn(),
  SystemProgram: {
    transfer: jest.fn()
  }
}))

jest.mock('@/lib/utils/transactionStorage', () => ({
  addTransaction: jest.fn(),
  getTransactionsForAddress: jest.fn()
}))

jest.mock('@/lib/utils/currency', () => ({
  formatSolAmount: jest.fn((amount) => `${amount} SOL`),
  convertSolToUsd: jest.fn((amount) => amount * 100) // Mock 1 SOL = $100
}))

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { addTransaction, getTransactionsForAddress } from '@/lib/utils/transactionStorage'

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseConnection = useConnection as jest.MockedFunction<typeof useConnection>
const mockAddTransaction = addTransaction as jest.MockedFunction<typeof addTransaction>
const mockGetTransactions = getTransactionsForAddress as jest.MockedFunction<typeof getTransactionsForAddress>

describe('useStudentDashboard Hook', () => {
  const mockConnection = {
    getBalance: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn()
  }

  const mockWallet = {
    publicKey: { toString: () => 'student-wallet-address' },
    connected: true,
    signTransaction: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseConnection.mockReturnValue({ connection: mockConnection } as any)
    mockUseWallet.mockReturnValue(mockWallet as any)
    mockConnection.getBalance.mockResolvedValue(5000000000) // 5 SOL
    mockGetTransactions.mockReturnValue([])
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useStudentDashboard())

    expect(result.current.balance).toBe(0)
    expect(result.current.usdBalance).toBe(0)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.transactions).toEqual([])
    expect(result.current.paymentForm.amount).toBe('')
    expect(result.current.paymentForm.recipient).toBe('')
  })

  it('should fetch and set balance on mount', async () => {
    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBe(5) // 5 SOL
    expect(result.current.usdBalance).toBe(500) // 5 SOL * $100
    expect(mockConnection.getBalance).toHaveBeenCalledWith(
      expect.objectContaining({ toString: expect.any(Function) })
    )
  })

  it('should update payment form values', () => {
    const { result } = renderHook(() => useStudentDashboard())

    act(() => {
      result.current.updatePaymentForm('amount', '1.5')
    })

    expect(result.current.paymentForm.amount).toBe('1.5')

    act(() => {
      result.current.updatePaymentForm('recipient', 'vendor-address')
    })

    expect(result.current.paymentForm.recipient).toBe('vendor-address')
  })

  it('should validate sufficient balance before payment', async () => {
    mockConnection.getBalance.mockResolvedValue(1000000000) // 1 SOL
    
    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(1)
    })

    act(() => {
      result.current.updatePaymentForm('amount', '2.0') // More than balance
      result.current.updatePaymentForm('recipient', 'test-recipient')
    })

    await act(async () => {
      await result.current.makePayment()
    })

    // Should not proceed with insufficient balance
    expect(mockConnection.sendTransaction).not.toHaveBeenCalled()
  })

  it('should process successful payment', async () => {
    mockConnection.sendTransaction.mockResolvedValue('transaction-signature')
    mockConnection.confirmTransaction.mockResolvedValue({ value: { confirmationStatus: 'confirmed' } })

    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(5)
    })

    act(() => {
      result.current.updatePaymentForm('amount', '1.0')
      result.current.updatePaymentForm('recipient', 'vendor-address')
      result.current.updatePaymentForm('purpose', 'Lunch payment')
    })

    await act(async () => {
      await result.current.makePayment()
    })

    expect(mockConnection.sendTransaction).toHaveBeenCalled()
    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: expect.any(Object), // BigNumber
        toAddress: 'vendor-address',
        purpose: 'Lunch payment',
        status: 'pending'
      })
    )
  })

  it('should handle payment errors gracefully', async () => {
    mockConnection.sendTransaction.mockRejectedValue(new Error('Transaction failed'))

    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(5)
    })

    act(() => {
      result.current.updatePaymentForm('amount', '1.0')
      result.current.updatePaymentForm('recipient', 'vendor-address')
    })

    await act(async () => {
      await result.current.makePayment()
    })

    expect(result.current.isLoading).toBe(false)
    // Transaction should not be added on failure
    expect(mockAddTransaction).not.toHaveBeenCalled()
  })

  it('should refresh balance after successful payment', async () => {
    mockConnection.sendTransaction.mockResolvedValue('transaction-signature')
    mockConnection.confirmTransaction.mockResolvedValue({ value: { confirmationStatus: 'confirmed' } })
    
    // Initial balance: 5 SOL, after payment: 4 SOL
    mockConnection.getBalance
      .mockResolvedValueOnce(5000000000) // Initial
      .mockResolvedValueOnce(4000000000) // After payment

    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(5)
    })

    act(() => {
      result.current.updatePaymentForm('amount', '1.0')
      result.current.updatePaymentForm('recipient', 'vendor-address')
    })

    await act(async () => {
      await result.current.makePayment()
    })

    await waitFor(() => {
      expect(result.current.balance).toBe(4) // Updated balance
    })
  })

  it('should handle wallet disconnection', () => {
    mockUseWallet.mockReturnValue({ connected: false, publicKey: null } as any)

    const { result } = renderHook(() => useStudentDashboard())

    expect(result.current.balance).toBe(0)
    expect(result.current.transactions).toEqual([])
  })
})
