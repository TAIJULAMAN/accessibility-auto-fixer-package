import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AccessibilityIssue, ScanResult } from '../types';

interface CacheEntry {
    hash: string;
    timestamp: number;
    result: ScanResult;
}

export class FileCache {
    private cacheDir: string;
    private cache: Map<string, CacheEntry> = new Map();
    private enabled: boolean;

    constructor(cacheDir: string = '.a11y-cache', enabled: boolean = true) {
        this.cacheDir = cacheDir;
        this.enabled = enabled;

        if (this.enabled) {
            this.ensureCacheDir();
            this.loadCache();
        }
    }

    /**
     * Get cached result for a file if it hasn't changed
     */
    get(filePath: string, content: string): ScanResult | null {
        if (!this.enabled) return null;

        const hash = this.hashContent(content);
        const cached = this.cache.get(filePath);

        if (cached && cached.hash === hash) {
            return cached.result;
        }

        return null;
    }

    /**
     * Store scan result in cache
     */
    set(filePath: string, content: string, result: ScanResult): void {
        if (!this.enabled) return;

        const hash = this.hashContent(content);
        const entry: CacheEntry = {
            hash,
            timestamp: Date.now(),
            result,
        };

        this.cache.set(filePath, entry);
        this.persistCache();
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.persistCache();
    }

    /**
     * Get cache statistics
     */
    getStats(): { totalEntries: number; cacheDir: string } {
        return {
            totalEntries: this.cache.size,
            cacheDir: this.cacheDir,
        };
    }

    /**
     * Hash file content for cache key
     */
    private hashContent(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * Ensure cache directory exists
     */
    private ensureCacheDir(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Load cache from disk
     */
    private loadCache(): void {
        const cacheFile = path.join(this.cacheDir, 'cache.json');

        if (fs.existsSync(cacheFile)) {
            try {
                const data = fs.readFileSync(cacheFile, 'utf-8');
                const entries = JSON.parse(data);

                Object.entries(entries).forEach(([filePath, entry]) => {
                    this.cache.set(filePath, entry as CacheEntry);
                });
            } catch (error) {
                console.warn('Failed to load cache:', error);
            }
        }
    }

    /**
     * Persist cache to disk
     */
    private persistCache(): void {
        const cacheFile = path.join(this.cacheDir, 'cache.json');

        try {
            const entries: Record<string, CacheEntry> = {};
            this.cache.forEach((entry, filePath) => {
                entries[filePath] = entry;
            });

            fs.writeFileSync(cacheFile, JSON.stringify(entries, null, 2));
        } catch (error) {
            console.warn('Failed to persist cache:', error);
        }
    }

    /**
     * Remove old cache entries (older than 7 days)
     */
    cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
        const now = Date.now();
        const toRemove: string[] = [];

        this.cache.forEach((entry, filePath) => {
            if (now - entry.timestamp > maxAge) {
                toRemove.push(filePath);
            }
        });

        toRemove.forEach((filePath) => this.cache.delete(filePath));

        if (toRemove.length > 0) {
            this.persistCache();
        }
    }
}
