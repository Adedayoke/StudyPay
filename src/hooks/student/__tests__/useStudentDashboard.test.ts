import { renderHook, act } from '@testing-library/react'
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard'

// Mock the wallet provider
const mockWalletProvider = {
  balance: 1.5,
  connected: true,
  publicKey: {
    toString: () => 'mock-public-key',
    toBase58: () => 'mock-base58-key'
  },
  refreshBalance: jest.fn()
}

jest.mock('@/components/wallet/WalletProvider', () => ({
  useStudyPayWallet: () => mockWalletProvider
}))

jest.mock('@/lib/utils/transactionStorage', () => ({
  transactionStorage: {
    getAllTransactions: jest.fn().mockResolvedValue([
      {
        id: 'tx1',
        amount: 0.5,
        status: 'confirmed',
        timestamp: Date.now(),
        purpose: 'Test transaction'
      }
    ]),
    refreshBlockchainTransactions: jest.fn().mockResolvedValue(undefined)
  }
}))

describe('useStudentDashboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useStudentDashboard())

    expect(result.current.balance).toBe(1.5)
    expect(result.current.connected).toBe(true)
    expect(result.current.activeTab).toBe('overview')
    expect(result.current.transactionsLoading).toBe(true)
    expect(result.current.refreshingBlockchain).toBe(false)
  })

  it('should change active tab', () => {
    const { result } = renderHook(() => useStudentDashboard())

    act(() => {
      result.current.setActiveTab('transactions')
    })

    expect(result.current.activeTab).toBe('transactions')
  })

  it('should handle vendor selection', () => {
    const { result } = renderHook(() => useStudentDashboard())
    const mockVendor = {
      id: 'vendor1',
      businessName: 'Test Vendor',
      category: 'food'
    }

    act(() => {
      result.current.handleVendorSelect(mockVendor)
    })

    expect(result.current.selectedVendor).toEqual(mockVendor)
    expect(result.current.activeTab).toBe('vendors')
  })

  it('should handle vendor close', () => {
    const { result } = renderHook(() => useStudentDashboard())

    act(() => {
      result.current.handleVendorClose()
    })

    expect(result.current.selectedVendor).toBeNull()
  })

  it('should identify low balance correctly', () => {
    // Mock low balance
    const lowBalanceMock = {
      ...mockWalletProvider,
      balance: 0.05
    }

    jest.mocked(require('@/components/wallet/WalletProvider').useStudyPayWallet)
      .mockReturnValue(lowBalanceMock)

    const { result } = renderHook(() => useStudentDashboard())

    expect(result.current.isLowBalance).toBe(true)
  })
})
