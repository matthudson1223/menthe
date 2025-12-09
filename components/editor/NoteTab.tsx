import React, { useState } from 'react';
import type { Note } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { RichTextToolbar } from './RichTextToolbar';
import type { Editor } from '@tiptap/react';

interface NoteTabProps {
  note: Note;
  isFullWidth: boolean;
  onUpdate: (updates: Partial<Note>) => void;
}

export const NoteTab = React.memo<NoteTabProps>(({ note, isFullWidth, onUpdate }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <div
      className={`mx-auto transition-all duration-300 ${
        isFullWidth ? 'w-full md:px-4' : 'max-w-2xl'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[50vh] transition-colors">
        <RichTextToolbar editor={editor} />
        <RichTextEditor
          content={note.userNotes || ''}
          onChange={(json) => onUpdate({ userNotes: json })}
          placeholder="Type your personal notes and observations here..."
          onEditorReady={setEditor}
        />
      </div>
    </div>
  );
});

NoteTab.displayName = 'NoteTab';
