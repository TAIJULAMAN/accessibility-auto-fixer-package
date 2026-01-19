# Accessibility Auto-Fixer - Usage Guide

A comprehensive guide to using the Accessibility Auto-Fixer package for detecting and fixing accessibility issues in your projects.

---

## 📚 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Programmatic API](#programmatic-api)
- [React Integration](#react-integration)
- [Configuration](#configuration)
- [Performance Optimization](#performance-optimization)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Installation

### Global Installation (Recommended for CLI)

```bash
npm install -g accessibility-auto-fixer
```

### Local Installation (For Projects)

```bash
npm install --save-dev accessibility-auto-fixer
```

### For React Projects

```bash
npm install accessibility-auto-fixer
```

---

## ⚡ Quick Start

### 1. Scan Your Files

```bash
a11y-fix "src/**/*.{html,jsx,tsx}"
```

### 2. Auto-Fix Issues

```bash
a11y-fix "src/**/*.{html,jsx,tsx}" --fix
```

### 3. Generate Report

```bash
a11y-fix "src/**/*.{html,jsx,tsx}" --report
```

That's it! The tool will scan your files, fix common issues, and show you what needs manual attention.

---

## 🖥️ CLI Usage

### Basic Commands

#### Scan Files
```bash
a11y-fix "**/*.html"
a11y-fix "src/**/*.jsx"
a11y-fix "**/*.{html,jsx,tsx}"
```

#### Auto-Fix Issues
```bash
a11y-fix "src/**/*.tsx" --fix
```

#### Generate HTML Report
```bash
a11y-fix "src/**/*.tsx" --report --output my-report.html
```

#### Generate JSON Report
```bash
a11y-fix "src/**/*.tsx" --report --json --output report.json
```

#### Use Config File
```bash
a11y-fix "src/**/*.tsx" --config .a11yrc.json
```

#### Ignore Patterns
```bash
a11y-fix "**/*.tsx" --ignore "**/node_modules/**" "**/dist/**"
```

### CLI Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--fix` | `-f` | Automatically fix issues | `--fix` |
| `--report` | `-r` | Generate a report file | `--report` |
| `--output <path>` | `-o` | Output path for report | `--output report.html` |
| `--config <path>` | `-c` | Path to config file | `--config .a11yrc.json` |
| `--json` | | Output report as JSON | `--json` |
| `--ignore <patterns>` | | Patterns to ignore | `--ignore "**/dist/**"` |

### Exit Codes

- `0` - No errors found or all errors fixed
- `1` - Errors found and not fixed

---

## 💻 Programmatic API

### Basic Usage

```typescript
import { AccessibilityAutoFixer } from 'accessibility-auto-fixer';

const scanner = new AccessibilityAutoFixer({
  fix: true,
  report: true,
  reportPath: 'a11y-report.html'
});

const results = await scanner.scanFiles(['src/**/*.tsx']);

results.forEach(result => {
  console.log(`File: ${result.file}`);
  console.log(`Issues: ${result.total}`);
  console.log(`Fixed: ${result.fixed}`);
});
```

### Advanced Configuration

```typescript
const scanner = new AccessibilityAutoFixer({
  fix: true,
  report: true,
  reportPath: 'reports/a11y.html',
  ignore: ['**/node_modules/**', '**/dist/**'],
  
  // Performance optimizations
  performance: {
    cache: true,
    cacheDir: '.a11y-cache',
    parallel: true,
    maxConcurrency: 10
  },
  
  // Auto-fix options
  autoFix: {
    generateAriaLabels: true,
    wrapInputsWithLabels: true
  },
  
  // Rule configuration
  rules: {
    'missing-alt-text': {
      enabled: true,
      severity: 'error'
    },
    'missing-aria-label': {
      enabled: true,
      severity: 'warning'
    }
  }
});

const results = await scanner.scanFiles(['src/**/*.tsx']);
```

### Scan Single File

```typescript
import { readFileSync } from 'fs';

const content = readFileSync('src/component.tsx', 'utf-8');
const issues = await scanner.scanFile('src/component.tsx', content);

console.log(`Found ${issues.length} issues`);
```

---

## ⚛️ React Integration

### Using Hooks

#### `useAccessibility` Hook

Check accessibility on a specific element:

```tsx
import { useAccessibility } from 'accessibility-auto-fixer/react';
import { useRef } from 'react';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  
  const { issues, checkAccessibility, clearIssues } = useAccessibility(ref, {
    enabled: true,
    checkOnMount: true,
    debounceMs: 300,
    onIssueFound: (issues) => {
      console.log(`Found ${issues.length} issues`);
    }
  });

  return (
    <div ref={ref}>
      <img src="/logo.png" /> {/* Will detect missing alt */}
      <button onClick={handleClick}>Click</button> {/* Will detect missing type */}
      
      {issues.length > 0 && (
        <div className="issues-panel">
          <h3>Accessibility Issues: {issues.length}</h3>
          <button onClick={checkAccessibility}>Re-check</button>
          <button onClick={clearIssues}>Clear</button>
        </div>
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
    debounceMs: 500
  });

  return (
    <div ref={ref}>
      <h1>My Content</h1>
      {/* Content */}
    </div>
  );
}
```

### Using Components

#### `AccessibilityChecker` Component

Wrap your app to automatically check for issues:

```tsx
import { AccessibilityChecker } from 'accessibility-auto-fixer/react';

function App() {
  return (
    <AccessibilityChecker 
      enabled={process.env.NODE_ENV === 'development'}
      showIssues={true}
    >
      <div>
        <h1>My App</h1>
        <img src="/logo.png" />
        <button onClick={handleClick}>Click me</button>
      </div>
    </AccessibilityChecker>
  );
}
```

#### `AccessibilityProvider` Component

Share accessibility state across your app:

```tsx
import { 
  AccessibilityProvider, 
  useAccessibilityContext 
} from 'accessibility-auto-fixer/react';

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
      <button onClick={clearIssues}>Clear All Issues</button>
    </div>
  );
}
```

### Accessible Components

#### `AccessibleButton`

```tsx
import { AccessibleButton } from 'accessibility-auto-fixer/react';

function MyComponent() {
  return (
    <AccessibleButton 
      ariaLabel="Close dialog" 
      onClick={handleClose}
      type="button"
    >
      ✕
    </AccessibleButton>
  );
}
```

#### `AccessibleImage`

```tsx
import { AccessibleImage } from 'accessibility-auto-fixer/react';

function MyComponent() {
  return (
    <>
      {/* Regular image with alt text */}
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

---

## ⚙️ Configuration

### Configuration File (`.a11yrc.json`)

Create a `.a11yrc.json` file in your project root:

```json
{
  "fix": true,
  "report": true,
  "reportPath": "reports/a11y-report.html",
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.test.*",
    "**/*.spec.*"
  ],
  "performance": {
    "cache": true,
    "cacheDir": ".a11y-cache",
    "parallel": true,
    "maxConcurrency": 10
  },
  "autoFix": {
    "generateAriaLabels": true,
    "wrapInputsWithLabels": true
  },
  "rules": {
    "missing-alt-text": {
      "enabled": true,
      "severity": "error"
    },
    "missing-aria-label": {
      "enabled": true,
      "severity": "warning"
    },
    "missing-form-label": {
      "enabled": true,
      "severity": "error"
    },
    "missing-button-type": {
      "enabled": true,
      "severity": "warning"
    },
    "duplicate-id": {
      "enabled": true,
      "severity": "error"
    },
    "missing-lang-attribute": {
      "enabled": true,
      "severity": "error"
    },
    "invalid-role": {
      "enabled": true,
      "severity": "error"
    }
  }
}
```

### Configuration Options

#### Basic Options

- `fix` (boolean): Enable auto-fixing
- `report` (boolean): Generate report file
- `reportPath` (string): Path for report output
- `ignore` (string[]): File patterns to ignore

#### Performance Options

- `performance.cache` (boolean): Enable file caching (default: true)
- `performance.cacheDir` (string): Cache directory (default: `.a11y-cache`)
- `performance.parallel` (boolean): Enable parallel processing (default: true)
- `performance.maxConcurrency` (number): Max concurrent files (default: 10)

#### Auto-Fix Options

- `autoFix.generateAriaLabels` (boolean): Auto-generate ARIA labels (default: true)
- `autoFix.wrapInputsWithLabels` (boolean): Add labels to inputs (default: true)

#### Rule Configuration

Each rule can have:
- `enabled` (boolean): Enable/disable the rule
- `severity` ('error' | 'warning' | 'info'): Issue severity level

---

## 🚀 Performance Optimization

### Enable Caching

Caching makes repeated scans 95%+ faster:

```json
{
  "performance": {
    "cache": true,
    "cacheDir": ".a11y-cache"
  }
}
```

**Add to `.gitignore`:**
```
.a11y-cache/
```

### Enable Parallel Processing

Process multiple files simultaneously:

```json
{
  "performance": {
    "parallel": true,
    "maxConcurrency": 10
  }
}
```

**Recommended concurrency by project size:**
- Small (< 50 files): 5
- Medium (50-200 files): 10
- Large (200-1000 files): 15
- Very large (> 1000 files): 20

### React Hook Optimization

Use debouncing to prevent excessive checks:

```tsx
const { issues } = useAccessibility(ref, {
  debounceMs: 300, // Wait 300ms before checking
  checkInterval: 5000, // Auto-check every 5 seconds
});
```

---

## 📖 Common Use Cases

### 1. CI/CD Integration

**GitHub Actions:**

```yaml
name: Accessibility Check

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g accessibility-auto-fixer
      - run: a11y-fix "src/**/*.{html,jsx,tsx}" --report --json
      - uses: actions/upload-artifact@v2
        with:
          name: a11y-report
          path: a11y-report.json
```

### 2. Pre-commit Hook

**Using Husky:**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "a11y-fix \"src/**/*.{html,jsx,tsx}\" --fix"
    }
  }
}
```

### 3. npm Scripts

**package.json:**

```json
{
  "scripts": {
    "a11y:check": "a11y-fix \"src/**/*.{html,jsx,tsx}\"",
    "a11y:fix": "a11y-fix \"src/**/*.{html,jsx,tsx}\" --fix",
    "a11y:report": "a11y-fix \"src/**/*.{html,jsx,tsx}\" --report",
    "a11y:watch": "nodemon --watch src --exec \"npm run a11y:check\""
  }
}
```

### 4. Development Mode Only (React)

```tsx
import { AccessibilityChecker } from 'accessibility-auto-fixer/react';

function App() {
  return (
    <AccessibilityChecker 
      enabled={process.env.NODE_ENV === 'development'}
      showIssues={true}
    >
      <YourApp />
    </AccessibilityChecker>
  );
}
```

### 5. Custom Issue Handling

```typescript
const scanner = new AccessibilityAutoFixer({ fix: false });
const results = await scanner.scanFiles(['src/**/*.tsx']);

// Filter critical issues
const criticalIssues = results.flatMap(r => 
  r.issues.filter(i => i.severity === 'error')
);

// Send to monitoring service
if (criticalIssues.length > 0) {
  await sendToMonitoring({
    type: 'accessibility',
    count: criticalIssues.length,
    issues: criticalIssues
  });
}
```

---

## 🔧 Troubleshooting

### Issue: Build errors with TypeScript

**Solution:** Make sure you have the required dependencies:

```bash
npm install --save-dev @types/react @types/react-dom
```

### Issue: Cache not working

**Solution:** Clear the cache directory:

```bash
rm -rf .a11y-cache
```

Or disable caching:

```json
{
  "performance": {
    "cache": false
  }
}
```

### Issue: Slow performance on large projects

**Solutions:**

1. Enable parallel processing:
```json
{
  "performance": {
    "parallel": true,
    "maxConcurrency": 15
  }
}
```

2. Add more ignore patterns:
```json
{
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js"
  ]
}
```

3. Scan specific directories only:
```bash
a11y-fix "src/components/**/*.tsx" --fix
```

### Issue: React hooks not detecting issues

**Solution:** Make sure the ref is attached and DOM is ready:

```tsx
const { issues, checkAccessibility } = useAccessibility(ref, {
  checkOnMount: true, // Check after mount
  debounceMs: 300
});

useEffect(() => {
  // Manual check after data loads
  checkAccessibility();
}, [data]);
```

### Issue: Auto-fix not working

**Possible causes:**

1. Fix not enabled:
```bash
a11y-fix "src/**/*.tsx" --fix  # Add --fix flag
```

2. Issue not auto-fixable - check the documentation for which issues can be auto-fixed

3. File permissions - ensure files are writable

---

## 📊 Understanding Reports

### Console Report

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

The HTML report includes:
- Summary statistics
- Issue breakdown by severity
- File-by-file details
- Code snippets
- Auto-fix suggestions

### JSON Report

```json
{
  "summary": {
    "totalFiles": 10,
    "totalIssues": 25,
    "fixedIssues": 15,
    "errors": 8,
    "warnings": 15,
    "info": 2
  },
  "files": [
    {
      "file": "src/component.tsx",
      "issues": [...],
      "fixed": 3,
      "total": 5
    }
  ]
}
```

---

## 🎯 Best Practices

1. **Run in CI/CD** - Catch issues before they reach production
2. **Use Auto-Fix** - Fix common issues automatically
3. **Enable Caching** - Speed up repeated scans
4. **Configure Rules** - Adjust severity based on your needs
5. **Review Reports** - Understand patterns in your codebase
6. **Development Only** - Use React hooks in development mode only
7. **Incremental Adoption** - Start with one directory, expand gradually

---

## 📚 Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility](https://webaim.org/)

---

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/TAIJULAMAN/accessibility-auto-fixer-package/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TAIJULAMAN/accessibility-auto-fixer-package/discussions)

---

**Happy Coding! 🎉**

Make the web more accessible, one fix at a time.
