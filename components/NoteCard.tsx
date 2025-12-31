import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { FileText, Mic, Image as ImageIcon, Trash2, Pin, Check } from 'lucide-react';

interface Props {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onTogglePin?: (noteId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (noteId: string) => void;
  isSelectionMode?: boolean;
}

export const NoteCard: React.FC<Props> = ({
  note,
  onClick,
  onDelete,
  onTogglePin,
  isSelected = false,
  onToggleSelect,
  isSelectionMode = false,
}) => {
  const Icon = note.type === 'audio' ? Mic : note.type === 'image' ? ImageIcon : FileText;

  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startX = useRef<number>(0);
  const currentOffset = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasSwiped = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ((e as React.MouseEvent).button && (e as React.MouseEvent).button !== 0) return;
    setIsSwiping(true);
    hasSwiped.current = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwiping) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - startX.current;
    if (Math.abs(diff) > 5) hasSwiped.current = true;
    const newOffset = Math.min(0, Math.max(-80, diff));
    const finalOffset = offset === -64 ? Math.min(0, Math.max(-80, -64 + diff)) : newOffset;
    currentOffset.current = finalOffset;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${finalOffset}px)`;
      cardRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (cardRef.current) cardRef.current.style.transition = 'transform 0.2s ease-out';
    if (currentOffset.current < -32) {
      setOffset(-64);
      if (cardRef.current) cardRef.current.style.transform = `translateX(-64px)`;
    } else {
      setOffset(0);
      if (cardRef.current) cardRef.current.style.transform = `translateX(0px)`;
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (hasSwiped.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (offset !== 0) {
      setOffset(0);
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.2s ease-out';
        cardRef.current.style.transform = `translateX(0px)`;
      }
    } else {
      onClick(note);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
    setOffset(0);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(note.id);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(note.id);
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
    <div className="relative w-full overflow-hidden rounded-lg select-none">
      {/* Delete action background */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 rounded-lg pr-5">
        <button
          onClick={handleDeleteClick}
          className="text-white p-1.5 active:scale-90 transition-transform"
          aria-label="Delete note"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main card */}
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-slate-900 z-10 rounded-lg border border-slate-200 dark:border-slate-800 touch-pan-y transition-all hover:border-slate-300 dark:hover:border-slate-700"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
      >
        {/* Selection checkbox */}
        {(isSelectionMode || isHovered) && onToggleSelect && (
          <button
            onClick={handleSelectClick}
            className={`absolute top-2 left-2 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-500'
            }`}
          >
            {isSelected && <Check size={14} className="text-white" />}
          </button>
        )}

        {/* Pin button */}
        {onTogglePin && (isHovered || note.isPinned) && (
          <button
            onClick={handlePinClick}
            className={`absolute top-2 right-2 z-20 p-1 rounded transition-all ${
              note.isPinned
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
          </button>
        )}

        <button
          onClick={handleContentClick}
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
                  {formatDate(note.createdAt)}
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
      </div>
    </div>
  );
};
