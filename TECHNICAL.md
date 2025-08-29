# Technical Documentation 🛠️

**StudyPay - Solana Campus Payment System**

> Comprehensive technical guide for developers and technical judges

---

## 🏗️ Architecture Overview

### **System Design**
StudyPay follows a clean, modular architecture designed for scalability and maintainability:

```
StudyPay/
├── Frontend (Next.js 14)
│   ├── Student Portal
│   ├── Parent Dashboard  
│   └── Vendor Portal
├── Blockchain Layer (Solana)
│   ├── Wallet Integration
│   ├── Payment Processing
│   └── Transaction Monitoring
└── UI/UX Layer
    ├── Dark Theme System
    ├── Responsive Design
    └── Official Solana Branding
```

### **Technology Decisions**

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14 + React 18 | Server-side rendering, optimal performance |
| **Language** | TypeScript | Type safety, better developer experience |
| **Blockchain** | Solana + Solana Pay | Fast, low-cost transactions |
| **Styling** | Tailwind CSS | Rapid development, consistent design |
| **Wallet** | Phantom/Solflare | Most popular Solana wallets |
| **Math** | BigNumber.js | Precise decimal calculations |

---

## 🧩 Project Structure

### **Directory Organization**
```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout with wallet provider
│   ├── page.tsx           # Homepage/landing
│   ├── student/           # Student dashboard
│   ├── parent/            # Parent dashboard
│   └── vendor/            # Vendor dashboard
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Card, Input)
│   ├── wallet/           # Wallet connection components
│   └── payments/         # Payment-related components
├── lib/                  # Core utilities and configuration
│   ├── types/           # TypeScript type definitions
│   ├── solana/          # Solana blockchain utilities
│   └── theme/           # Design system and colors
└── styles/              # Global CSS and Tailwind config
```

### **Key Files & Responsibilities**

#### **Core Configuration**
- `src/lib/solana/config.ts` - Solana network configuration
- `src/lib/types/index.ts` - Complete TypeScript definitions
- `tailwind.config.ts` - Dark theme and Solana colors
- `src/lib/theme/solana-colors.ts` - Official Solana brand system

#### **UI Components**
- `src/components/ui/index.tsx` - Base components (Button, Card, Input)
- `src/components/wallet/WalletProvider.tsx` - Wallet connection logic
- `src/components/payments/QRPayment.tsx` - QR payment functionality

#### **Dashboard Pages**
- `src/app/student/page.tsx` - Student balance and payment interface
- `src/app/parent/page.tsx` - Parent transfer and monitoring dashboard  
- `src/app/vendor/page.tsx` - Vendor payment acceptance portal

---

## 🔗 Solana Integration

### **Wallet Configuration**
```typescript
// Supported wallets
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // Add more wallets as needed
];

// Network configuration (Devnet for development)
const endpoint = clusterApiUrl('devnet');
const connection = new Connection(endpoint);
```

### **Payment Flow Architecture**
1. **Wallet Connection**: User connects Phantom/Solflare wallet
2. **Balance Retrieval**: Fetch SOL balance from Solana network
3. **Payment Request**: Generate Solana Pay URL with amount/recipient
4. **QR Generation**: Create QR code for mobile scanning
5. **Transaction Monitoring**: Watch for payment confirmation
6. **UI Updates**: Reflect new balances and transaction history

### **Key Solana Utilities**
```typescript
// Balance checking
export async function getBalance(publicKey: PublicKey): Promise<BigNumber>

// Payment URL creation
export function createPaymentURL(request: PaymentRequest): string

// Transaction monitoring
export async function monitorPayment(signature: string): Promise<TransactionStatus>
```

---

## 🎨 Design System

