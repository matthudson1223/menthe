import React, { useState } from 'react';
import {
  ArrowLeft,
  ImageIcon,
  Mic,
  StopCircle,
  MessageSquare,
  Moon,
  Sun,
  Minimize2,
  Maximize2,
  Trash2,
  Download,
  HardDrive,
  Share2,
  FileText,
  Loader2,
  Check,
  File as FileIcon,
} from 'lucide-react';
import { useNotesContext } from '../../context/NotesContext';
import { ARIA_LABELS } from '../../constants';
import type { SaveStatus } from '../../types';

interface EditorToolbarProps {
  isFullWidth: boolean;
  onToggleWidth: () => void;
  onBack: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShare: () => void;
  onDownloadMarkdown: () => void;
  onDownloadPDF: () => void;
  onSaveToDrive: () => void;
  saveStatus: SaveStatus;
}

export const EditorToolbar = React.memo<EditorToolbarProps>(({
  isFullWidth,
  onToggleWidth,
  onBack,
  onImageUpload,
  onShare,
  onDownloadMarkdown,
  onDownloadPDF,
  onSaveToDrive,
  saveStatus,
}) => {
  const { notes, chat, recording, theme } = useNotesContext();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  if (!notes.activeNote) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-colors"
          aria-label={ARIA_LABELS.BACK_TO_DASHBOARD}
        >
          <ArrowLeft size={20} />
        </button>

        {/* AI Action Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 ml-2 transition-colors">
          <label
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            title={ARIA_LABELS.UPLOAD_IMAGE}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
            />
            <ImageIcon size={18} />
          </label>
          <button
            onClick={recording.isRecording ? recording.stopRecording : () => {}}
            className={`p-2 rounded-full transition-colors ${
              recording.isRecording
                ? 'text-red-600 bg-red-100 dark:bg-red-900/30 animate-pulse'
                : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
            title={
              recording.isRecording
                ? ARIA_LABELS.STOP_RECORDING
                : ARIA_LABELS.START_RECORDING
            }
            aria-label={
              recording.isRecording
                ? ARIA_LABELS.STOP_RECORDING
                : ARIA_LABELS.START_RECORDING
            }
          >
            {recording.isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => chat.setIsChatOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Ask AI"
          >
            <MessageSquare size={18} />
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={theme.toggleTheme}
          className="ml-2 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
          aria-label={ARIA_LABELS.TOGGLE_THEME}
        >
          {theme.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex gap-2 relative">
        <button
          onClick={onToggleWidth}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-sm transition-colors"
          title="Fit to screen"
        >
          {isFullWidth ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={() => notes.deleteNote(notes.activeNote!.id)}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          title={ARIA_LABELS.DELETE_NOTE}
          aria-label={ARIA_LABELS.DELETE_NOTE}
        >
          <Trash2 size={20} />
        </button>

        {/* Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title={ARIA_LABELS.DOWNLOAD}
            aria-label={ARIA_LABELS.DOWNLOAD}
          >
            <Download size={20} />
          </button>
          {showDownloadMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDownloadMenu(false)}
              ></div>
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 min-w-[160px] z-20 flex flex-col">
                <button
                  onClick={onDownloadMarkdown}
                  className="px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <FileText size={16} className="text-slate-400" /> Markdown (.md)
                </button>
                <button
                  onClick={onDownloadPDF}
                  className="px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <FileIcon size={16} className="text-slate-400" /> PDF (.pdf)
                </button>
              </div>
            </>
          )}
        </div>

        <button
          id="drive-btn"
          onClick={onSaveToDrive}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-3 py-2 md:px-4 border rounded-full text-sm font-medium transition-all ${
            saveStatus === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : saveStatus === 'saving'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="animate-spin" size={16} />
          ) : saveStatus === 'success' ? (
            <Check size={16} />
          ) : (
            <HardDrive size={16} />
          )}
          <span className="hidden sm:inline">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save'}
          </span>
        </button>
        <button
          onClick={onShare}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          aria-label={ARIA_LABELS.SHARE}
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';
