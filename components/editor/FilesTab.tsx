import React from 'react';
import { Paperclip, FileAudio } from 'lucide-react';
import type { Note } from '../../types';

interface FilesTabProps {
  note: Note;
  isFullWidth: boolean;
}

export const FilesTab = React.memo<FilesTabProps>(({ note, isFullWidth }) => {
  return (
    <div
      className={`mx-auto transition-all duration-300 ${
        isFullWidth ? 'w-full md:px-4' : 'max-w-2xl'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[50vh] transition-colors">
        {note.originalMediaUrl ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Paperclip size={14} /> Attached Media
            </h3>
            {note.type === 'image' && (
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                <img
                  src={note.originalMediaUrl}
                  alt="Attached File"
                  className="w-full rounded-lg shadow-sm"
                />
              </div>
            )}
            {note.type === 'audio' && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  <FileAudio size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    Voice Recording
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Attached • Playback Disabled
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
            <Paperclip size={48} className="mb-4 opacity-50" />
            <p>No files attached to this note.</p>
            <p className="text-sm mt-2">
              Use the toolbar to attach images or record audio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

FilesTab.displayName = 'FilesTab';
