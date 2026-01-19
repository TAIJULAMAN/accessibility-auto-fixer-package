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
    this.fixer = new AutoFixer(this.config);
  }

  async scanFiles(patterns: string[]): Promise<ScanResult[]> {
    const files = await findFiles(patterns, this.config.ignore);
    const results: ScanResult[] = [];

    // Initialize cache if enabled
    const performanceConfig = this.config.performance || {};
    const cacheEnabled = performanceConfig.cache !== false;
    const parallel = performanceConfig.parallel !== false;
    const maxConcurrency = performanceConfig.maxConcurrency || 10;

    let cache: any = null;
    if (cacheEnabled) {
      const { FileCache } = await import('./utils/cache');
      cache = new FileCache(performanceConfig.cacheDir, true);
    }

    // Process files
    if (parallel && files.length > 1) {
      // Parallel processing with concurrency limit
      const pLimit = (await import('p-limit')).default;
      const limit = pLimit(maxConcurrency);

      const promises = files.map((file) =>
        limit(() => this.processFile(file, cache))
      );

      const fileResults = await Promise.all(promises);
      results.push(...fileResults.filter((r): r is ScanResult => r !== null));
    } else {
      // Sequential processing
      for (const file of files) {
        const result = await this.processFile(file, cache);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Process a single file with caching support
   */
  private async processFile(file: string, cache: any): Promise<ScanResult | null> {
    try {
      const content = await readFile(file);

      // Check cache first
      if (cache) {
        const cached = cache.get(file, content);
        if (cached) {
          return cached;
        }
      }

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

      const result: ScanResult = {
        file,
        issues: issuesWithFixes,
        fixed: fixedCount,
        total: issues.length,
      };

      // Store in cache
      if (cache && !this.config.fix) {
        cache.set(file, content, result);
      }

      return result;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      return null;
    }
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

