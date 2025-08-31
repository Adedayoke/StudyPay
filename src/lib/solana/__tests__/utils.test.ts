import { formatCurrency, solToNaira, nairaToSol } from '@/lib/solana/utils'
import BigNumber from 'bignumber.js'

describe('Currency Conversion Utils', () => {
  describe('formatCurrency', () => {
    it('should format SOL amounts correctly', () => {
      const amount = new BigNumber(1.5)
      expect(formatCurrency(amount, 'SOL')).toBe('1.50 SOL')
    })

    it('should format NGN amounts correctly', () => {
      const amount = new BigNumber(25000)
      expect(formatCurrency(amount, 'NGN')).toBe('₦25,000.00')
    })

    it('should handle zero amounts', () => {
      const amount = new BigNumber(0)
      expect(formatCurrency(amount, 'SOL')).toBe('0.00 SOL')
      expect(formatCurrency(amount, 'NGN')).toBe('₦0.00')
    })

    it('should handle very small amounts', () => {
      const amount = new BigNumber(0.001)
      expect(formatCurrency(amount, 'SOL')).toBe('0.001 SOL')
    })
  })

  describe('solToNaira', () => {
    it('should convert SOL to NGN at correct rate', () => {
      const solAmount = new BigNumber(1)
      const ngnAmount = solToNaira(solAmount)
      
      // Assuming 1 SOL ≈ ₦50,000 (adjust based on your actual rate)
      expect(ngnAmount.toNumber()).toBeGreaterThan(40000)
      expect(ngnAmount.toNumber()).toBeLessThan(60000)
    })

    it('should handle zero amounts', () => {
      const solAmount = new BigNumber(0)
      const ngnAmount = solToNaira(solAmount)
      expect(ngnAmount.toNumber()).toBe(0)
    })

    it('should maintain precision for small amounts', () => {
      const solAmount = new BigNumber(0.01)
      const ngnAmount = solToNaira(solAmount)
      expect(ngnAmount.toNumber()).toBeGreaterThan(0)
    })
  })

  describe('nairaToSol', () => {
    it('should convert NGN to SOL correctly', () => {
      const ngnAmount = new BigNumber(50000)
      const solAmount = nairaToSol(ngnAmount)
      
      // Should be approximately 1 SOL
      expect(solAmount.toNumber()).toBeCloseTo(1, 1)
    })

    it('should be inverse of solToNaira', () => {
      const originalSol = new BigNumber(2.5)
      const ngn = solToNaira(originalSol)
      const backToSol = nairaToSol(ngn)
      
      expect(backToSol.toNumber()).toBeCloseTo(originalSol.toNumber(), 2)
    })
  })
})
