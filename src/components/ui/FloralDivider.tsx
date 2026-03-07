'use client';

interface FloralDividerProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function FloralDivider({ className = '', variant = 'light' }: FloralDividerProps) {
  const lineColor = variant === 'dark' ? 'from-transparent via-violet-700 to-transparent' : 'from-transparent via-violet-200 to-transparent';
  const centerColor = variant === 'dark' ? '#7c3aed' : '#c4b5fd';
  const petalColor = variant === 'dark' ? '#5b21b6' : '#ddd6fe';
  const petalOuter = variant === 'dark' ? '#6d28d9' : '#ede9fe';

  return (
    <div className={`flex items-center gap-0 py-1 ${className}`}>
      <div className={`flex-1 h-px bg-gradient-to-r ${lineColor}`} />
      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mx-1">
        {/* Outer petals */}
        <ellipse cx="24" cy="8" rx="3" ry="4.5" fill={petalOuter} opacity="0.7" />
        <ellipse cx="24" cy="16" rx="3" ry="4.5" fill={petalOuter} opacity="0.7" />
        <ellipse cx="16" cy="12" rx="4.5" ry="3" fill={petalOuter} opacity="0.7" />
        <ellipse cx="32" cy="12" rx="4.5" ry="3" fill={petalOuter} opacity="0.7" />
        {/* Diagonal petals */}
        <ellipse cx="18.5" cy="8.5" rx="2.5" ry="3.5" transform="rotate(-45 18.5 8.5)" fill={petalColor} opacity="0.6" />
        <ellipse cx="29.5" cy="8.5" rx="2.5" ry="3.5" transform="rotate(45 29.5 8.5)" fill={petalColor} opacity="0.6" />
        <ellipse cx="18.5" cy="15.5" rx="2.5" ry="3.5" transform="rotate(45 18.5 15.5)" fill={petalColor} opacity="0.6" />
        <ellipse cx="29.5" cy="15.5" rx="2.5" ry="3.5" transform="rotate(-45 29.5 15.5)" fill={petalColor} opacity="0.6" />
        {/* Center */}
        <circle cx="24" cy="12" r="4" fill={centerColor} opacity="0.85" />
        <circle cx="24" cy="12" r="2" fill={variant === 'dark' ? '#a78bfa' : '#f5f3ff'} opacity="0.8" />
      </svg>
      <div className={`flex-1 h-px bg-gradient-to-l ${lineColor}`} />
    </div>
  );
}
