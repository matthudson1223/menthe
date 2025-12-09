import type { Note } from '../types';

/**
 * Save or update a note to Google Drive as a text file
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
    const fileName = `${note.title}.txt`;

    // Check if we're updating an existing file or creating a new one
    if (note.driveFileId) {
      // Update existing file
      await updateDriveFile(note.driveFileId, content, accessToken);
      return note.driveFileId;
    } else {
      // Create new file
      const fileId = await createDriveFile(fileName, content, accessToken);
      return fileId;
    }
  } catch (error) {
    console.error('Drive save error:', error);
    throw new Error('Failed to save to Google Drive. Please try again.');
  }
};

/**
 * Format the note content for saving to Drive
 */
function formatNoteContent(note: Note): string {
  const lines: string[] = [];

  lines.push(note.title);
  lines.push('='.repeat(note.title.length));
  lines.push('');
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`);
  lines.push('');

  if (note.summaryText) {
    lines.push('SUMMARY');
    lines.push('-------');
    lines.push(note.summaryText);
    lines.push('');
  }

  if (note.userNotes) {
    lines.push('USER NOTES');
    lines.push('----------');
    // Strip HTML tags from rich text editor content
    const plainNotes = note.userNotes.replace(/<[^>]*>/g, '').trim();
    lines.push(plainNotes);
    lines.push('');
  }

  if (note.verbatimText) {
    lines.push('TRANSCRIPT');
    lines.push('----------');
    lines.push(note.verbatimText);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Create a new file in Google Drive
 */
async function createDriveFile(
  fileName: string,
  content: string,
  accessToken: string
): Promise<string> {
  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
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
 * Update an existing file in Google Drive
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
 * Get the URL to view a file in Google Drive
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
