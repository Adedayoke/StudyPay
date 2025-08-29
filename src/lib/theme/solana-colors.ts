/**
 * Official Solana Dark Theme System
 * Inspired by faucet.solana.com dark mode design
 */

// =============================================================================
// SOLANA DARK THEME COLORS
// =============================================================================

export const SOLANA_COLORS = {
  // Primary Solana Colors
  primary: {
    purple: '#9945FF',      // Official Solana purple
    purpleDark: '#7C3AED',  // Darker purple for hover states
    purpleLight: '#C084FC', // Lighter purple for backgrounds
    
    green: '#14F195',       // Official Solana green/cyan
    greenDark: '#10B981',   // Darker green for hover
    greenLight: '#6EE7B7',  // Light green for backgrounds
  },
  
  // Dark Theme Background Colors (like faucet.solana.com)
  dark: {
    bg: {
      primary: '#0D0D0D',     // Deep black main background
      secondary: '#1A1A1A',   // Card/component backgrounds
      tertiary: '#2D2D2D',    // Elevated elements (buttons, inputs)
      quaternary: '#3A3A3A',  // Hover states
    },
    text: {
      primary: '#FFFFFF',     // Primary white text
      secondary: '#B0B0B0',   // Secondary gray text
      muted: '#808080',       // Muted gray text
      disabled: '#4A4A4A',    // Disabled text
    },
    border: {
      primary: '#2D2D2D',     // Subtle borders
      secondary: '#404040',   // More visible borders
      accent: '#9945FF',      // Accent purple borders
    }
  },
  
  // Status Colors (adjusted for dark theme)
  status: {
    success: '#14F195',     // Solana green for success
    warning: '#F59E0B',     // Orange for warnings
    error: '#EF4444',       // Red for errors
    info: '#3B82F6',        // Blue for info
  }
} as const;
    gray50: '#F9FAFB',      // Lightest background
    white: '#FFFFFF',       // Pure white
  },
  
  // Status Colors
  status: {
    success: '#10B981',     // Green for success
    warning: '#F59E0B',     // Amber for warnings
    error: '#EF4444',       // Red for errors
    info: '#3B82F6',        // Blue for info
  },
  
  // Nigerian Context Colors (for StudyPay specifically)
  nigerian: {
    nairaGreen: '#008751',  // Nigerian flag green
    trustBlue: '#1E40AF',   // Trust/security blue
    goldAccent: '#F59E0B',  // Gold for premium features
  }
} as const;

// =============================================================================
// SOLANA DARK THEME GRADIENTS
// =============================================================================

export const SOLANA_GRADIENTS = {
  // Dark theme background gradients (like faucet.solana.com)
  darkMain: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
  darkCard: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
  darkHover: 'linear-gradient(135deg, #2D2D2D 0%, #3A3A3A 100%)',
  
  // Solana accent gradients for dark theme
  primary: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  primaryDark: 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)',
  
  // Dashboard specific dark gradients
  student: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
  parent: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
  vendor: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
  
  // Subtle accent gradients
  purpleAccent: 'linear-gradient(135deg, rgba(153, 69, 255, 0.1) 0%, rgba(153, 69, 255, 0.05) 100%)',
  greenAccent: 'linear-gradient(135deg, rgba(20, 241, 149, 0.1) 0%, rgba(20, 241, 149, 0.05) 100%)',
} as const;

// =============================================================================
// TAILWIND CSS CUSTOM COLORS CONFIGURATION
// =============================================================================

export const TAILWIND_SOLANA_COLORS = {
  // Extend Tailwind's default colors with Solana colors
  solana: {
    purple: {
      50: '#FAF5FF',
      100: '#F3E8FF', 
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#9945FF',  // Main Solana purple
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    green: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#14F195',  // Main Solana green
      600: '#10B981',
      700: '#059669',
      800: '#047857',
      900: '#065F46',
    },
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',  // Solana blue
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    }
  },
  
  // Nigerian themed colors
  nigerian: {
    green: '#008751',
    blue: '#1E40AF',
    gold: '#F59E0B',
  }
} as const;

