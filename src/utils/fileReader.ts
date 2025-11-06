import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export async function readFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  return fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function findFiles(
  patterns: string[],
  ignore: string[] = []
): Promise<string[]> {
  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', ...ignore],
      absolute: true,
    });
    allFiles.push(...files);
  }
  
  return [...new Set(allFiles)];
}

export function isHTMLFile(filePath: string): boolean {
  return /\.(html|htm)$/i.test(filePath);
}

export function isJSXFile(filePath: string): boolean {
  return /\.(jsx|tsx|js|ts)$/i.test(filePath);
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

