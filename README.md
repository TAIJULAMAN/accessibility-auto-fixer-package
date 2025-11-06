#  Accessibility Auto-Fixer

[![npm version](https://img.shields.io/npm/v/accessibility-auto-fixer.svg)](https://www.npmjs.com/package/accessibility-auto-fixer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Accessibility Auto-Fixer** is a powerful tool that scans your code for accessibility issues and automatically fixes common problems, helping you build more inclusive web applications.

## ✨ Features

- 🔍 **Comprehensive Scanning** - Detects 14+ types of accessibility issues
- 🛠️ **Auto-Fix** - Automatically fixes common issues without manual intervention
- 📊 **Beautiful Reports** - Generate HTML or JSON reports with detailed issue breakdowns
- 🎯 **Multi-Format Support** - Works with HTML, JSX, TSX, and React files
- ⚛️ **React & TypeScript Support** - React hooks, components, and TypeScript types included
- 🎨 **Runtime Checking** - Check accessibility issues at runtime in your React apps
- ⚙️ **Configurable** - Customize rules, severity levels, and ignore patterns
- 🚀 **Lightweight** - Minimal dependencies

## 📦 Installation

```bash
npm install -g accessibility-auto-fixer
```

## 🚀 Quick Start

### Scan files for issues:

```bash
a11y-fix "**/*.html" "**/*.jsx" "**/*.tsx"
```

### Automatically fix issues:

```bash
a11y-fix "**/*.html" "**/*.jsx" --fix
```

### Generate a report:

```bash
a11y-fix "**/*.html" --report --output a11y-report.html
```

## 📖 Usage

### CLI Command

```bash
a11y-fix <patterns...> [options]
```

#### Arguments

- `<patterns...>` - File patterns to scan (e.g., `"**/*.html"`, `"**/*.jsx"`)

#### Options

- `-f, --fix` - Automatically fix issues where possible
- `-r, --report` - Generate a report file
- `-o, --output <path>` - Output path for report (default: `a11y-report.html`)
- `-c, --config <path>` - Path to config file
- `--json` - Output report as JSON
- `--ignore <patterns...>` - Patterns to ignore

### Programmatic API

```typescript
import { AccessibilityAutoFixer } from 'accessibility-auto-fixer';

const scanner = new AccessibilityAutoFixer({
  fix: true,
  report: true,
  reportPath: 'a11y-report.html',
  ignore: ['**/node_modules/**'],
});

const results = await scanner.scanFiles(['**/*.html', '**/*.jsx']);

results.forEach((result) => {
  console.log(`File: ${result.file}`);
  console.log(`Issues: ${result.total}`);
  console.log(`Fixed: ${result.fixed}`);
});
```

## ⚛️ React & TypeScript Usage

This package includes React hooks and components for runtime accessibility checking in your React applications.

### React Hooks

#### `useAccessibility` Hook

Check accessibility issues on a specific element:

```tsx
import { useAccessibility } from 'accessibility-auto-fixer/react';
import { useRef } from 'react';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const { issues, checkAccessibility, clearIssues } = useAccessibility(ref, {
    enabled: true,
    checkOnMount: true,
    onIssueFound: (issues) => {
      console.log('Found issues:', issues);
    },
  });

  return (
    <div ref={ref}>
      <img src="/logo.png" /> {/* Missing alt text will be detected */}
      {issues.length > 0 && (
        <div>Found {issues.length} accessibility issues</div>
      )}
    </div>
  );
}
```

#### `useAccessibilityRef` Hook

Convenience hook that combines `useRef` with `useAccessibility`:

```tsx
import { useAccessibilityRef } from 'accessibility-auto-fixer/react';

function MyComponent() {
  const { ref, issues, checkAccessibility } = useAccessibilityRef<HTMLDivElement>({
    enabled: process.env.NODE_ENV === 'development',
  });

  return <div ref={ref}>Content</div>;
}
```

### React Components

#### `AccessibilityChecker` Component

Wrap your app or components to automatically check for accessibility issues:

```tsx
import { AccessibilityChecker } from 'accessibility-auto-fixer/react';

function App() {
  return (
    <AccessibilityChecker enabled={true} showIssues={true}>
      <div>
        <h1>My App</h1>
        <img src="/logo.png" /> {/* Will show missing alt text */}
        <button onClick={handleClick}>Click me</button>
      </div>
    </AccessibilityChecker>
  );
}
```

#### `AccessibilityProvider` Component

Use context to share accessibility state across your app:

```tsx
import { AccessibilityProvider, useAccessibilityContext } from 'accessibility-auto-fixer/react';

function App() {
  return (
    <AccessibilityProvider>
      <MyComponent />
    </AccessibilityProvider>
  );
}

function MyComponent() {
  const { issues, addIssue, clearIssues } = useAccessibilityContext();
  
  return (
    <div>
      <p>Total issues: {issues.length}</p>
      <button onClick={clearIssues}>Clear Issues</button>
    </div>
  );
}
```

### Accessible Components

#### `AccessibleButton`

A button component that enforces accessibility best practices:

```tsx
import { AccessibleButton } from 'accessibility-auto-fixer/react';

function MyComponent() {
  return (
    <AccessibleButton 
      ariaLabel="Close dialog" 
      onClick={handleClose}
      type="button"
    >
      Close
    </AccessibleButton>
  );
}
```

#### `AccessibleImage`

An image component that requires alt text:

```tsx
import { AccessibleImage } from 'accessibility-auto-fixer/react';

function MyComponent() {
  return (
    <>
      {/* Required alt text */}
      <AccessibleImage 
        src="/logo.png" 
        alt="Company logo"
        width={200}
        height={100}
      />
      
      {/* Decorative image */}
      <AccessibleImage 
        src="/pattern.png" 
        alt=""
        decorative={true}
      />
    </>
  );
}
```

### TypeScript Support

Full TypeScript support is included with type definitions:

```tsx
import { 
  AccessibilityIssue,
  UseAccessibilityOptions,
  AccessibilityCheckerProps 
} from 'accessibility-auto-fixer/react';
```

## 🔍 Detected Issues

The tool detects and can fix the following accessibility issues:

| Issue Type | Severity | Auto-Fixable | Description |
|------------|----------|--------------|-------------|
| `missing-alt-text` | Error | ✅ Yes | Images missing alt attribute |
| `missing-aria-label` | Warning | ❌ No | Interactive elements missing aria-label |
| `missing-form-label` | Error | ❌ No | Form inputs missing associated labels |
| `missing-button-type` | Warning | ✅ Yes | Buttons missing type attribute |
| `duplicate-id` | Error | ❌ No | Duplicate ID attributes found |
| `missing-lang-attribute` | Error | ✅ Yes | HTML element missing lang attribute |
| `missing-heading-hierarchy` | Warning | ❌ No | Incorrect heading hierarchy |
| `missing-landmark` | Info | ❌ No | Missing ARIA landmarks |
| `invalid-role` | Error | ❌ No | Invalid ARIA role values |
| `invalid-aria-attribute` | Error | ❌ No | Invalid ARIA attributes |

## ⚙️ Configuration

Create a `.a11yrc.json` file in your project root:

```json
{
  "fix": true,
  "report": true,
  "reportPath": "a11y-report.html",
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**"
  ],
  "rules": {
    "missing-alt-text": {
      "enabled": true,
      "severity": "error"
    },
    "missing-aria-label": {
      "enabled": true,
      "severity": "warning"
    }
  }
}
```

## 📊 Report Examples

### Console Report

The tool provides a color-coded console output:

```
🔍 Accessibility Scan Report
============================================================

📄 src/components/Button.tsx
   Total Issues: 2 | Fixed: 1

   ❌ ERROR [missing-button-type] Line 15:10
      Button missing type attribute
      💡 Auto-fix available: Add type="button" to button

   ⚠️ WARNING [missing-aria-label] Line 23:5
      Interactive element missing aria-label or accessible text
```

### HTML Report

Generate a beautiful HTML report with:

```bash
a11y-fix "**/*.html" --report
```

The HTML report includes:
- Summary statistics
- Detailed issue breakdown per file
- Code snippets showing issues
- Auto-fix suggestions
- Color-coded severity indicators

## 🎯 Examples

### Example 1: Fix all HTML files

```bash
a11y-fix "**/*.html" --fix
```

### Example 2: Scan React components and generate report

```bash
a11y-fix "src/**/*.jsx" "src/**/*.tsx" --report --output reports/a11y.html
```

### Example 3: Use with npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "a11y:check": "a11y-fix \"src/**/*.{html,jsx,tsx}\"",
    "a11y:fix": "a11y-fix \"src/**/*.{html,jsx,tsx}\" --fix",
    "a11y:report": "a11y-fix \"src/**/*.{html,jsx,tsx}\" --report"
  }
}
```

Then run:

```bash
npm run a11y:check
npm run a11y:fix
npm run a11y:report
```

## 🔧 Auto-Fixable Issues

The following issues can be automatically fixed:

- ✅ **Missing alt text** - Adds `alt=""` attribute (for decorative images)
- ✅ **Missing button type** - Adds `type="button"` attribute
- ✅ **Missing lang attribute** - Adds `lang="en"` to HTML element

**Note:** Some issues require manual intervention as they need context about your content (e.g., meaningful alt text for images).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

This tool is inspired by the need for better accessibility tooling in the web development ecosystem. Special thanks to the ARIA working group and WCAG guidelines.

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility](https://webaim.org/)

---

Made with ❤️ for a more accessible web

