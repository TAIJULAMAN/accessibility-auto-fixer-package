import React, { ReactNode, useRef } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { AccessibilityIssue } from '../../types';

export interface AccessibilityCheckerProps {
  children: ReactNode;
  enabled?: boolean;
  showIssues?: boolean;
  className?: string;
  onIssueFound?: (issues: AccessibilityIssue[]) => void;
}

/**
 * React component that wraps children and checks for accessibility issues
 * 
 * @example
 * ```tsx
 * <AccessibilityChecker enabled={true} showIssues={true}>
 *   <YourComponent />
 * </AccessibilityChecker>
 * ```
 */
export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({
  children,
  enabled = true,
  showIssues = false,
  className,
  onIssueFound,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { issues, checkAccessibility } = useAccessibility(ref, {
    enabled,
    onIssueFound,
    checkOnMount: true,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      case 'info':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div ref={ref} className={className}>
      {children}
      {showIssues && enabled && issues.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            border: '2px solid #e74c3c',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            fontSize: '14px',
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
            ⚠️ Accessibility Issues ({issues.length})
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {issues.map((issue, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                  background: '#f8f9fa',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {issue.severity.toUpperCase()}: {issue.type}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {issue.message}
                </div>
                {issue.code && (
                  <pre
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      fontSize: '11px',
                      overflow: 'auto',
                    }}
                  >
                    {issue.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={checkAccessibility}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Re-check
          </button>
        </div>
      )}
    </div>
  );
};

