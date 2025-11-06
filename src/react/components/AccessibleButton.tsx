import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Accessible button component that enforces accessibility best practices
 * Automatically adds type="button" if not specified
 * 
 * @example
 * ```tsx
 * <AccessibleButton ariaLabel="Close dialog" onClick={handleClose}>
 *   Close
 * </AccessibleButton>
 * ```
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ ariaLabel, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

