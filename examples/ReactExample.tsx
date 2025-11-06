import React from 'react';
import {
  AccessibilityChecker,
  AccessibilityProvider,
  useAccessibilityContext,
  useAccessibilityRef,
  useAccessibility,
  AccessibleButton,
  AccessibleImage,
} from '../src/react';

// Example 1: Using the AccessibilityChecker component
export function ExampleWithChecker() {
  return (
    <AccessibilityChecker enabled={true} showIssues={true}>
      <div>
        <h1>My App</h1>
        <img src="/logo.png" /> {/* Will show missing alt text */}
        <button onClick={() => alert('clicked')}>Click me</button> {/* Will show missing type */}
        <input type="text" /> {/* Will show missing label */}
      </div>
    </AccessibilityChecker>
  );
}

// Example 2: Using the useAccessibilityRef hook
export function ExampleWithHook() {
  const { ref, issues, checkAccessibility } = useAccessibilityRef<HTMLDivElement>({
    enabled: true,
    onIssueFound: (issues) => {
      console.log('Found accessibility issues:', issues);
    },
  });

  return (
    <div>
      <div ref={ref}>
        <h2>Content that will be checked</h2>
        <img src="/banner.jpg" />
        <button>Submit</button>
      </div>
      
      {issues.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#fee' }}>
          <h3>Accessibility Issues Found: {issues.length}</h3>
          <button onClick={checkAccessibility}>Re-check</button>
        </div>
      )}
    </div>
  );
}

// Example 3: Using AccessibleButton component
export function ExampleWithAccessibleComponents() {
  return (
    <div>
      <AccessibleButton ariaLabel="Close dialog" onClick={() => console.log('closed')}>
        Close
      </AccessibleButton>
      
      <AccessibleImage 
        src="/logo.png" 
        alt="Company logo"
        width={200}
        height={100}
      />
      
      <AccessibleImage 
        src="/pattern.png" 
        alt=""
        decorative={true}
      />
    </div>
  );
}

// Example 4: Using AccessibilityProvider
export function ExampleWithProvider() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}

function AppContent() {
  const { issues, addIssue, clearIssues } = useAccessibilityContext();
  
  return (
    <div>
      <h1>My Accessible App</h1>
      <p>Total issues: {issues.length}</p>
      <button onClick={clearIssues}>Clear Issues</button>
    </div>
  );
}

// Example 5: Using useAccessibility hook directly
export function ExampleWithDirectHook() {
  const divRef = React.useRef<HTMLDivElement>(null);
  const { issues, checkAccessibility } = useAccessibility(divRef, {
    enabled: process.env.NODE_ENV === 'development',
    checkOnMount: true,
    checkInterval: 5000, // Check every 5 seconds
  });

  return (
    <div>
      <div ref={divRef}>
        <h1>Content</h1>
        <img src="/image.jpg" />
      </div>
      
      <div>
        <h2>Issues: {issues.length}</h2>
        <button onClick={checkAccessibility}>Check Now</button>
      </div>
    </div>
  );
}

