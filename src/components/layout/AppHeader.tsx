/**
 * Reusable Application Header
 * Eliminates header duplication across all pages
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui';
import { WalletButton } from '@/components/wallet/WalletProvider';
import Logo from '@/components/ui/Logo';
import { StudyPayIcon } from '@/lib/utils/iconMap';

interface AppHeaderProps {
  variant?: 'default' | 'student' | 'parent' | 'vendor' | 'marketplace' | 'admin';
  rightContent?: React.ReactNode;
  showWallet?: boolean;
  className?: string;
}

export default function AppHeader({ 
  variant = 'default', 
  rightContent,
  showWallet = true,
  className = ''
}: AppHeaderProps) {
  
  const getBadgeConfig = () => {
    switch (variant) {
      case 'student':
        return {
          text: 'Student Portal',
          icon: 'student',
          className: 'bg-purple-500/20 text-purple-400'
        };
      case 'parent':
        return {
          text: 'Parent Portal',
          icon: 'parent',
          className: 'bg-solana-green-500/20 text-solana-green-400'
        };
      case 'vendor':
        return {
          text: 'Vendor Portal',
          icon: 'vendor',
          className: 'bg-yellow-500/20 text-yellow-400'
        };
      case 'marketplace':
        return {
          text: 'Campus Marketplace',
          icon: 'store',
          className: 'bg-solana-purple-500/20 text-solana-purple-400'
        };
      case 'admin':
        return {
          text: 'Admin Dashboard',
          icon: 'settings',
          className: 'bg-red-500/20 text-red-400'
        };
      default:
        return null;
    }
  };

  const badgeConfig = getBadgeConfig();

  return (
    <header className={`bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo />
          </div>
          
          <div className="flex items-center space-x-4">
            {badgeConfig && (
              <Badge variant="secondary" className={badgeConfig.className}>
                <div className="flex items-center gap-1">
                  <StudyPayIcon name={badgeConfig.icon as any} size={14} />
                  <span>{badgeConfig.text}</span>
                </div>
              </Badge>
            )}
            
            {rightContent}
            
            {showWallet && <WalletButton />}
          </div>
        </div>
      </div>
    </header>
  );
}
