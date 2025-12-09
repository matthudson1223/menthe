import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import type { JSONContent } from '@tiptap/core';

/**
 * Check if a string is valid TipTap JSON format
 */
export function isValidTipTapJSON(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && parsed.type === 'doc';
  } catch {
    return false;
  }
}

/**
 * Convert plain text to TipTap JSON format
 */
export function plainTextToTipTap(text: string): JSONContent {
  if (!text) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  // Split text into paragraphs and create a TipTap document
  const paragraphs = text.split('\n').map(line => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : []
  }));

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph', content: [] }]
  };
}

/**
 * Parse content - handles both TipTap JSON and plain text
 */
export function parseContent(content: string): JSONContent {
  if (!content) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }]
    };
  }

  if (isValidTipTapJSON(content)) {
    try {
      return JSON.parse(content);
    } catch {
      return plainTextToTipTap(content);
    }
  }

  return plainTextToTipTap(content);
}

/**
 * Convert TipTap JSON to HTML for PDF export
 */
export function tiptapToHTML(json: string): string {
  if (!json) return '';

  try {
    const content = parseContent(json);
    return generateHTML(content, [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline
    ]);
  } catch (error) {
    console.error('Error converting TipTap to HTML:', error);
    // Fallback: if it's plain text, wrap in paragraph
    return `<p>${json.replace(/\n/g, '<br>')}</p>`;
  }
}

/**
 * Convert TipTap JSON content to Markdown
 */
export function tiptapToMarkdown(json: string): string {
  if (!json) return '';

  try {
    const content = parseContent(json);
    return jsonToMarkdown(content);
  } catch (error) {
    console.error('Error converting TipTap to Markdown:', error);
    return json; // Fallback to original content
  }
}

/**
 * Recursively convert JSONContent to Markdown
 */
function jsonToMarkdown(node: JSONContent, depth = 0): string {
  if (!node) return '';

  let markdown = '';

  switch (node.type) {
    case 'doc':
      if (node.content) {
        markdown = node.content.map(child => jsonToMarkdown(child, depth)).join('\n\n');
      }
      break;

    case 'paragraph':
      if (node.content && node.content.length > 0) {
        markdown = node.content.map(child => jsonToMarkdown(child, depth)).join('');
      }
      break;

    case 'heading':
      const level = node.attrs?.level || 1;
      const headingPrefix = '#'.repeat(level);
      const headingText = node.content
        ? node.content.map(child => jsonToMarkdown(child, depth)).join('')
        : '';
      markdown = `${headingPrefix} ${headingText}`;
      break;

    case 'bulletList':
      if (node.content) {
        markdown = node.content
          .map(child => jsonToMarkdown(child, depth))
          .join('\n');
      }
      break;

    case 'orderedList':
      if (node.content) {
        markdown = node.content
          .map((child, index) => {
            const listItem = jsonToMarkdown(child, depth);
            // Replace the bullet with number
            return listItem.replace(/^- /, `${index + 1}. `);
          })
          .join('\n');
      }
      break;

    case 'listItem':
      const indent = '  '.repeat(depth);
      if (node.content) {
        const content = node.content
          .map(child => {
            if (child.type === 'paragraph') {
              // For list items, don't add extra newlines between paragraphs
              return child.content
                ? child.content.map(c => jsonToMarkdown(c, depth + 1)).join('')
                : '';
            }
            return jsonToMarkdown(child, depth + 1);
          })
          .join('\n');
        markdown = `${indent}- ${content}`;
      }
      break;

    case 'text':
      let text = node.text || '';

      // Apply marks (formatting)
      if (node.marks && node.marks.length > 0) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`;
              break;
            case 'italic':
              text = `*${text}*`;
              break;
            case 'underline':
              text = `<u>${text}</u>`; // HTML in Markdown
              break;
            case 'strike':
              text = `~~${text}~~`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
          }
        }
      }

      markdown = text;
      break;

    case 'hardBreak':
      markdown = '  \n'; // Two spaces + newline for hard break in Markdown
      break;

    default:
      // For unknown node types, try to process content if it exists
      if (node.content) {
        markdown = node.content.map(child => jsonToMarkdown(child, depth)).join('');
      }
  }

  return markdown;
}

/**
 * Extract plain text from TipTap JSON (for search, etc.)
 */
export function tiptapToPlainText(json: string): string {
  if (!json) return '';

  try {
    const content = parseContent(json);
    return extractText(content);
  } catch (error) {
    console.error('Error extracting plain text:', error);
    return json; // Fallback to original content
  }
}

/**
 * Recursively extract text from JSONContent
 */
function extractText(node: JSONContent): string {
  if (!node) return '';

  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content) {
    return node.content.map(extractText).join(' ');
  }

  return '';
}
