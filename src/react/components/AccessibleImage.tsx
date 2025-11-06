import React, { ImgHTMLAttributes, forwardRef } from 'react';

export interface AccessibleImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string; // Required for accessibility
  decorative?: boolean; // If true, uses empty alt text
}

/**
 * Accessible image component that enforces alt text
 * 
 * @example
 * ```tsx
 * <AccessibleImage 
 *   src="/logo.png" 
 *   alt="Company logo"
 *   decorative={false}
 * />
 * 
 * // Decorative image
 * <AccessibleImage 
 *   src="/pattern.png" 
 *   alt=""
 *   decorative={true}
 * />
 * ```
 */
export const AccessibleImage = forwardRef<HTMLImageElement, AccessibleImageProps>(
  ({ alt, decorative = false, ...props }, ref) => {
    return (
      <img
        ref={ref}
        alt={decorative ? '' : alt}
        {...props}
      />
    );
  }
);

AccessibleImage.displayName = 'AccessibleImage';

