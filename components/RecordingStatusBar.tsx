import React from 'react';
import { useNotesContext } from '../context/NotesContext';

interface RecordingStatusBarProps {
  onStopRecording: () => void;
}

export const RecordingStatusBar = React.memo<RecordingStatusBarProps>(({
  onStopRecording,
}) => {
  const { recording } = useNotesContext();

  if (!recording.isRecording) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 dark:bg-black text-white p-3 z-50 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-5 border-t border-slate-800">
      <div className="flex items-center gap-3 px-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Recording in progress</span>
          <span className="text-xs text-slate-400">
            Processing will begin when you stop...
          </span>
        </div>
      </div>
      <button
        onClick={onStopRecording}
        className="px-4 py-2 bg-white text-slate-900 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
      >
        Stop & Save
      </button>
    </div>
  );
});

RecordingStatusBar.displayName = 'RecordingStatusBar';
