import { JSDOM } from 'jsdom';
import { AccessibilityIssue, IssueType } from '../types';

export class HTMLScanner {
  private dom: JSDOM;
  private issues: AccessibilityIssue[] = [];
  private lines: string[] = [];

  constructor(html: string) {
    this.dom = new JSDOM(html);
    this.lines = html.split('\n');
  }

  scan(): AccessibilityIssue[] {
    this.issues = [];
    const document = this.dom.window.document;

    this.checkMissingAltText(document);
    this.checkMissingAriaLabels(document);
    this.checkMissingFormLabels(document);
    this.checkMissingButtonType(document);
    this.checkDuplicateIds(document);
    this.checkMissingLang(document);
    this.checkHeadingHierarchy(document);
    this.checkMissingLandmarks(document);
    this.checkInvalidRoles(document);

    return this.issues;
  }

  private getLineAndColumn(node: Node): { line: number; column: number } {
    // Simple approximation - in production, you'd use a proper HTML parser
    const text = node.textContent || '';
    const index = this.dom.serialize().indexOf(node.textContent || '');
    const beforeText = this.dom.serialize().substring(0, index);
    const line = beforeText.split('\n').length;
    const column = beforeText.split('\n').pop()?.length || 0;
    
    return { line, column: column + 1 };
  }

  private addIssue(
    type: IssueType,
    severity: 'error' | 'warning' | 'info',
    message: string,
    node: Node,
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

  private getCodeSnippet(node: Node): string {
    if (node.nodeType === 1) {
      const element = node as Element;
      return `<${element.tagName.toLowerCase()}${this.getAttributesString(element)}>`;
    }
    return node.textContent?.substring(0, 50) || '';
  }

  private getAttributesString(element: Element): string {
    let attrs = '';
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs += ` ${attr.name}="${attr.value}"`;
    }
    return attrs;
  }

  private checkMissingAltText(document: Document): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        this.addIssue(
          'missing-alt-text',
          'error',
          'Image missing alt attribute',
          img,
          `<img src="${img.getAttribute('src')}">`
        );
      } else if (img.getAttribute('alt') === '') {
        // Decorative image - this is acceptable
      }
    });
  }

  private checkMissingAriaLabels(document: Document): void {
    const interactiveElements = document.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), [role="button"]:not([aria-label]):not([aria-labelledby])'
    );
    
    interactiveElements.forEach((el) => {
      const text = el.textContent?.trim() || '';
      if (!text && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        this.addIssue(
          'missing-aria-label',
          'warning',
          'Interactive element missing aria-label or accessible text',
          el
        );
      }
    });
  }

  private checkMissingFormLabels(document: Document): void {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && input.getAttribute('type') !== 'hidden') {
        this.addIssue(
          'missing-form-label',
          'error',
          'Form input missing associated label',
          input
        );
      }
    });
  }

  private checkMissingButtonType(document: Document): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
      if (!button.hasAttribute('type')) {
        this.addIssue(
          'missing-button-type',
          'warning',
          'Button missing type attribute (should be "button", "submit", or "reset")',
          button
        );
      }
    });
  }

  private checkDuplicateIds(document: Document): void {
    const idMap = new Map<string, Element[]>();
    const elementsWithIds = document.querySelectorAll('[id]');
    
    elementsWithIds.forEach((el) => {
      const id = el.getAttribute('id');
      if (id) {
        if (!idMap.has(id)) {
          idMap.set(id, []);
        }
        idMap.get(id)!.push(el);
      }
    });

    idMap.forEach((elements, id) => {
      if (elements.length > 1) {
        elements.forEach((el) => {
          this.addIssue(
            'duplicate-id',
            'error',
            `Duplicate ID "${id}" found`,
            el
          );
        });
      }
    });
  }

  private checkMissingLang(document: Document): void {
    const html = document.documentElement;
    if (!html.hasAttribute('lang')) {
      this.addIssue(
        'missing-lang-attribute',
        'error',
        'HTML element missing lang attribute',
        html
      );
    }
  }

  private checkHeadingHierarchy(document: Document): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1 && previousLevel > 0) {
        this.addIssue(
          'missing-heading-hierarchy',
          'warning',
          `Heading level ${level} follows level ${previousLevel} (should be ${previousLevel + 1})`,
          heading
        );
      }
      previousLevel = level;
    });
  }

  private checkMissingLandmarks(document: Document): void {
    const hasMain = document.querySelector('main, [role="main"]');
    const hasNav = document.querySelector('nav, [role="navigation"]');
    const hasHeader = document.querySelector('header, [role="banner"]');
    
    if (!hasMain) {
      this.addIssue(
        'missing-landmark',
        'info',
        'Document missing main landmark',
        document.body
      );
    }
    
    if (!hasNav && document.querySelectorAll('a').length > 3) {
      this.addIssue(
        'missing-landmark',
        'info',
        'Document with multiple links should have navigation landmark',
        document.body
      );
    }
  }

  private checkInvalidRoles(document: Document): void {
    const elementsWithRole = document.querySelectorAll('[role]');
    
    elementsWithRole.forEach((el) => {
      const role = el.getAttribute('role');
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
      
      if (role && !validRoles.includes(role)) {
        this.addIssue(
          'invalid-role',
          'error',
          `Invalid ARIA role: "${role}"`,
          el
        );
      }
    });
  }

  getDOM(): JSDOM {
    return this.dom;
  }
}

