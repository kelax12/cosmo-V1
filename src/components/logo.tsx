import React, { memo } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', collapsed = false }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center gap-2" data-testid="app-logo">
      <div className={`${sizes[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">C</span>
      </div>
      {!collapsed && (
        <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
          Cosmo
        </span>
      )}
    </div>
  );
};

export default memo(Logo);
