import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ImageIcon,
  Mic,
  StopCircle,
  MessageSquare,
  Trash2,
  Download,
  HardDrive,
  Share2,
  FileText,
  Loader2,
  Check,
  File as FileIcon,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import { useNotesContext } from '../../context/NotesContext';
import { ARIA_LABELS } from '../../constants';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getDriveFileUrl } from '../../services/driveService';
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
  onStartRecording: () => void;
  saveStatus: SaveStatus;
  driveFileId?: string;
  driveError: string | null;
  onClearDriveError: () => void;
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
  onStartRecording,
  saveStatus,
  driveFileId,
  driveError,
  onClearDriveError,
}) => {
  const { notes, chat, recording, processing } = useNotesContext();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDriveSuccess, setShowDriveSuccess] = useState(false);

  if (!notes.activeNote) return null;

  useEffect(() => {
    if (saveStatus === 'success' && driveFileId) {
      setShowDriveSuccess(true);
      const timer = setTimeout(() => setShowDriveSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, driveFileId]);

  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const handleDeleteConfirm = () => {
    notes.deleteNote(notes.activeNote!.id);
    setShowDeleteConfirm(false);
    onBack();
  };

  const handleViewInDrive = () => {
    if (driveFileId) window.open(getDriveFileUrl(driveFileId), '_blank');
  };

  return (
    <>
      {/* Notifications */}
      {driveError && (
        <div className="fixed top-3 right-3 z-50 max-w-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-200 flex-1">{driveError}</p>
          <button onClick={onClearDriveError} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {showDriveSuccess && driveFileId && (
        <div className="fixed top-3 right-3 z-50 max-w-sm bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-3 flex items-start gap-2">
          <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-200">Saved to Drive</p>
            <button
              onClick={handleViewInDrive}
              className="text-xs text-green-600 dark:text-green-300 flex items-center gap-1 hover:underline"
            >
              Open <ExternalLink size={10} />
            </button>
          </div>
          <button onClick={() => setShowDriveSuccess(false)} className="text-green-400 hover:text-green-600">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
        {/* Left side - Back and actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            aria-label={ARIA_LABELS.BACK_TO_DASHBOARD}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <label
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Upload image"
          >
            <input type="file" accept="image/*" multiple className="hidden" onChange={onImageUpload} />
            <ImageIcon size={16} />
          </label>
          <button
            onClick={recording.isRecording ? recording.stopRecording : onStartRecording}
            className={`p-2 rounded-lg transition-colors ${
              recording.isRecording
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={recording.isRecording ? 'Stop' : 'Record'}
          >
            {recording.isRecording ? <StopCircle size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={() => chat.setIsChatOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="AI Assistant"
          >
            <MessageSquare size={16} />
          </button>
        </div>

        {/* Right side - Save actions */}
        <div className="flex items-center gap-0.5">
          {processing.processingStatus.step === 'transcribing' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 mr-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
              <Loader2 className="animate-spin" size={12} />
              <span>Transcribing...</span>
            </div>
          )}

          <button
            onClick={handleDeleteClick}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={16} />
            </button>
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-20">
                  <button
                    onClick={() => { onDownloadMarkdown(); setShowDownloadMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-slate-400" /> Markdown
                  </button>
                  <button
                    onClick={() => { onDownloadPDF(); setShowDownloadMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <FileIcon size={14} className="text-slate-400" /> PDF
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onShare}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Share"
          >
            <Share2 size={16} />
          </button>

          <button
            onClick={onSaveToDrive}
            disabled={saveStatus !== 'idle'}
            title={driveFileId ? 'Update in Drive' : 'Save to Drive'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 ml-1 rounded-lg text-xs font-medium transition-all ${
              saveStatus === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : saveStatus === 'saving'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="animate-spin" size={14} />
            ) : saveStatus === 'success' ? (
              <Check size={14} />
            ) : (
              <HardDrive size={14} />
            )}
            <span className="hidden sm:inline">
              {saveStatus === 'saving' ? 'Saving' : saveStatus === 'success' ? 'Saved' : driveFileId ? 'Update' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Note"
        size="sm"
        closeOnOverlayClick={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Delete this note? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
});

EditorToolbar.displayName = 'EditorToolbar';
