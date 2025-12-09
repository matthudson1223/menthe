import React, { useState, useRef } from 'react';
import { Clock, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { EditorToolbar } from './EditorToolbar';
import { NoteTab } from './NoteTab';
import { FilesTab } from './FilesTab';
import { TranscriptTab } from './TranscriptTab';
import { SummaryTab } from './SummaryTab';
import { useNotesContext } from '../../context/NotesContext';
import * as geminiService from '../../services/geminiService';
import { MESSAGES, APP_CONFIG } from '../../constants';
import { sanitizeFilename, copyToClipboard } from '../../utils/helpers';
import type { TabType, SaveStatus } from '../../types';

interface EditorProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onBack: () => void;
  onStartRecording: () => void;
}

export const Editor = React.memo<EditorProps>(({
  activeTab,
  setActiveTab,
  onBack,
  onStartRecording,
}) => {
  const { notes, processing } = useNotesContext();
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.activeNote;

  if (!activeNote) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const base64 = await geminiService.fileToBase64(file);
    const mimeType = file.type;
    const url = `data:${mimeType};base64,${base64}`;

    notes.updateNote(activeNote.id, {
      type: 'image',
      originalMediaUrl: url,
    });

    setActiveTab('files');

    try {
      await processing.processNote(activeNote, base64, mimeType, 'image', activeNote.verbatimText);
    } catch (error) {
      alert(MESSAGES.PROCESSING_ERROR);
    }
  };

  const handleShare = async () => {
    const textToShare = `${activeNote.title}\n\nSummary:\n${
      activeNote.summaryText || 'No summary'
    }\n\nNotes:\n${activeNote.userNotes || ''}\n\nTranscript:\n${activeNote.verbatimText}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeNote.title,
          text: textToShare,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      const success = await copyToClipboard(textToShare);
      if (success) {
        alert(MESSAGES.CLIPBOARD_SUCCESS);
      }
    }
  };

  const handleDownloadMarkdown = () => {
    const content = `# ${activeNote.title}
Date: ${new Date(activeNote.createdAt).toLocaleString()}

${activeNote.summaryText ? `## Summary\n${activeNote.summaryText}\n` : ''}
${activeNote.userNotes ? `## User Notes\n${activeNote.userNotes}\n` : ''}
${activeNote.verbatimText ? `## Transcript\n${activeNote.verbatimText}\n` : ''}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(activeNote.title)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current) return;

    const element = pdfContentRef.current;
    const opt = {
      ...APP_CONFIG.PDF_GENERATION_OPTIONS,
      filename: `${sanitizeFilename(activeNote.title)}.pdf`,
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error('PDF generation failed', e);
      alert(MESSAGES.PDF_GENERATION_FAILED);
    }
  };

  const handleSaveToDrive = () => {
    if (window.confirm(MESSAGES.CONFIRM_SAVE_DRIVE(activeNote.title))) {
      setSaveStatus('saving');

      // Simulate API interaction
      setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }, 1500);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      await processing.generateSummary(activeNote);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleRefineSummary = async (instruction: string) => {
    await processing.refineSummary(activeNote, instruction);
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors">
      <EditorToolbar
        isFullWidth={isFullWidth}
        onToggleWidth={() => setIsFullWidth(!isFullWidth)}
        onBack={onBack}
        onImageUpload={handleImageUpload}
        onShare={handleShare}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDownloadPDF={handleDownloadPDF}
        onSaveToDrive={handleSaveToDrive}
        saveStatus={saveStatus}
      />

      {/* Title Area */}
      <div
        className={`px-4 md:px-6 pt-6 pb-2 mx-auto ${
          isFullWidth ? 'w-full md:px-8' : 'max-w-3xl'
        }`}
      >
        <input
          value={activeNote.title}
          onChange={(e) => notes.updateNote(activeNote.id, { title: e.target.value })}
          className="text-2xl font-bold w-full outline-none text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent transition-colors"
          placeholder="Untitled Note"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
          <Clock size={12} />
          {new Date(activeNote.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Content Tabs & Actions */}
      <div
        className={`flex flex-wrap items-end justify-between border-b border-slate-100 dark:border-slate-800 px-4 md:px-6 mt-4 mx-auto gap-4 ${
          isFullWidth ? 'w-full md:px-8' : 'max-w-3xl'
        } transition-colors`}
      >
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {(['notes', 'files', 'transcript', 'summary'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Generate Summary Button */}
        <button
          onClick={handleGenerateSummary}
          disabled={activeNote.isProcessing}
          className={`mb-2 px-3 py-2 md:px-4 border rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
            activeNote.isProcessing
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-400 dark:text-blue-300 cursor-not-allowed'
              : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 active:scale-95'
          }`}
        >
          {activeNote.isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          <span className="hidden sm:inline">
            {activeNote.isProcessing ? 'Generating...' : 'Generate Summary'}
          </span>
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 pb-20 transition-colors">
        {activeTab === 'notes' && (
          <NoteTab
            note={activeNote}
            isFullWidth={isFullWidth}
            onUpdate={(updates) => notes.updateNote(activeNote.id, updates)}
          />
        )}
        {activeTab === 'files' && <FilesTab note={activeNote} isFullWidth={isFullWidth} />}
        {activeTab === 'transcript' && (
          <TranscriptTab
            note={activeNote}
            isFullWidth={isFullWidth}
            onUpdate={(updates) => notes.updateNote(activeNote.id, updates)}
          />
        )}
        {activeTab === 'summary' && (
          <SummaryTab
            note={activeNote}
            isFullWidth={isFullWidth}
            onUpdate={(updates) => notes.updateNote(activeNote.id, updates)}
            onRefine={handleRefineSummary}
          />
        )}
      </div>

      {/* Hidden PDF Generation Template */}
      <div
        style={{
          position: 'fixed',
          top: '-10000px',
          left: '-10000px',
          width: '210mm',
          minHeight: '297mm',
          background: 'white',
          padding: '20mm',
        }}
        ref={pdfContentRef}
      >
        <div className="text-slate-900 font-sans">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">{activeNote.title}</h1>
          <p className="text-sm text-slate-500 mb-8 pb-4 border-b border-slate-100">
            {new Date(activeNote.createdAt).toLocaleString()}
          </p>

          {activeNote.type === 'image' && activeNote.originalMediaUrl && (
            <div className="mb-8 flex justify-center bg-slate-50 p-4 rounded-lg">
              <img
                src={activeNote.originalMediaUrl}
                alt="Note Attachment"
                style={{ maxWidth: '100%', maxHeight: '400px' }}
              />
            </div>
          )}

          {activeNote.summaryText && (
            <div className="mb-8">
              <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-blue-900">
                Summary
              </h2>
              <div className="markdown-preview text-sm leading-relaxed text-slate-800">
                <ReactMarkdown>{activeNote.summaryText}</ReactMarkdown>
              </div>
            </div>
          )}

          {activeNote.userNotes && (
            <div className="mb-8">
              <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-blue-900">
                User Notes
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded border border-slate-100 text-slate-700">
                {activeNote.userNotes}
              </p>
            </div>
          )}

          {activeNote.verbatimText && (
            <div className="mb-8">
              <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4 text-blue-900">
                Transcript
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600 font-serif">
                {activeNote.verbatimText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';
