import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AccessibilityIssue } from '../../types';

interface AccessibilityContextType {
  issues: AccessibilityIssue[];
  addIssue: (issue: AccessibilityIssue) => void;
  removeIssue: (issue: AccessibilityIssue) => void;
  clearIssues: () => void;
  getIssuesByType: (type: string) => AccessibilityIssue[];
  getIssuesBySeverity: (severity: string) => AccessibilityIssue[];
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * React context provider for accessibility issues
 * Use this to share accessibility state across your app
 * 
 * @example
 * ```tsx
 * <AccessibilityProvider>
 *   <App />
 * </AccessibilityProvider>
 * ```
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);

  const addIssue = useCallback((issue: AccessibilityIssue) => {
    setIssues((prev) => {
      // Check if issue already exists
      const exists = prev.some(
        (i) =>
          i.type === issue.type &&
          i.line === issue.line &&
          i.column === issue.column &&
          i.message === issue.message
      );
      if (exists) {
        return prev;
      }
      return [...prev, issue];
    });
  }, []);

  const removeIssue = useCallback((issue: AccessibilityIssue) => {
    setIssues((prev) =>
      prev.filter(
        (i) =>
          !(
            i.type === issue.type &&
            i.line === issue.line &&
            i.column === issue.column &&
            i.message === issue.message
          )
      )
    );
  }, []);

  const clearIssues = useCallback(() => {
    setIssues([]);
  }, []);

  const getIssuesByType = useCallback(
    (type: string) => {
      return issues.filter((issue) => issue.type === type);
    },
    [issues]
  );

  const getIssuesBySeverity = useCallback(
    (severity: string) => {
      return issues.filter((issue) => issue.severity === severity);
    },
    [issues]
  );

  const value: AccessibilityContextType = {
    issues,
    addIssue,
    removeIssue,
    clearIssues,
    getIssuesByType,
    getIssuesBySeverity,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to access accessibility context
 * 
 * @example
 * ```tsx
 * const { issues, addIssue, clearIssues } = useAccessibilityContext();
 * ```
 */
export function useAccessibilityContext(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}

