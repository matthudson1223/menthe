import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { FileText, Mic, Image as ImageIcon, Calendar, Trash2 } from 'lucide-react';

interface Props {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard: React.FC<Props> = ({ note, onClick, onDelete }) => {
  const Icon = note.type === 'audio' ? Mic : note.type === 'image' ? ImageIcon : FileText;
  
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef<number>(0);
  const currentOffset = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasSwiped = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Only enable for touch or left mouse button
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
    
    // Check for significant movement to identify swipe intent vs sloppy click
    if (Math.abs(diff) > 5) {
        hasSwiped.current = true;
    }
    
    // Only allow swiping left (negative diff)
    // Limit the swipe to -100px
    const newOffset = Math.min(0, Math.max(-100, diff));
    
    // If the card was already open (offset === -80), we adjust from there
    const finalOffset = offset === -80 ? Math.min(0, Math.max(-100, -80 + diff)) : newOffset;
    
    currentOffset.current = finalOffset;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${finalOffset}px)`;
      // Disable transition during drag for direct 1:1 movement
      cardRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    
    // Re-enable transition for snap animation
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.2s ease-out';
    }

    // Snap logic
    if (currentOffset.current < -40) {
      setOffset(-80);
      if (cardRef.current) cardRef.current.style.transform = `translateX(-80px)`;
    } else {
      setOffset(0);
      if (cardRef.current) cardRef.current.style.transform = `translateX(0px)`;
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    // If we swiped, do not trigger the click action
    if (hasSwiped.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    // If open, close it on click
    if (offset !== 0) {
      setOffset(0);
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.2s ease-out';
        cardRef.current.style.transform = `translateX(0px)`;
      }
    } else {
      // Normal navigation
      onClick(note);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
    // Reset offset
    setOffset(0);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-3 select-none group/card">
      {/* Background Action Layer */}
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 rounded-xl pr-6">
        <button 
          onClick={handleDeleteClick}
          className="text-white p-2 flex flex-col items-center justify-center hover:scale-110 transition-transform active:scale-95"
          aria-label="Delete note"
        >
          <Trash2 size={24} />
        </button>
      </div>

      {/* Foreground Content Layer */}
      <div 
        ref={cardRef}
        className="relative bg-white dark:bg-slate-900 z-10 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 touch-pan-y transition-colors"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <button 
          onClick={handleContentClick}
          className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group outline-none"
        >
          <div className="flex items-start justify-between mb-2 pointer-events-none">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <Icon size={20} />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pointer-events-none">{note.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pointer-events-none min-h-[1.25rem]">
            {note.summaryText || note.verbatimText || note.userNotes || "No content yet..."}
          </p>
        </button>
      </div>
    </div>
  );
};