import { useRef, RefObject } from 'react';
import { useAccessibility } from './useAccessibility';

/**
 * Convenience hook that combines useRef with useAccessibility
 * 
 * @example
 * ```tsx
 * const { ref, issues, checkAccessibility } = useAccessibilityRef();
 * 
 * return <div ref={ref}>Content</div>;
 * ```
 */
export function useAccessibilityRef<T extends HTMLElement = HTMLDivElement>(
  options?: Parameters<typeof useAccessibility>[1]
) {
  const ref = useRef<T>(null);
  const accessibility = useAccessibility(ref, options);

  return {
    ref,
    ...accessibility,
  };
}

