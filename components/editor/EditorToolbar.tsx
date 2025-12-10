import React, { useState, useEffect } from 'react';
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
  const { notes, chat, recording, theme } = useNotesContext();
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDriveSuccess, setShowDriveSuccess] = useState(false);

  if (!notes.activeNote) return null;

  // Show success notification when save completes
  useEffect(() => {
    if (saveStatus === 'success' && driveFileId) {
      setShowDriveSuccess(true);
      const timer = setTimeout(() => {
        setShowDriveSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, driveFileId]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    notes.deleteNote(notes.activeNote!.id);
    setShowDeleteConfirm(false);
    onBack(); // Navigate back to dashboard after deletion
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    // Stay on the note page
  };

  const handleViewInDrive = () => {
    if (driveFileId) {
      window.open(getDriveFileUrl(driveFileId), '_blank');
    }
  };

  return (
    <>
      {/* Error Notification */}
      {driveError && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{driveError}</p>
          </div>
          <button
            onClick={onClearDriveError}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success Notification */}
      {showDriveSuccess && driveFileId && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top">
          <Check size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Saved to Google Drive!
            </p>
            <button
              onClick={handleViewInDrive}
              className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 flex items-center gap-1 underline"
            >
              View in Drive <ExternalLink size={14} />
            </button>
          </div>
          <button
            onClick={() => setShowDriveSuccess(false)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

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
              multiple
              className="hidden"
              onChange={onImageUpload}
            />
            <ImageIcon size={18} />
          </label>
          <button
            onClick={recording.isRecording ? recording.stopRecording : onStartRecording}
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
          onClick={handleDeleteClick}
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
          title={driveFileId ? 'Update file in Google Drive' : 'Save to Google Drive'}
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
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'success'
              ? 'Saved'
              : driveFileId
              ? 'Update'
              : 'Save'}
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          title="Delete Note"
          size="sm"
          closeOnOverlayClick={false}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 dark:text-slate-300">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={handleDeleteCancel}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                className="px-4"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
});

EditorToolbar.displayName = 'EditorToolbar';
