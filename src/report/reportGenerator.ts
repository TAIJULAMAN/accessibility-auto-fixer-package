import * as fs from 'fs';
import * as path from 'path';
import { ScanResult } from '../types';
import chalk from 'chalk';

export class ReportGenerator {
  private results: ScanResult[];

  constructor(results: ScanResult[]) {
    this.results = results;
  }

  generateConsoleReport(): void {
    console.log('\n' + chalk.bold.cyan('Accessibility Scan Report'));
    console.log('='.repeat(60) + '\n');

    let totalIssues = 0;
    let totalFixed = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfo = 0;

    this.results.forEach((result) => {
      if (result.issues.length > 0 || result.fixed > 0) {
        console.log(chalk.bold(`\n📄 ${result.file}`));
        console.log(`   Total Issues: ${result.total} | Fixed: ${result.fixed}\n`);

        result.issues.forEach((issue) => {
          const icon = this.getIcon(issue.severity);
          const color = this.getColor(issue.severity);
          const severityLabel = issue.severity.toUpperCase();

          console.log(
            `   ${icon} ${color(severityLabel)} [${issue.type}] Line ${issue.line}:${issue.column}`
          );
          console.log(`      ${issue.message}`);
          if (issue.fix) {
            console.log(chalk.gray(`      💡 Auto-fix available: ${issue.fix.description}`));
          }
          console.log();

          totalIssues++;
          if (issue.severity === 'error') totalErrors++;
          else if (issue.severity === 'warning') totalWarnings++;
          else totalInfo++;
        });

        totalFixed += result.fixed;
      }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold('\n📊 Summary\n'));
    console.log(`   Files Scanned: ${this.results.length}`);
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   ${chalk.red(`Errors: ${totalErrors}`)}`);
    console.log(`   ${chalk.yellow(`Warnings: ${totalWarnings}`)}`);
    console.log(`   ${chalk.blue(`Info: ${totalInfo}`)}`);
    console.log(`   ${chalk.green(`Auto-fixed: ${totalFixed}`)}`);
    console.log();
  }

  async generateHTMLReport(outputPath: string): Promise<void> {
    const html = this.generateHTML();
    await fs.promises.writeFile(outputPath, html, 'utf-8');
  }

  async generateJSONReport(outputPath: string): Promise<void> {
    const json = JSON.stringify(this.results, null, 2);
    await fs.promises.writeFile(outputPath, json, 'utf-8');
  }

  private generateHTML(): string {
    let totalIssues = 0;
    let totalFixed = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfo = 0;

    this.results.forEach((result) => {
      totalIssues += result.total;
      totalFixed += result.fixed;
      result.issues.forEach((issue) => {
        if (issue.severity === 'error') totalErrors++;
        else if (issue.severity === 'warning') totalWarnings++;
        else totalInfo++;
      });
    });

    const issuesHtml = this.results
      .map((result) => {
        if (result.issues.length === 0 && result.fixed === 0) return '';

        const issuesList = result.issues
          .map((issue) => {
            const severityClass = `severity-${issue.severity}`;
            const fixBadge = issue.fix
              ? '<span class="badge badge-fix">Auto-fixable</span>'
              : '';
            return `
              <div class="issue ${severityClass}">
                <div class="issue-header">
                  <span class="issue-type">${issue.type}</span>
                  <span class="issue-severity">${issue.severity}</span>
                  ${fixBadge}
                  <span class="issue-location">Line ${issue.line}:${issue.column}</span>
                </div>
                <div class="issue-message">${this.escapeHtml(issue.message)}</div>
                ${issue.fix ? `<div class="issue-fix">💡 ${this.escapeHtml(issue.fix.description)}</div>` : ''}
                <pre class="issue-code">${this.escapeHtml(issue.code)}</pre>
              </div>
            `;
          })
          .join('');

        return `
          <div class="file-section">
            <h2 class="file-name">${this.escapeHtml(result.file)}</h2>
            <div class="file-stats">
              <span>Issues: ${result.total}</span>
              <span>Fixed: ${result.fixed}</span>
            </div>
            ${issuesList}
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accessibility Scan Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 30px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            padding: 20px;
            border-radius: 6px;
            text-align: center;
          }
          .summary-card.total { background: #ecf0f1; }
          .summary-card.errors { background: #fee; border-left: 4px solid #e74c3c; }
          .summary-card.warnings { background: #fff9e6; border-left: 4px solid #f39c12; }
          .summary-card.info { background: #e8f4f8; border-left: 4px solid #3498db; }
          .summary-card.fixed { background: #e8f5e9; border-left: 4px solid #27ae60; }
          .summary-card h3 { font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
          .summary-card .number { font-size: 32px; font-weight: bold; }
          .file-section {
            margin-bottom: 40px;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 20px;
          }
          .file-name {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 18px;
          }
          .file-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          .issue {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #ccc;
          }
          .issue.severity-error { background: #fee; border-left-color: #e74c3c; }
          .issue.severity-warning { background: #fff9e6; border-left-color: #f39c12; }
          .issue.severity-info { background: #e8f4f8; border-left-color: #3498db; }
          .issue-header {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 8px;
            flex-wrap: wrap;
          }
          .issue-type {
            font-weight: bold;
            color: #2c3e50;
          }
          .issue-severity {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .issue.severity-error .issue-severity { background: #e74c3c; color: white; }
          .issue.severity-warning .issue-severity { background: #f39c12; color: white; }
          .issue.severity-info .issue-severity { background: #3498db; color: white; }
          .badge {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
          }
          .badge-fix {
            background: #27ae60;
            color: white;
          }
          .issue-location {
            color: #666;
            font-size: 12px;
          }
          .issue-message {
            margin-bottom: 8px;
            color: #333;
          }
          .issue-fix {
            margin-bottom: 8px;
            padding: 8px;
            background: #e8f5e9;
            border-radius: 4px;
            font-size: 14px;
          }
          .issue-code {
            background: #f8f8f8;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            border: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 Accessibility Scan Report</h1>
          
          <div class="summary">
            <div class="summary-card total">
              <h3>Files Scanned</h3>
              <div class="number">${this.results.length}</div>
            </div>
            <div class="summary-card errors">
              <h3>Errors</h3>
              <div class="number">${totalErrors}</div>
            </div>
            <div class="summary-card warnings">
              <h3>Warnings</h3>
              <div class="number">${totalWarnings}</div>
            </div>
            <div class="summary-card info">
              <h3>Info</h3>
              <div class="number">${totalInfo}</div>
            </div>
            <div class="summary-card fixed">
              <h3>Auto-fixed</h3>
              <div class="number">${totalFixed}</div>
            </div>
          </div>

          ${issuesHtml}
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private getIcon(severity: string): string {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }

  private getColor(severity: string): (text: string) => string {
    switch (severity) {
      case 'error':
        return chalk.red;
      case 'warning':
        return chalk.yellow;
      case 'info':
        return chalk.blue;
      default:
        return chalk.gray;
    }
  }
}

