import React, { useState } from 'react';
import { Wand2, ArrowLeft, Sparkles, BrainCircuit, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TagManager } from '../TagManager';
import type { Note } from '../../types';

interface SummaryTabProps {
  note: Note;
  isFullWidth: boolean;
  onUpdate: (updates: Partial<Note>) => void;
  onRefine: (instruction: string) => Promise<void>;
}

export const SummaryTab = React.memo<SummaryTabProps>(({
  note,
  isFullWidth,
  onUpdate,
  onRefine,
}) => {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleRefineSummary = async () => {
    if (!refineInput.trim()) return;
    setIsRefining(true);
    try {
      await onRefine(refineInput);
      setRefineInput('');
      setIsEditingSummary(false);
    } catch (error) {
      console.error('Refinement failed', error);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div
      className={`mx-auto space-y-6 transition-all duration-300 ${
        isFullWidth ? 'w-full md:px-4' : 'max-w-2xl'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px] relative group transition-colors">
        {/* Toggle Edit Button */}
        {note.summaryText && (
          <button
            onClick={() => setIsEditingSummary(!isEditingSummary)}
            className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
            title={isEditingSummary ? 'Done Editing' : 'Edit Summary'}
          >
            {isEditingSummary ? <Check size={18} /> : <Edit2 size={18} />}
          </button>
        )}

        {note.summaryText ? (
          isEditingSummary ? (
            <textarea
              value={note.summaryText}
              onChange={(e) => onUpdate({ summaryText: e.target.value })}
              className="w-full h-full min-h-[400px] outline-none resize-none text-slate-700 dark:text-slate-200 bg-transparent leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base font-mono"
              autoFocus
            />
          ) : (
            <div className="markdown-preview prose dark:prose-invert max-w-none">
              <ReactMarkdown>{note.summaryText}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center">
            {note.isProcessing ? (
              <div className="w-64 h-80 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center bg-blue-50/30 dark:bg-blue-900/10 transition-colors">
                <Sparkles size={48} className="mb-4 text-blue-400 animate-pulse" />
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium text-center px-4">
                  Generating summary in background...
                </p>
              </div>
            ) : (
              <div className="w-64 h-80 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
                <BrainCircuit size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium text-center px-4">
                  No summary yet.
                  <br />
                  Click "Generate Summary" to create one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refinement Box */}
      {note.summaryText && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm transition-colors">
          <label className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
            <Wand2 size={12} /> Refine with AI
          </label>
          <div className="flex gap-2">
            <input
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder="Make it shorter..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500 text-slate-700 dark:text-slate-200 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleRefineSummary()}
            />
            <button
              onClick={handleRefineSummary}
              disabled={isRefining || !refineInput.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRefining ? (
                <Sparkles className="animate-spin" size={18} />
              ) : (
                <ArrowLeft className="rotate-180" size={18} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tags Manager */}
      {note.summaryText && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <TagManager
            note={note}
            updateNote={onUpdate}
          />
        </div>
      )}
    </div>
  );
});

SummaryTab.displayName = 'SummaryTab';
