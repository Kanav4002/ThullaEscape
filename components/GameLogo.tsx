import React from 'react';

export const GameLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
        {/* Background Shape */}
        <rect x="20" y="20" width="160" height="160" rx="40" fill="#0f172a" />
        <path d="M 20 60 A 40 40 0 0 1 60 20 L 140 20 A 40 40 0 0 1 180 60 L 180 140 A 40 40 0 0 1 140 180 L 60 180 A 40 40 0 0 1 20 140 Z" fill="#0f172a" />
        
        {/* Notch details */}
        <rect x="10" y="70" width="20" height="60" rx="4" fill="#0f172a" />
        <rect x="170" y="70" width="20" height="60" rx="4" fill="#0f172a" />
        
        {/* Text */}
        <text x="100" y="95" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="900" fontSize="38" letterSpacing="1">THULLA</text>
        
        {/* Dotted Line */}
        <g fill="white">
           <rect x="65" y="108" width="10" height="10" />
           <rect x="80" y="108" width="10" height="10" />
           <rect x="95" y="108" width="10" height="10" />
           <rect x="110" y="108" width="10" height="10" />
           <rect x="125" y="108" width="10" height="10" />
        </g>
        
        <text x="100" y="150" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="800" fontSize="28" letterSpacing="2">ESCAPE</text>
      </svg>
    </div>
  );
};