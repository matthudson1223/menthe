import React, { useRef, useEffect } from 'react';
import { Zap, X, Send, MessageSquare } from 'lucide-react';
import { useNotesContext } from '../context/NotesContext';
import { ARIA_LABELS } from '../constants';

export const ChatPanel = React.memo(() => {
  const { chat } = useNotesContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.chatMessages, chat.isChatOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chat.sendMessage();
    }
  };

  if (!chat.isChatOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-16 md:right-4 md:w-80 md:h-[420px] bg-white dark:bg-slate-900 md:rounded-xl shadow-2xl z-40 flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Zap size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <button
          onClick={() => chat.setIsChatOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          aria-label={ARIA_LABELS.CLOSE_CHAT}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950">
        {chat.chatMessages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-8">
            <MessageSquare className="mx-auto mb-2 opacity-40" size={24} />
            <p className="text-xs">
              Ask anything about your notes
            </p>
          </div>
        )}
        {chat.chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {chat.isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 md:rounded-b-xl">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20">
          <input
            value={chat.chatInput}
            onChange={(e) => chat.setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            aria-label="Chat message input"
          />
          <button
            onClick={chat.sendMessage}
            disabled={!chat.chatInput.trim() || chat.isChatLoading}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-40 transition-colors"
            aria-label={ARIA_LABELS.SEND_MESSAGE}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
