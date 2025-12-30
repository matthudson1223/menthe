import type { Note } from '../types';

/**
 * Save or update a note to Google Drive as a Google Doc
 * @param note - The note to save
 * @param accessToken - Google OAuth access token
 * @returns The Drive file ID
 */
export const saveNoteToDrive = async (
  note: Note,
  accessToken: string
): Promise<string> => {
  try {
    // Prepare the file content
    const content = formatNoteContent(note);
    const fileName = note.title;

    // Check if we're updating an existing file or creating a new one
    if (note.driveFileId) {
      // Update existing file
      await updateDriveFile(note.driveFileId, content, accessToken);
      return note.driveFileId;
    } else {
      // Get or create the "Menthe Exports" folder
      const folderId = await getOrCreateFolder(accessToken);

      // Create new file in the folder
      const fileId = await createDriveFile(fileName, content, accessToken, folderId);
      return fileId;
    }
  } catch (error) {
    console.error('Drive save error:', error);
    throw new Error('Failed to save to Google Drive. Please try again.');
  }
};

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
}

/**
 * Recursively extract plain text from a TipTap JSON node
 */
function extractTextFromNode(node: TipTapNode, listContext?: { type: 'bullet' | 'ordered'; index: number }): string {
  if (!node || typeof node !== 'object') {
    return '';
  }

  // Text nodes contain the actual text
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  // Handle nodes with content arrays
  if (!Array.isArray(node.content)) {
    // Handle hardBreak as newline
    if (node.type === 'hardBreak') {
      return '\n';
    }
    return '';
  }

  const childTexts: string[] = [];
  let orderedIndex = 1;

  for (const child of node.content) {
    let childText = '';

    if (node.type === 'bulletList') {
      childText = extractTextFromNode(child, { type: 'bullet', index: 0 });
    } else if (node.type === 'orderedList') {
      childText = extractTextFromNode(child, { type: 'ordered', index: orderedIndex++ });
    } else {
      childText = extractTextFromNode(child, listContext);
    }

    if (childText) {
      childTexts.push(childText);
    }
  }

  const joinedText = childTexts.join('');

  // Apply formatting based on node type
  switch (node.type) {
    case 'doc':
      return childTexts.join('\n');
    case 'paragraph':
      return joinedText;
    case 'heading':
      return joinedText;
    case 'listItem':
      if (listContext?.type === 'bullet') {
        return `• ${joinedText}`;
      } else if (listContext?.type === 'ordered') {
        return `${listContext.index}. ${joinedText}`;
      }
      return joinedText;
    case 'bulletList':
    case 'orderedList':
      return childTexts.join('\n');
    case 'blockquote':
      return childTexts.map(line => `> ${line}`).join('\n');
    case 'codeBlock':
      return `\`\`\`\n${joinedText}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    default:
      return joinedText;
  }
}

/**
 * Parse TipTap JSON content to plain text
 */
function parseTipTapContent(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') {
    return '';
  }

  // Check if it looks like JSON
  const trimmed = jsonString.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    // Not JSON, return as-is after stripping any HTML tags
    return jsonString.replace(/<[^>]*>/g, '').trim();
  }

  try {
    const doc = JSON.parse(jsonString) as TipTapNode;
    return extractTextFromNode(doc);
  } catch (e) {
    // If parsing fails, try to strip HTML tags as fallback
    return jsonString.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Format the note content for saving to Drive
 */
function formatNoteContent(note: Note): string {
  const lines: string[] = [];

  // Title
  lines.push(note.title.toUpperCase());
  lines.push('');

  // Metadata
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
  lines.push('');
  lines.push('━'.repeat(50));
  lines.push('');

  // Summary section
  if (note.summaryText) {
    lines.push('SUMMARY');
    lines.push('-'.repeat(50));
    lines.push('');
    lines.push(note.summaryText);
    lines.push('');
    lines.push('');
  }

  // User notes section
  if (note.userNotes) {
    lines.push('NOTES');
    lines.push('-'.repeat(50));
    lines.push('');
    const parsedNotes = parseTipTapContent(note.userNotes);
    lines.push(parsedNotes);
    lines.push('');
    lines.push('');
  }

  // Transcript section
  if (note.verbatimText) {
    lines.push('TRANSCRIPT');
    lines.push('-'.repeat(50));
    lines.push('');
    lines.push(note.verbatimText);
  }

  return lines.join('\n');
}

/**
 * Get or create the "Menthe Exports" folder in Google Drive
 */
async function getOrCreateFolder(accessToken: string): Promise<string> {
  const folderName = 'Menthe Exports';

  // Search for existing folder
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search for folder');
  }

  const searchData = await searchResponse.json();

  // If folder exists, return its ID
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new folder
  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );

  if (!createResponse.ok) {
    throw new Error('Failed to create folder');
  }

  const createData = await createResponse.json();
  return createData.id;
}

/**
 * Create a new Google Doc file in Google Drive
 */
async function createDriveFile(
  fileName: string,
  content: string,
  accessToken: string,
  folderId: string
): Promise<string> {
  const metadata = {
    name: fileName,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: 'text/plain' }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create file');
  }

  const data = await response.json();
  return data.id;
}

/**
 * Update an existing Google Doc file in Google Drive
 */
async function updateDriveFile(
  fileId: string,
  content: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: content,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update file');
  }
}

/**
 * Get the URL to view a Google Doc in Google Drive
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://docs.google.com/document/d/${fileId}/edit`;
}
