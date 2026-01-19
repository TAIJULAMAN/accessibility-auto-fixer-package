import { useEffect, useRef, useState, RefObject } from 'react';
import { AccessibilityIssue } from '../../types';

export interface UseAccessibilityOptions {
  enabled?: boolean;
  onIssueFound?: (issues: AccessibilityIssue[]) => void;
  checkOnMount?: boolean;
  checkInterval?: number;
  debounceMs?: number; // Debounce delay in milliseconds
}

export interface UseAccessibilityReturn {
  issues: AccessibilityIssue[];
  checkAccessibility: () => void;
  clearIssues: () => void;
}

/**
 * React hook for runtime accessibility checking
 * 
 * @example
 * ```tsx
 * const { issues, checkAccessibility } = useAccessibility({
 *   enabled: true,
 *   onIssueFound: (issues) => console.log('Found issues:', issues)
 * });
 * 
 * return <div ref={ref}>Content</div>;
 * ```
 */
export function useAccessibility<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T>,
  options: UseAccessibilityOptions = {}
): UseAccessibilityReturn {
  const {
    enabled = true,
    onIssueFound,
    checkOnMount = true,
    checkInterval,
    debounceMs = 300, // Default 300ms debounce
  } = options;

  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performCheck = () => {
    if (!enabled || !ref.current) {
      return;
    }

    const element = ref.current;
    const detectedIssues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        detectedIssues.push({
          type: 'missing-alt-text',
          severity: 'error',
          message: 'Image missing alt attribute',
          line: 1,
          column: 1,
          code: `<img src="${img.getAttribute('src')}">`,
        });
      }
    });

    // Check for missing aria labels on interactive elements
    const interactiveElements = element.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), [role="button"]:not([aria-label]):not([aria-labelledby])'
    );

    interactiveElements.forEach((el) => {
      const text = el.textContent?.trim() || '';
      if (!text && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        detectedIssues.push({
          type: 'missing-aria-label',
          severity: 'warning',
          message: 'Interactive element missing aria-label or accessible text',
          line: 1,
          column: 1,
          code: el.outerHTML.substring(0, 100),
        });
      }
    });

    // Check for missing form labels
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const hasLabel = id && element.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && input.getAttribute('type') !== 'hidden') {
        detectedIssues.push({
          type: 'missing-form-label',
          severity: 'error',
          message: 'Form input missing associated label',
          line: 1,
          column: 1,
          code: input.outerHTML.substring(0, 100),
        });
      }
    });

    // Check for missing button types
    const buttons = element.querySelectorAll('button');
    buttons.forEach((button) => {
      if (!button.hasAttribute('type')) {
        detectedIssues.push({
          type: 'missing-button-type',
          severity: 'warning',
          message: 'Button missing type attribute',
          line: 1,
          column: 1,
          code: button.outerHTML.substring(0, 100),
        });
      }
    });

    // Check for duplicate IDs
    const idMap = new Map<string, Element[]>();
    const elementsWithIds = element.querySelectorAll('[id]');

    elementsWithIds.forEach((el) => {
      const id = el.getAttribute('id');
      if (id) {
        if (!idMap.has(id)) {
          idMap.set(id, []);
        }
        idMap.get(id)!.push(el);
      }
    });

    idMap.forEach((elements, id) => {
      if (elements.length > 1) {
        elements.forEach((el) => {
          detectedIssues.push({
            type: 'duplicate-id',
            severity: 'error',
            message: `Duplicate ID "${id}" found`,
            line: 1,
            column: 1,
            code: el.outerHTML.substring(0, 100),
          });
        });
      }
    });

    setIssues(detectedIssues);

    if (detectedIssues.length > 0 && onIssueFound) {
      onIssueFound(detectedIssues);
    }
  };

  // Debounced check function
  const checkAccessibility = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performCheck();
    }, debounceMs);
  };

  const clearIssues = () => {
    setIssues([]);
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (checkOnMount) {
      // Small delay to ensure DOM is ready
      setTimeout(performCheck, 100);
    }

    if (checkInterval && checkInterval > 0) {
      intervalRef.current = setInterval(performCheck, checkInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, checkOnMount, checkInterval]);

  return {
    issues,
    checkAccessibility,
    clearIssues,
  };
}

