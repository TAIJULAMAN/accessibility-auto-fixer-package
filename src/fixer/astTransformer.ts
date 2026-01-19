import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as generate from '@babel/generator';
import * as t from '@babel/types';
import { AccessibilityIssue, Fix } from '../types';

export class ASTTransformer {
    /**
     * Transform JSX/TSX code by applying accessibility fixes using AST manipulation
     */
    async transformJSX(code: string, issues: AccessibilityIssue[]): Promise<string> {
        try {
            // Parse the code into an AST
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
            });

            // Group issues by line for efficient processing
            const issuesByLine = new Map<number, AccessibilityIssue[]>();
            issues.forEach((issue) => {
                if (!issuesByLine.has(issue.line)) {
                    issuesByLine.set(issue.line, []);
                }
                issuesByLine.get(issue.line)!.push(issue);
            });

            // Traverse and modify the AST
            traverse(ast, {
                JSXOpeningElement: (path) => {
                    const loc = path.node.loc;
                    if (!loc) return;

                    const lineIssues = issuesByLine.get(loc.start.line);
                    if (!lineIssues) return;

                    lineIssues.forEach((issue) => {
                        this.applyFixToJSXElement(path, issue);
                    });
                },
            });

            // Generate code from the modified AST
            const output = (generate as any).default(ast, {
                retainLines: true,
                compact: false,
            });

            return output.code;
        } catch (error) {
            console.error('AST transformation error:', error);
            return code; // Return original code if transformation fails
        }
    }

    /**
     * Apply a fix to a JSX element based on the issue type
     */
    private applyFixToJSXElement(path: any, issue: AccessibilityIssue): void {
        const openingElement = path.node;
        const tagName = this.getJSXTagName(openingElement);

        switch (issue.type) {
            case 'missing-alt-text':
                this.addAltAttribute(openingElement);
                break;

            case 'missing-button-type':
                this.addButtonType(openingElement);
                break;

            case 'missing-aria-label':
                this.addAriaLabel(openingElement, path, tagName);
                break;

            case 'missing-form-label':
                this.addFormLabel(openingElement, path);
                break;

            default:
                break;
        }
    }

    /**
     * Get the tag name from a JSX opening element
     */
    private getJSXTagName(openingElement: any): string {
        const name = openingElement.name;
        if (t.isJSXIdentifier(name)) {
            return name.name;
        } else if (t.isJSXMemberExpression(name)) {
            // Handle JSXMemberExpression (e.g., React.Fragment)
            if (t.isJSXIdentifier(name.object) && t.isJSXIdentifier(name.property)) {
                return `${name.object.name}.${name.property.name}`;
            }
        }
        return '';
    }

    /**
     * Add alt attribute to an image element
     */
    private addAltAttribute(openingElement: any): void {
        // Check if alt attribute already exists
        const hasAlt = openingElement.attributes.some(
            (attr: any) => t.isJSXAttribute(attr) && attr.name.name === 'alt'
        );

        if (!hasAlt) {
            const altAttr = t.jsxAttribute(
                t.jsxIdentifier('alt'),
                t.stringLiteral('')
            );
            openingElement.attributes.push(altAttr);
        }
    }

    /**
     * Add type="button" to a button element
     */
    private addButtonType(openingElement: any): void {
        // Check if type attribute already exists
        const hasType = openingElement.attributes.some(
            (attr: any) => t.isJSXAttribute(attr) && attr.name.name === 'type'
        );

        if (!hasType) {
            const typeAttr = t.jsxAttribute(
                t.jsxIdentifier('type'),
                t.stringLiteral('button')
            );
            openingElement.attributes.push(typeAttr);
        }
    }

    /**
     * Add aria-label to an element
     */
    private addAriaLabel(openingElement: any, path: any, tagName: string): void {
        // Check if aria-label or aria-labelledby already exists
        const hasAriaLabel = openingElement.attributes.some(
            (attr: any) =>
                t.isJSXAttribute(attr) &&
                (attr.name.name === 'aria-label' || attr.name.name === 'aria-labelledby')
        );

        if (!hasAriaLabel) {
            // Try to extract text content from children
            const textContent = this.extractTextContent(path);
            const label = textContent || this.generateDefaultLabel(tagName);

            const ariaLabelAttr = t.jsxAttribute(
                t.jsxIdentifier('aria-label'),
                t.stringLiteral(label)
            );
            openingElement.attributes.push(ariaLabelAttr);
        }
    }

    /**
     * Add aria-label to form input (simplified approach)
     */
    private addFormLabel(openingElement: any, path: any): void {
        // Check if already has label-related attributes
        const hasLabel = openingElement.attributes.some(
            (attr: any) =>
                t.isJSXAttribute(attr) &&
                (attr.name.name === 'aria-label' ||
                    attr.name.name === 'aria-labelledby' ||
                    attr.name.name === 'id')
        );

        if (!hasLabel) {
            // Add aria-label as a simple fix
            const ariaLabelAttr = t.jsxAttribute(
                t.jsxIdentifier('aria-label'),
                t.stringLiteral('Input field')
            );
            openingElement.attributes.push(ariaLabelAttr);
        }
    }

    /**
     * Extract text content from JSX children
     */
    private extractTextContent(path: any): string {
        let text = '';

        if (path.parent && t.isJSXElement(path.parent)) {
            const children = path.parent.children;
            children.forEach((child: any) => {
                if (t.isJSXText(child)) {
                    text += child.value.trim();
                }
            });
        }

        return text;
    }

    /**
     * Generate a default label based on element type
     */
    private generateDefaultLabel(tagName: string): string {
        const labels: Record<string, string> = {
            button: 'Button',
            a: 'Link',
            input: 'Input field',
            select: 'Select option',
            textarea: 'Text area',
            div: 'Interactive element',
        };

        return labels[tagName] || 'Interactive element';
    }

    /**
     * Add missing attributes to HTML lang element
     */
    addLangAttribute(html: string): string {
        // Simple regex-based fix for HTML lang attribute
        if (!html.includes('lang=')) {
            html = html.replace(/<html([^>]*)>/i, '<html$1 lang="en">');
        }
        return html;
    }
}