### **Solana Dark Theme**
Inspired by [faucet.solana.com](https://faucet.solana.com), our design system includes:

```css
/* Official Solana Colors */
--solana-purple: #9945FF;
--solana-green: #14F195;

/* Dark Theme Backgrounds */
--dark-bg-primary: #0D0D0D;    /* Main background */
--dark-bg-secondary: #1A1A1A;  /* Cards/components */
--dark-bg-tertiary: #2D2D2D;   /* Elevated elements */

/* Dark Theme Text */
--dark-text-primary: #FFFFFF;   /* Primary text */
--dark-text-secondary: #B0B0B0; /* Secondary text */
--dark-text-muted: #808080;     /* Muted text */
```

### **Component Design Principles**
- **Consistent**: All components follow the same visual patterns
- **Accessible**: High contrast ratios for dark theme readability
- **Responsive**: Mobile-first design for campus usage
- **Branded**: Official Solana colors and styling throughout

---

## 🔄 State Management

### **Wallet State**
```typescript
interface WalletState {
  connected: boolean;
  publicKey: PublicKey | null;
  balance: BigNumber;
  connecting: boolean;
  error: string | null;
}
```

### **Transaction State**
```typescript
interface TransactionState {
  pending: Transaction[];
  completed: Transaction[];
  failed: Transaction[];
  monitoring: Map<string, TransactionStatus>;
}
```

---

## 📱 Responsive Design

### **Breakpoint Strategy**
- **Mobile First**: Design starts with mobile (320px+)
- **Tablet**: Enhanced layout for tablets (768px+)
- **Desktop**: Full dashboard experience (1024px+)

### **Key Responsive Features**
- Collapsible navigation on mobile
- Touch-friendly button sizes (44px minimum)
- Readable text sizes on all devices
- Optimized QR code scanning for mobile

---

## 🔐 Security Considerations

### **Wallet Security**
- Never store private keys
- Use official wallet adapters only
- Validate all transaction parameters
- Implement proper error handling

### **Input Validation**
- Sanitize all user inputs
- Validate Solana addresses
- Check amount boundaries
- Prevent XSS attacks

### **Network Security**
- Use HTTPS in production
- Validate API responses
- Implement rate limiting
- Monitor for suspicious activity

---

## 🧪 Testing Strategy

### **Component Testing**
```bash
# Run component tests
npm run test

# Watch mode for development
npm run test:watch
```

### **Integration Testing**
```bash
# Test wallet integration
npm run test:wallet

# Test payment flows
npm run test:payments
```

### **Manual Testing Checklist**
- [ ] Wallet connection/disconnection
- [ ] Balance display accuracy
- [ ] QR code generation
- [ ] Transaction monitoring
- [ ] Responsive design
- [ ] Dark theme consistency

---

## 🚀 Deployment

### **Development Setup**
```bash
# Clone repository
git clone https://github.com/Adedayoke/StudyPay.git
cd studypay

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_APP_NAME=StudyPay
```

### **Build for Production**
```bash
# Create production build
npm run build

# Start production server
npm start
```

### **Deployment Platforms**
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative with good Next.js support
- **Railway**: Full-stack deployment option

---

## 📊 Performance Optimizations

### **Bundle Optimization**
- Tree shaking for unused code elimination
- Dynamic imports for large components
- Image optimization with Next.js
- CSS purging with Tailwind

### **Solana Performance**
- Connection pooling for RPC calls
- Caching of frequently accessed data
- Batch transaction processing
- Efficient balance polling

---

## 🔄 Development Workflow

### **Git Strategy**
```bash
# Feature development
git checkout -b feature/new-payment-flow
# ... make changes ...
git commit -m "feat: add QR payment generation"
git push origin feature/new-payment-flow
```

### **Code Quality**
- TypeScript for type safety
- ESLint for code consistency
- Prettier for formatting
- Husky for pre-commit hooks

---

## 📈 Scalability Considerations

### **Frontend Scaling**
- Component-based architecture for reusability
- State management with React Context
- Lazy loading for dashboard components
- CDN deployment for global access

### **Blockchain Scaling**
- Solana's high throughput (65,000 TPS)
- Low transaction costs (<$0.01)
- Fast confirmation times (~400ms)
- Built-in scalability for campus usage

---

## 🐛 Debugging & Troubleshooting

### **Common Issues**
1. **Wallet Connection Fails**
   - Check browser extensions
   - Verify network configuration
   - Clear browser cache

2. **Balance Not Updating**
   - Confirm connection to correct network
   - Check RPC endpoint status
   - Verify public key format

3. **Transaction Stuck**
   - Monitor transaction signature
   - Check network congestion
   - Verify sufficient SOL for fees

### **Debug Tools**
- Solana Explorer (devnet)
- Browser developer tools
- Wallet transaction logs
- Network tab for RPC calls

---

## 📚 Additional Resources

### **Solana Development**
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Pay Documentation](https://docs.solanapay.com/)
- [Wallet Adapter Documentation](https://github.com/solana-labs/wallet-adapter)

### **Next.js Resources**
- [Next.js Documentation](https://nextjs.org/docs)
- [React 18 Features](https://react.dev/blog/2022/03/29/react-v18)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create feature branch: `git checkout -b feature/your-feature`
5. Make changes and test thoroughly
6. Submit pull request with clear description

### **Code Standards**
- Follow TypeScript best practices
- Maintain consistent component structure
- Update documentation for new features
- Include tests for new functionality

---

*Last updated: December 2024*  
*Version: 1.0.0*  
*Built for University of Lagos Solana Hackathon 2025*
