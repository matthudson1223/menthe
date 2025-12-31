import React, { useState } from 'react';
import { Note } from '../types';
import { FileText, Mic, Image as ImageIcon, RotateCcw, Trash2 } from 'lucide-react';
import { Modal } from './ui';

interface Props {
  note: Note;
  onClick: (note: Note) => void;
  onRestore: (noteId: string) => void;
  onPermanentDelete: (noteId: string) => void;
}

export const TrashNoteCard: React.FC<Props> = ({ note, onClick, onRestore, onPermanentDelete }) => {
  const Icon = note.type === 'audio' ? Mic : note.type === 'image' ? ImageIcon : FileText;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore(note.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmPermanentDelete = () => {
    onPermanentDelete(note.id);
    setShowDeleteConfirm(false);
  };

  const getPreviewText = () => {
    if (note.summaryText) return note.summaryText;
    if (note.verbatimText) return note.verbatimText;
    if (note.userNotes) return note.userNotes;
    return "No content yet";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="relative w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => onClick(note)}
          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors outline-none"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              note.type === 'audio'
                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                : note.type === 'image'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            }`}>
              <Icon size={15} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                  {note.title}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                  {note.deletedAt ? `Deleted ${formatDate(note.deletedAt)}` : formatDate(note.createdAt)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {getPreviewText()}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs text-slate-400 px-1">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2 p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={handleRestoreClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            Restore
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Delete Forever
          </button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Permanently delete note"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently delete "{note.title}". This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPermanentDelete}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
