import { readFile, writeFile, findFiles, isHTMLFile, isJSXFile } from './utils/fileReader';
import { HTMLScanner } from './scanner/htmlScanner';
import { JSXScanner } from './scanner/jsxScanner';
import { AutoFixer } from './fixer/autoFixer';
import { AccessibilityIssue, ScanResult, Config } from './types';

export class AccessibilityAutoFixer {
  private config: Config;
  private fixer: AutoFixer;

  constructor(config: Config = {}) {
    this.config = {
      fix: false,
      report: false,
      ...config,
    };
    this.fixer = new AutoFixer();
  }

  async scanFiles(patterns: string[]): Promise<ScanResult[]> {
    const files = await findFiles(patterns, this.config.ignore);
    const results: ScanResult[] = [];

    for (const file of files) {
      try {
        const content = await readFile(file);
        const issues = await this.scanFile(file, content);

        // Generate fixes
        const issuesWithFixes = this.fixer.generateFixes(issues);

        // Apply fixes if enabled
        let fixedCount = 0;
        let fixedContent = content;

        if (this.config.fix) {
          const fixableIssues = issuesWithFixes.filter((i) => i.fix);
          if (fixableIssues.length > 0) {
            if (isHTMLFile(file)) {
              fixedContent = await this.fixer.fixHTML(content, fixableIssues);
            } else if (isJSXFile(file)) {
              fixedContent = await this.fixer.fixJSX(content, fixableIssues);
            }

            if (fixedContent !== content) {
              await writeFile(file, fixedContent);
              fixedCount = fixableIssues.length;
            }
          }
        }

        results.push({
          file,
          issues: issuesWithFixes,
          fixed: fixedCount,
          total: issues.length,
        });
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    return results;
  }

  private async scanFile(filePath: string, content: string): Promise<AccessibilityIssue[]> {
    if (isHTMLFile(filePath)) {
      const scanner = new HTMLScanner(content);
      return scanner.scan();
    } else if (isJSXFile(filePath)) {
      const scanner = new JSXScanner(content);
      return scanner.scan();
    }

    return [];
  }

  getConfig(): Config {
    return this.config;
  }

  setConfig(config: Partial<Config>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export types
export * from './types';

// Note: React modules are available via 'accessibility-auto-fixer/react'

