import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Official Solana Brand Colors
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
        
        // Nigerian themed colors for StudyPay
        nigerian: {
          green: '#008751',  // Nigerian flag green
          blue: '#1E40AF',   // Trust blue
          gold: '#F59E0B',   // Gold accent
        },
        
        // Dark Theme Colors (inspired by faucet.solana.com)
        dark: {
          bg: {
            primary: '#0D0D0D',     // Deep black main background
            secondary: '#1A1A1A',   // Card/component backgrounds
            tertiary: '#2D2D2D',    // Elevated elements
            hover: '#3A3A3A',       // Hover states
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
        }
      },
      
      // Solana gradient backgrounds
      backgroundImage: {
        // Main Solana gradients
        'solana-gradient': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
        'solana-gradient-dark': 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)',
        'solana-gradient-light': 'linear-gradient(135deg, #C084FC 0%, #6EE7B7 100%)',
        
        // Dark theme gradients (like faucet.solana.com)
        'dark-main': 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
        'dark-card': 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
        'dark-hover': 'linear-gradient(135deg, #2D2D2D 0%, #3A3A3A 100%)',
        
        // Dashboard gradients (dark theme)
        'student-gradient': 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
        'parent-gradient': 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
        'vendor-gradient': 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #2D2D2D 100%)',
        
        // Accent gradients
        'solana-accent': 'linear-gradient(135deg, rgba(153, 69, 255, 0.1) 0%, rgba(153, 69, 255, 0.05) 100%)',
        'nigerian-gradient': 'linear-gradient(135deg, #008751 0%, #1E40AF 100%)',
      },
      
      // Custom animations for Solana theme
      animation: {
        'solana-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
      },
      
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
