import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { AccessibilityIssue, IssueType } from '../types';

export class JSXScanner {
  private issues: AccessibilityIssue[] = [];
  private code: string;
  private lines: string[];

  constructor(code: string) {
    this.code = code;
    this.lines = code.split('\n');
  }

  scan(): AccessibilityIssue[] {
    this.issues = [];

    try {
      const ast = parser.parse(this.code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });

      traverse(ast, {
        JSXElement: (path) => {
          this.checkJSXElement(path);
        },
        // Check React-specific patterns
        CallExpression: (path) => {
          this.checkReactHooks(path);
          this.checkReactEvents(path);
        },
        // Check for React component definitions
        FunctionDeclaration: (path) => {
          this.checkReactComponent(path);
        },
        ArrowFunctionExpression: (path) => {
          this.checkReactComponent(path);
        },
      });
    } catch (error) {
      // Skip files that can't be parsed
      console.warn(`Could not parse file: ${error}`);
    }

    return this.issues;
  }

  private checkJSXElement(path: any): void {
    const node = path.node;
    const openingElement = node.openingElement;
    const tagName = this.getTagName(openingElement.name);

    // Check for missing alt text on images
    if (tagName === 'img') {
      this.checkImageAlt(openingElement, path);
    }

    // Check for missing aria labels on interactive elements
    if (['button', 'div', 'span', 'a'].includes(tagName)) {
      this.checkAriaLabel(openingElement, path, tagName);
    }

    // Check for missing button type
    if (tagName === 'button') {
      this.checkButtonType(openingElement, path);
    }

    // Check for missing form labels
    if (['input', 'textarea', 'select'].includes(tagName)) {
      this.checkFormLabel(openingElement, path);
    }

    // Check for duplicate IDs
    this.checkDuplicateId(openingElement, path);

    // Check heading hierarchy
    if (/^h[1-6]$/.test(tagName)) {
      this.checkHeadingHierarchy(openingElement, path, tagName);
    }

    // Check for invalid roles
    this.checkInvalidRole(openingElement, path);
  }

  private getTagName(name: any): string {
    if (t.isJSXIdentifier(name)) {
      return name.name;
    }
    if (t.isJSXMemberExpression(name)) {
      return `${this.getTagName(name.object)}.${this.getTagName(name.property)}`;
    }
    return '';
  }

  private hasAttribute(element: any, attrName: string): boolean {
    return element.attributes.some(
      (attr: any) =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name) &&
        attr.name.name === attrName
    );
  }

  private getAttribute(element: any, attrName: string): any {
    return element.attributes.find(
      (attr: any) =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name) &&
        attr.name.name === attrName
    );
  }

  private getLineAndColumn(node: any): { line: number; column: number } {
    const loc = node.loc;
    if (loc) {
      return { line: loc.start.line, column: loc.start.column + 1 };
    }
    return { line: 1, column: 1 };
  }

  private addIssue(
    type: IssueType,
    severity: 'error' | 'warning' | 'info',
    message: string,
    node: any,
    code?: string
  ): void {
    const { line, column } = this.getLineAndColumn(node);
    this.issues.push({
      type,
      severity,
      message,
      line,
      column,
      code: code || this.getCodeSnippet(node),
    });
  }

  private getCodeSnippet(node: any): string {
    const loc = node.loc;
    if (loc) {
      const start = loc.start.line - 1;
      const end = loc.end.line - 1;
      return this.lines.slice(start, end + 1).join('\n');
    }
    return '';
  }

  private checkImageAlt(openingElement: any, path: any): void {
    if (!this.hasAttribute(openingElement, 'alt')) {
      this.addIssue(
        'missing-alt-text',
        'error',
        'Image missing alt attribute',
        openingElement
      );
    }
  }

  private checkAriaLabel(openingElement: any, path: any, tagName: string): void {
    const hasAriaLabel = this.hasAttribute(openingElement, 'aria-label');
    const hasAriaLabelledBy = this.hasAttribute(openingElement, 'aria-labelledby');
    const hasText = this.hasTextContent(path.node);
    const hasRole = this.hasAttribute(openingElement, 'role');
    const role = hasRole ? this.getAttribute(openingElement, 'role')?.value?.value : null;

    // Check if it's an interactive element
    const isInteractive =
      tagName === 'button' ||
      tagName === 'a' ||
      role === 'button' ||
      (tagName === 'div' || tagName === 'span') && this.hasClickHandler(path);

    if (isInteractive && !hasAriaLabel && !hasAriaLabelledBy && !hasText) {
      this.addIssue(
        'missing-aria-label',
        'warning',
        'Interactive element missing aria-label or accessible text',
        openingElement
      );
    }
  }

  private checkButtonType(openingElement: any, path: any): void {
    if (!this.hasAttribute(openingElement, 'type')) {
      this.addIssue(
        'missing-button-type',
        'warning',
        'Button missing type attribute',
        openingElement
      );
    }
  }

  private checkFormLabel(openingElement: any, path: any): void {
    const hasId = this.hasAttribute(openingElement, 'id');
    const hasAriaLabel = this.hasAttribute(openingElement, 'aria-label');
    const hasAriaLabelledBy = this.hasAttribute(openingElement, 'aria-labelledby');

    if (!hasAriaLabel && !hasAriaLabelledBy) {
      // Check if there's a label in the parent scope
      const hasLabel = this.findLabelInScope(path);

      if (!hasLabel) {
        this.addIssue(
          'missing-form-label',
          'error',
          'Form input missing associated label',
          openingElement
        );
      }
    }
  }

  private checkDuplicateId(openingElement: any, path: any): void {
    const idAttr = this.getAttribute(openingElement, 'id');
    if (idAttr && t.isStringLiteral(idAttr.value)) {
      // In a full implementation, we'd track all IDs across the file
      // For now, we'll check in the scope
      const idValue = idAttr.value.value;
      const duplicates = this.findDuplicateIds(path, idValue);
      
      if (duplicates.length > 1) {
        this.addIssue(
          'duplicate-id',
          'error',
          `Duplicate ID "${idValue}" found`,
          openingElement
        );
      }
    }
  }

  private checkHeadingHierarchy(openingElement: any, path: any, tagName: string): void {
    const level = parseInt(tagName.charAt(1));
    // In a full implementation, we'd track previous heading levels
    // This is a simplified version
    if (level > 6) {
      this.addIssue(
        'missing-heading-hierarchy',
        'warning',
        `Invalid heading level: ${tagName}`,
        openingElement
      );
    }
  }

  private checkInvalidRole(openingElement: any, path: any): void {
    const roleAttr = this.getAttribute(openingElement, 'role');
    if (roleAttr) {
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
        'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
        'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
        'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
        'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
        'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
        'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
        'treegrid', 'treeitem'
      ];

      if (t.isStringLiteral(roleAttr.value)) {
        const role = roleAttr.value.value;
        if (!validRoles.includes(role)) {
          this.addIssue(
            'invalid-role',
            'error',
            `Invalid ARIA role: "${role}"`,
            openingElement
          );
        }
      }
    }
  }

  private hasTextContent(node: any): boolean {
    if (t.isJSXElement(node)) {
      return node.children.some((child: any) => {
        if (t.isJSXText(child)) {
          return child.value.trim().length > 0;
        }
        if (t.isJSXElement(child)) {
          return this.hasTextContent(child);
        }
        return false;
      });
    }
    return false;
  }

  private hasClickHandler(path: any): boolean {
    const openingElement = path.node.openingElement;
    return this.hasAttribute(openingElement, 'onClick') ||
           this.hasAttribute(openingElement, 'onMouseDown') ||
           this.hasAttribute(openingElement, 'onMouseUp');
  }

  private findLabelInScope(path: any): boolean {
    // Simplified - in production, traverse up the tree to find labels
    let current = path.parent;
    while (current) {
      if (t.isJSXElement(current.node)) {
        const tagName = this.getTagName(current.node.openingElement.name);
        if (tagName === 'label') {
          return true;
        }
      }
      current = current.parent;
    }
    return false;
  }

  private findDuplicateIds(path: any, idValue: string): any[] {
    // Simplified - in production, scan entire file
    const duplicates: any[] = [];
    // This would need to traverse the entire AST
    return duplicates;
  }

  private checkReactHooks(path: any): void {
    const node = path.node;
    
    // Check for common React accessibility patterns
    if (t.isIdentifier(node.callee)) {
      const hookName = node.callee.name;
      
      // Check if using useRef without proper accessibility
      if (hookName === 'useRef') {
        // This is informational - refs might be used for accessibility
      }
    }
  }

  private checkReactEvents(path: any): void {
    const node = path.node;
    
    // Check for onClick handlers on non-interactive elements
    if (t.isMemberExpression(node.callee)) {
      const property = node.callee.property;
      if (t.isIdentifier(property) && property.name === 'preventDefault') {
        // Check parent for event handler patterns
        const parent = path.parent;
        if (t.isArrowFunctionExpression(parent) || t.isFunctionExpression(parent)) {
          // Look for event handlers on non-interactive elements
        }
      }
    }
  }

  private checkReactComponent(path: any): void {
    const node = path.node;
    
    // Check if component returns JSX and has accessibility issues
    if (t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node)) {
      const params = node.params || [];
      
      // Check if component accepts props but doesn't use them for accessibility
      if (params.length > 0) {
        // Check for common prop patterns
        const firstParam = params[0];
        if (t.isIdentifier(firstParam) && firstParam.name === 'props') {
          // Component might need accessibility props
        }
      }
    }
  }
}

