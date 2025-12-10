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

/**
 * Parse TipTap JSON content to plain text
 */
function parseTipTapContent(jsonString: string): string {
  try {
    const doc = JSON.parse(jsonString);
    const lines: string[] = [];

    if (doc.content && Array.isArray(doc.content)) {
      for (const node of doc.content) {
        if (node.type === 'paragraph') {
          if (node.content && Array.isArray(node.content)) {
            const textParts: string[] = [];
            for (const textNode of node.content) {
              if (textNode.type === 'text' && textNode.text) {
                textParts.push(textNode.text);
              }
            }
            lines.push(textParts.join(''));
          } else {
            lines.push(''); // Empty paragraph
          }
        } else if (node.type === 'heading' && node.content) {
          const headingText = node.content
            .filter((n: any) => n.type === 'text')
            .map((n: any) => n.text)
            .join('');
          lines.push(headingText);
        } else if (node.type === 'bulletList' && node.content) {
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const para of listItem.content) {
                if (para.content) {
                  const itemText = para.content
                    .filter((n: any) => n.type === 'text')
                    .map((n: any) => n.text)
                    .join('');
                  lines.push(`• ${itemText}`);
                }
              }
            }
          }
        } else if (node.type === 'orderedList' && node.content) {
          let index = 1;
          for (const listItem of node.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const para of listItem.content) {
                if (para.content) {
                  const itemText = para.content
                    .filter((n: any) => n.type === 'text')
                    .map((n: any) => n.text)
                    .join('');
                  lines.push(`${index}. ${itemText}`);
                }
              }
              index++;
            }
          }
        }
      }
    }

    return lines.join('\n');
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
    lines.push('📝 SUMMARY');
    lines.push('');
    lines.push(note.summaryText);
    lines.push('');
    lines.push('━'.repeat(50));
    lines.push('');
  }

  // User notes section
  if (note.userNotes) {
    lines.push('✏️ NOTES');
    lines.push('');
    const parsedNotes = parseTipTapContent(note.userNotes);
    lines.push(parsedNotes);
    lines.push('');
    lines.push('━'.repeat(50));
    lines.push('');
  }

  // Transcript section
  if (note.verbatimText) {
    lines.push('🎙️ TRANSCRIPT');
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
