#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AccessibilityAutoFixer } from './index';
import { ReportGenerator } from './report/reportGenerator';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('a11y-fix')
  .description('Automatically detect and fix accessibility issues in HTML, JSX, and TSX files')
  .version('1.0.0')
  .argument('<patterns...>', 'File patterns to scan (e.g., "**/*.html" "**/*.jsx")')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .option('-r, --report', 'Generate a report file')
  .option('-o, --output <path>', 'Output path for report (default: a11y-report.html)')
  .option('-c, --config <path>', 'Path to config file')
  .option('--json', 'Output report as JSON')
  .option('--ignore <patterns...>', 'Patterns to ignore')

  .action(async (patterns: string[], options) => {
    try {
      console.log(chalk.blue.bold('\n🔍 Accessibility Auto-Fixer\n'));

      // Load config if provided
      let config: any = {};
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
      }

      // Merge CLI options with config
      const finalConfig = {
        ...config,
        fix: options.fix || config.fix || false,
        report: options.report || config.report || false,
        reportPath: options.output || config.reportPath || 'a11y-report.html',
        ignore: options.ignore || config.ignore || [],
      };

      // Create scanner
      const scanner = new AccessibilityAutoFixer(finalConfig);

      // Scan files
      console.log(chalk.gray(`Scanning files matching: ${patterns.join(', ')}...\n`));
      const results = await scanner.scanFiles(patterns);

      // Generate report
      const reportGenerator = new ReportGenerator(results);
      reportGenerator.generateConsoleReport();

      // Generate report file if requested
      if (finalConfig.report) {
        const reportPath = path.resolve(finalConfig.reportPath || 'a11y-report.html');
        
        if (options.json) {
          await reportGenerator.generateJSONReport(reportPath.replace('.html', '.json'));
          console.log(chalk.green(`\n✅ JSON report generated: ${reportPath.replace('.html', '.json')}`));
        } else {
          await reportGenerator.generateHTMLReport(reportPath);
          console.log(chalk.green(`\n✅ HTML report generated: ${reportPath}`));
        }
      }

      // Exit with error code if there are errors
      const hasErrors = results.some((r) =>
        r.issues.some((i) => i.severity === 'error')
      );

      if (hasErrors && !finalConfig.fix) {
        console.log(chalk.yellow('\n💡 Tip: Use --fix to automatically fix issues where possible\n'));
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse();

