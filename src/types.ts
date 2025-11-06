export interface AccessibilityIssue {
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  code: string;
  fix?: Fix;
}

export type IssueType =
  | 'missing-alt-text'
  | 'missing-aria-label'
  | 'missing-form-label'
  | 'invalid-aria-attribute'
  | 'missing-heading-hierarchy'
  | 'missing-focus-indicator'
  | 'missing-landmark'
  | 'color-contrast'
  | 'missing-button-type'
  | 'duplicate-id'
  | 'missing-lang-attribute'
  | 'missing-skip-link'
  | 'invalid-role'
  | 'missing-keyboard-handler';

export interface Fix {
  type: 'replace' | 'insert' | 'remove' | 'add-attribute';
  description: string;
  code: string;
  position: {
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
  };
}

export interface ScanResult {
  file: string;
  issues: AccessibilityIssue[];
  fixed: number;
  total: number;
}

export interface Config {
  fix?: boolean;
  report?: boolean;
  reportPath?: string;
  ignore?: string[];
  rules?: {
    [key in IssueType]?: {
      enabled: boolean;
      severity?: 'error' | 'warning' | 'info';
    };
  };
}

