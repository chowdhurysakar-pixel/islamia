/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BkashLogoProps {
  className?: string;
  size?: number;
}

/**
 * Authentic bKash Brand Logo
 * Displays the iconic bKash magenta/pink background with the official origami bird logo.
 */
export const BkashLogo: React.FC<BkashLogoProps> = ({ 
  className = "w-4 h-4", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...(size ? { width: size, height: size } : {})
      }}
      aria-label="bKash"
    >
      {/* Signature bKash Pink/Magenta Rounded Base Container */}
      <rect width="100" height="100" rx="22" fill="#E2136E" />

      {/* Official bKash Origami Bird */}
      <g fill="#FFFFFF" stroke="#E2136E" strokeWidth="0.8" strokeLinejoin="round">
        {/* Top-Left Main Wing */}
        <polygon points="18.5,18.5 49.5,22.2 42.5,48.8" />
        
        {/* Top-Left Wing Fold Detail */}
        <polygon points="18.5,23.6 30.5,35.5 25.2,29.8" />

        {/* Central Upper Wing */}
        <polygon points="49.5,22.2 42.5,48.8 72.8,53.2" />

        {/* Head Base */}
        <polygon points="63.8,40.8 78.6,38.2 72.8,53.2" />

        {/* Beak Origami */}
        <polygon points="78.6,38.2 85.0,44.2 76.5,44.2" />

        {/* Central Lower Body */}
        <polygon points="42.5,48.8 72.8,53.2 46.8,66.8" />

        {/* Lower Body Fold Strip */}
        <polygon points="46.8,66.8 72.2,57.2 72.8,53.2" />

        {/* Tail (Facing Down-Left) */}
        <polygon points="42.5,48.8 46.8,66.8 32.8,81.5" />
      </g>
    </svg>
  );
};

export default BkashLogo;
