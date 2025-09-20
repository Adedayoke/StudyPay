/**
 * StudyPay Icon Mapping System
 * Centralized mapping from emojis to professional Lucide icons
 */

import {
  Calendar,
  RefreshCw,
  // User & Identity Icons
  GraduationCap,
  Users,
  User,
  UserCheck,
  
  // Business & Commerce Icons
  Store,
  ShoppingBag,
  DollarSign,
  Coins,
  CreditCard,
  Receipt,
  Wallet,
  
  // Technology & Device Icons
  Smartphone,
  Monitor,
  Zap,
  Wifi,
  WifiOff,
  
  // Transportation Icons
  Bus,
  Car,
  Bike,
  
  // Education Icons
  BookOpen,
  Book,
  Library,
  School,
  
  // Analytics & Charts Icons
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  
  // Status & Feedback Icons
  CheckCircle,
  Check,
  X,
  AlertCircle,
  Info,
  
  // Action Icons
  QrCode,
  Scan,
  Send,
  Download,
  
  // Food & Services Icons
  Coffee,
  Utensils,
  Home,
  Building,
  
  // Communication Icons
  MessageCircle,
  Phone,
  Mail,
  
  // Navigation Icons
  ArrowRight,
  ArrowLeft,
  Plus,
  Settings,
  Menu,
  
  // Special Icons
  Flame,
  
  // Additional Icons
  Printer,
  Clock,
  MapPin,
  Star,
  Package,
  CheckCircle2,
  FileText,
  Target,
  Lightbulb,
  Rocket,
  Trophy,
  Search,
  Bell
} from 'lucide-react';

export const StudyPayIcons = {
  calendar: Calendar,
  "shopping-bag": ShoppingBag,
  "refresh-cw": RefreshCw,
  // User Types
  student: GraduationCap,
  parent: Users, 
  vendor: Store,
  store: Store,
  admin: UserCheck,
  user: User,
  
  // Payment & Money
  money: DollarSign,
  coins: Coins,
  payment: CreditCard,
  receipt: Receipt,
  transaction: Receipt,
  wallet: Wallet,
  
  // Vendor Categories
  food: Utensils,
  transport: Bus,
  books: BookOpen,
  accommodation: Home,
  services: Building,
  other: Store,
  electronics: Monitor,
  printing: Printer,
  
  // Technology
  mobile: Smartphone,
  desktop: Monitor,
  speed: Zap,
  online: Wifi,
  offline: WifiOff,
  
  // Analytics
  analytics: BarChart3,
  chart: PieChart,
  trending: TrendingUp,
  stats: Activity,
  trendingDown: TrendingUp,
  rocket: Rocket,
  target: Target,
  lightbulb: Lightbulb,
  
  // Status
  success: CheckCircle,
  verified: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
  
  // Actions
  qr: QrCode,
  scan: Scan,
  send: Send,
  download: Download,
  search: Search,
  
  // Communication
  message: MessageCircle,
  phone: Phone,
  email: Mail,
  
  // Navigation
  next: ArrowRight,
  back: ArrowLeft,
  add: Plus,
  settings: Settings,
  menu: Menu,
  
  // Special
  flame: Flame,
  clock: Clock,
  location: MapPin,
  star: Star,
  package: Package,
  celebrate: CheckCircle2,
  document: FileText,
  trophy: Trophy,
  cart: ShoppingBag,
  alert: AlertCircle,
  bell: Bell
};

// Icon wrapper component for consistent styling
interface IconProps {
  name: keyof typeof StudyPayIcons;
  size?: number;
  className?: string;
  color?: string;
}

export function StudyPayIcon({ name, size = 20, className = "", color }: IconProps) {
  const IconComponent = StudyPayIcons[name];
  
  if (!IconComponent) {
    console.warn(`StudyPay Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      className={className}
      color={color}
    />
  );
}

// Convenience components for common icon combinations
export function UserTypeIcon({ userType, size = 20, className = "" }: { 
  userType: 'student' | 'parent' | 'vendor' | 'admin';
  size?: number;
  className?: string;
}) {
  return <StudyPayIcon name={userType} size={size} className={className} />;
}

export function CategoryIcon({ category, size = 20, className = "" }: {
  category: 'food' | 'transport' | 'books' | 'accommodation' | 'services' | 'other' | 'electronics' | 'printing';
  size?: number;
  className?: string;
}) {
  return <StudyPayIcon name={category} size={size} className={className} />;
}

export function StatusIcon({ status, size = 20, className = "" }: {
  status: 'success' | 'verified' | 'error' | 'warning' | 'info';
  size?: number;
  className?: string;
}) {
  return <StudyPayIcon name={status} size={size} className={className} />;
}

// Export individual icons for direct use
export {
  GraduationCap,
  Users,
  Store,
  DollarSign,
  Coins,
  Smartphone,
  Zap,
  Bus,
  BookOpen,
  BarChart3,
  CheckCircle,
  QrCode,
  Utensils
};