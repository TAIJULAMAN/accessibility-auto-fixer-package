import { AccessibilityIssue, Fix, Config } from '../types';
import { HTMLScanner } from '../scanner/htmlScanner';
import { JSXScanner } from '../scanner/jsxScanner';
import { isHTMLFile, isJSXFile } from '../utils/fileReader';
import { ASTTransformer } from './astTransformer';

export class AutoFixer {
  private fixes: Fix[] = [];
  private astTransformer: ASTTransformer;
  private config: Config;

  constructor(config: Config = {}) {
    this.astTransformer = new ASTTransformer();
    this.config = config;
  }

  async fixHTML(html: string, issues: AccessibilityIssue[]): Promise<string> {
    const scanner = new HTMLScanner(html);
    const dom = scanner.getDOM();
    const document = dom.window.document;

    // Apply fixes
    for (const issue of issues) {
      const fix = issue.fix;
      if (fix) {
        this.applyFix(document, issue, fix);
      }
    }

    return dom.serialize();
  }

  async fixJSX(code: string, issues: AccessibilityIssue[]): Promise<string> {
    // Use AST transformer for more reliable fixes
    try {
      const fixableIssues = issues.filter((issue) => issue.fix);
      if (fixableIssues.length === 0) {
        return code;
      }

      return await this.astTransformer.transformJSX(code, fixableIssues);
    } catch (error) {
      console.error('AST transformation failed, falling back to string manipulation:', error);
      // Fallback to old method if AST transformation fails
      return this.fixJSXLegacy(code, issues);
    }
  }

  /**
   * Legacy JSX fix method (fallback)
   */
  private async fixJSXLegacy(code: string, issues: AccessibilityIssue[]): Promise<string> {
    let fixedCode = code;
    const lines = code.split('\n');

    // Sort issues by line number (descending) to avoid offset issues
    const sortedIssues = [...issues].sort((a, b) => b.line - a.line);

    for (const issue of sortedIssues) {
      const fix = issue.fix;
      if (fix) {
        fixedCode = this.applyJSXFix(fixedCode, issue, fix, lines);
        lines.splice(0, lines.length, ...fixedCode.split('\n'));
      }
    }

    return fixedCode;
  }

  generateFixes(issues: AccessibilityIssue[]): AccessibilityIssue[] {
    return issues.map((issue) => {
      const fix = this.generateFixForIssue(issue);
      return { ...issue, fix };
    });
  }

  private generateFixForIssue(issue: AccessibilityIssue): Fix | undefined {
    const autoFixConfig = this.config.autoFix || {};

    switch (issue.type) {
      case 'missing-alt-text':
        return {
          type: 'add-attribute',
          description: 'Add alt attribute to image',
          code: 'alt=""',
          position: {
            line: issue.line,
            column: issue.column,
          },
        };

      case 'missing-button-type':
        return {
          type: 'add-attribute',
          description: 'Add type="button" to button',
          code: 'type="button"',
          position: {
            line: issue.line,
            column: issue.column,
          },
        };

      case 'missing-lang-attribute':
        return {
          type: 'add-attribute',
          description: 'Add lang attribute to html element',
          code: 'lang="en"',
          position: {
            line: issue.line,
            column: issue.column,
          },
        };

      case 'missing-aria-label':
        // Auto-fix if enabled in config
        if (autoFixConfig.generateAriaLabels !== false) {
          return {
            type: 'add-attribute',
            description: 'Add aria-label attribute',
            code: 'aria-label="Interactive element"',
            position: {
              line: issue.line,
              column: issue.column,
            },
          };
        }
        return undefined;

      case 'missing-form-label':
        // Auto-fix if enabled in config
        if (autoFixConfig.wrapInputsWithLabels !== false) {
          return {
            type: 'add-attribute',
            description: 'Add aria-label to input',
            code: 'aria-label="Input field"',
            position: {
              line: issue.line,
              column: issue.column,
            },
          };
        }
        return undefined;

      case 'duplicate-id':
        // Can't auto-fix - needs manual intervention
        return undefined;

      default:
        return undefined;
    }
  }

  private applyFix(document: Document, issue: AccessibilityIssue, fix: Fix): void {
    // This is a simplified version - in production, you'd need more sophisticated DOM manipulation
    // For now, we'll handle the most common cases
    switch (issue.type) {
      case 'missing-alt-text':
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.hasAttribute('alt')) {
            img.setAttribute('alt', '');
          }
        });
        break;

      case 'missing-button-type':
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button) => {
          if (!button.hasAttribute('type')) {
            button.setAttribute('type', 'button');
          }
        });
        break;

      case 'missing-lang-attribute':
        const html = document.documentElement;
        if (!html.hasAttribute('lang')) {
          html.setAttribute('lang', 'en');
        }
        break;
    }
  }

  private applyJSXFix(
    code: string,
    issue: AccessibilityIssue,
    fix: Fix,
    lines: string[]
  ): string {
    const lineIndex = issue.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      return code;
    }

    const line = lines[lineIndex];

    switch (fix.type) {
      case 'add-attribute': {
        // Find the opening tag and add attribute
        const tagMatch = line.match(/<(\w+)([^>]*)>/);
        if (tagMatch) {
          const beforeTag = line.substring(0, tagMatch.index);
          const tagName = tagMatch[1];
          const attributes = tagMatch[2];
          const afterTag = line.substring((tagMatch.index || 0) + tagMatch[0].length);

          // Check if attribute already exists
          if (!attributes.includes(fix.code.split('=')[0])) {
            const newLine = `${beforeTag}<${tagName}${attributes} ${fix.code}>${afterTag}`;
            lines[lineIndex] = newLine;
            return lines.join('\n');
          }
        }
        break;
      }

      case 'replace': {
        if (fix.position.endLine && fix.position.endColumn) {
          // Replace multi-line code
          const startLine = fix.position.line - 1;
          const endLine = fix.position.endLine - 1;
          const startCol = fix.position.column - 1;
          const endCol = fix.position.endColumn - 1;

          if (startLine === endLine) {
            const line = lines[startLine];
            const newLine =
              line.substring(0, startCol) + fix.code + line.substring(endCol);
            lines[startLine] = newLine;
          } else {
            // Multi-line replacement
            const firstLine = lines[startLine];
            const lastLine = lines[endLine];
            const newFirstLine = firstLine.substring(0, startCol) + fix.code;
            const newLastLine = lastLine.substring(endCol);

            lines.splice(startLine, endLine - startLine + 1, newFirstLine + newLastLine);
          }

          return lines.join('\n');
        }
        break;
      }

      case 'insert': {
        const insertLine = fix.position.line - 1;
        lines.splice(insertLine, 0, fix.code);
        return lines.join('\n');
      }

      case 'remove': {
        if (fix.position.endLine) {
          const startLine = fix.position.line - 1;
          const endLine = fix.position.endLine - 1;
          lines.splice(startLine, endLine - startLine + 1);
          return lines.join('\n');
        }
        break;
      }
    }

    return code;
  }
}