// =============================================================================
// COMPONENT COLOR SCHEMES
// =============================================================================

export const COMPONENT_THEMES = {
  // Student Dashboard Theme
  student: {
    primary: SOLANA_COLORS.primary.purple,
    secondary: SOLANA_COLORS.primary.green,
    background: 'linear-gradient(135deg, #FAF5FF 0%, #ECFDF5 100%)',
    card: SOLANA_COLORS.neutral.white,
    text: SOLANA_COLORS.neutral.gray900,
    accent: SOLANA_COLORS.status.success,
  },
  
  // Parent Dashboard Theme  
  parent: {
    primary: SOLANA_COLORS.secondary.blue,
    secondary: SOLANA_COLORS.primary.purple,
    background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)',
    card: SOLANA_COLORS.neutral.white,
    text: SOLANA_COLORS.neutral.gray900,
    accent: SOLANA_COLORS.nigerian.trustBlue,
  },
  
  // Vendor Dashboard Theme
  vendor: {
    primary: SOLANA_COLORS.primary.green,
    secondary: SOLANA_COLORS.secondary.teal,
    background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 100%)',
    card: SOLANA_COLORS.neutral.white,
    text: SOLANA_COLORS.neutral.gray900,
    accent: SOLANA_COLORS.status.success,
  },
  
  // Homepage Dark Theme
  homepage: {
    primary: SOLANA_COLORS.primary.purple,
    secondary: SOLANA_COLORS.primary.green,
    background: SOLANA_GRADIENTS.darkMain,
    card: SOLANA_COLORS.dark.bg.secondary,
    text: SOLANA_COLORS.dark.text.primary,
    accent: SOLANA_COLORS.primary.green,
  }
} as const;

// =============================================================================
// CSS CUSTOM PROPERTIES FOR EASY THEMING
// =============================================================================

export const CSS_VARIABLES = `
:root {
  /* Solana Primary Colors */
  --solana-purple: #9945FF;
  --solana-purple-dark: #7C3AED;
  --solana-purple-light: #C084FC;
  --solana-green: #14F195;
  --solana-green-dark: #10B981;
  --solana-green-light: #6EE7B7;
  
  /* Solana Secondary Colors */
  --solana-blue: #3B82F6;
  --solana-teal: #06B6D4;
  
  /* Gradients */
  --solana-gradient: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
  --solana-gradient-dark: linear-gradient(135deg, #7C3AED 0%, #10B981 100%);
  
  /* Status Colors */
  --solana-success: #10B981;
  --solana-warning: #F59E0B;
  --solana-error: #EF4444;
  --solana-info: #3B82F6;
  
  /* Nigerian Theme */
  --nigerian-green: #008751;
  --nigerian-blue: #1E40AF;
  --nigerian-gold: #F59E0B;
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
` as const;

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

export const USAGE_EXAMPLES = {
  // Button variants
  buttonPrimary: `bg-[${SOLANA_COLORS.primary.purple}] hover:bg-[${SOLANA_COLORS.primary.purpleDark}] text-white`,
  buttonSecondary: `bg-[${SOLANA_COLORS.primary.green}] hover:bg-[${SOLANA_COLORS.primary.greenDark}] text-white`,
  
  // Background gradients
  backgroundStudent: 'bg-gradient-to-br from-purple-50 to-green-50',
  backgroundParent: 'bg-gradient-to-br from-blue-50 to-purple-50',
  backgroundVendor: 'bg-gradient-to-br from-green-50 to-teal-50',
  
  // Text colors
  textPrimary: `text-[${SOLANA_COLORS.neutral.gray900}]`,
  textSecondary: `text-[${SOLANA_COLORS.neutral.gray600}]`,
  textAccent: `text-[${SOLANA_COLORS.primary.purple}]`,
} as const;
