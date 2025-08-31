import { renderHook, act, waitFor } from '@testing-library/react'
import { useParentDashboard } from '@/hooks/useParentDashboard'

// Mock the required modules
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
  useConnection: jest.fn()
}))

jest.mock('@/lib/utils/transactionStorage', () => ({
  addTransaction: jest.fn(),
  getTransactionsForAddress: jest.fn()
}))

jest.mock('@/lib/utils/currency', () => ({
  formatSolAmount: jest.fn((amount) => `${amount} SOL`),
  convertSolToUsd: jest.fn((amount) => amount * 100)
}))

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { addTransaction, getTransactionsForAddress } from '@/lib/utils/transactionStorage'

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseConnection = useConnection as jest.MockedFunction<typeof useConnection>
const mockAddTransaction = addTransaction as jest.MockedFunction<typeof addTransaction>
const mockGetTransactions = getTransactionsForAddress as jest.MockedFunction<typeof getTransactionsForAddress>

describe('useParentDashboard Hook', () => {
  const mockConnection = {
    getBalance: jest.fn(),
    sendTransaction: jest.fn(),
    confirmTransaction: jest.fn()
  }

  const mockWallet = {
    publicKey: { toString: () => 'parent-wallet-address' },
    connected: true,
    signTransaction: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseConnection.mockReturnValue({ connection: mockConnection } as any)
    mockUseWallet.mockReturnValue(mockWallet as any)
    mockConnection.getBalance.mockResolvedValue(10000000000) // 10 SOL
    mockGetTransactions.mockReturnValue([])
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useParentDashboard())

    expect(result.current.balance).toBe(0)
    expect(result.current.usdBalance).toBe(0)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.children).toEqual([])
    expect(result.current.transferForm.amount).toBe('')
    expect(result.current.transferForm.childAddress).toBe('')
  })

  it('should fetch balance and load children on mount', async () => {
    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.balance).toBe(10) // 10 SOL
    expect(result.current.usdBalance).toBe(1000) // 10 SOL * $100
  })

  it('should add new child wallet', () => {
    const { result } = renderHook(() => useParentDashboard())

    act(() => {
      result.current.addChild('child-address-1', 'Alice')
    })

    expect(result.current.children).toHaveLength(1)
    expect(result.current.children[0]).toEqual({
      address: 'child-address-1',
      name: 'Alice',
      balance: 0
    })
  })

  it('should update transfer form values', () => {
    const { result } = renderHook(() => useParentDashboard())

    act(() => {
      result.current.updateTransferForm('amount', '5.0')
    })

    expect(result.current.transferForm.amount).toBe('5.0')

    act(() => {
      result.current.updateTransferForm('childAddress', 'child-address')
    })

    expect(result.current.transferForm.childAddress).toBe('child-address')
  })

  it('should validate sufficient balance before transfer', async () => {
    mockConnection.getBalance.mockResolvedValue(2000000000) // 2 SOL
    
    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(2)
    })

    act(() => {
      result.current.updateTransferForm('amount', '5.0') // More than balance
      result.current.updateTransferForm('childAddress', 'child-address')
    })

    await act(async () => {
      await result.current.transferToChild()
    })

    // Should not proceed with insufficient balance
    expect(mockConnection.sendTransaction).not.toHaveBeenCalled()
  })

  it('should process successful transfer to child', async () => {
    mockConnection.sendTransaction.mockResolvedValue('transfer-signature')
    mockConnection.confirmTransaction.mockResolvedValue({ value: { confirmationStatus: 'confirmed' } })

    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    // Add a child first
    act(() => {
      result.current.addChild('child-address-1', 'Alice')
    })

    act(() => {
      result.current.updateTransferForm('amount', '3.0')
      result.current.updateTransferForm('childAddress', 'child-address-1')
      result.current.updateTransferForm('purpose', 'Weekly allowance')
    })

    await act(async () => {
      await result.current.transferToChild()
    })

    expect(mockConnection.sendTransaction).toHaveBeenCalled()
    expect(mockAddTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: expect.any(Object), // BigNumber
        toAddress: 'child-address-1',
        purpose: 'Weekly allowance',
        status: 'pending',
        type: 'outgoing'
      })
    )
  })

  it('should handle transfer errors gracefully', async () => {
    mockConnection.sendTransaction.mockRejectedValue(new Error('Transfer failed'))

    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    act(() => {
      result.current.addChild('child-address-1', 'Alice')
      result.current.updateTransferForm('amount', '2.0')
      result.current.updateTransferForm('childAddress', 'child-address-1')
    })

    await act(async () => {
      await result.current.transferToChild()
    })

    expect(result.current.isLoading).toBe(false)
    expect(mockAddTransaction).not.toHaveBeenCalled()
  })

  it('should refresh balance after successful transfer', async () => {
    mockConnection.sendTransaction.mockResolvedValue('transfer-signature')
    mockConnection.confirmTransaction.mockResolvedValue({ value: { confirmationStatus: 'confirmed' } })
    
    // Initial balance: 10 SOL, after transfer: 7 SOL
    mockConnection.getBalance
      .mockResolvedValueOnce(10000000000) // Initial
      .mockResolvedValueOnce(7000000000)  // After transfer

    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    act(() => {
      result.current.addChild('child-address-1', 'Alice')
      result.current.updateTransferForm('amount', '3.0')
      result.current.updateTransferForm('childAddress', 'child-address-1')
    })

    await act(async () => {
      await result.current.transferToChild()
    })

    await waitFor(() => {
      expect(result.current.balance).toBe(7) // Updated balance
    })
  })

  it('should remove child from list', () => {
    const { result } = renderHook(() => useParentDashboard())

    act(() => {
      result.current.addChild('child-1', 'Alice')
      result.current.addChild('child-2', 'Bob')
    })

    expect(result.current.children).toHaveLength(2)

    act(() => {
      result.current.removeChild('child-1')
    })

    expect(result.current.children).toHaveLength(1)
    expect(result.current.children[0].name).toBe('Bob')
  })

  it('should update child balance when refreshed', async () => {
    mockConnection.getBalance
      .mockResolvedValueOnce(10000000000) // Parent balance
      .mockResolvedValueOnce(3000000000)  // Child balance (3 SOL)

    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    act(() => {
      result.current.addChild('child-address-1', 'Alice')
    })

    await act(async () => {
      await result.current.refreshChildBalance('child-address-1')
    })

    expect(result.current.children[0].balance).toBe(3)
  })

  it('should handle wallet disconnection', () => {
    mockUseWallet.mockReturnValue({ connected: false, publicKey: null } as any)

    const { result } = renderHook(() => useParentDashboard())

    expect(result.current.balance).toBe(0)
    expect(result.current.children).toEqual([])
  })

  it('should clear transfer form after successful transfer', async () => {
    mockConnection.sendTransaction.mockResolvedValue('transfer-signature')
    mockConnection.confirmTransaction.mockResolvedValue({ value: { confirmationStatus: 'confirmed' } })

    const { result } = renderHook(() => useParentDashboard())

    await waitFor(() => {
      expect(result.current.balance).toBe(10)
    })

    act(() => {
      result.current.addChild('child-address-1', 'Alice')
      result.current.updateTransferForm('amount', '2.0')
      result.current.updateTransferForm('childAddress', 'child-address-1')
      result.current.updateTransferForm('purpose', 'Lunch money')
    })

    await act(async () => {
      await result.current.transferToChild()
    })

    // Form should be cleared after successful transfer
    expect(result.current.transferForm.amount).toBe('')
    expect(result.current.transferForm.childAddress).toBe('')
    expect(result.current.transferForm.purpose).toBe('')
  })
})
