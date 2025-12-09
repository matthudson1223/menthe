import React, { useRef, useEffect } from 'react';
import { Sparkles, X, Send } from 'lucide-react';
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
    <div className="fixed inset-0 md:inset-auto md:bottom-20 md:right-6 md:w-96 md:h-[500px] bg-white dark:bg-slate-900 md:rounded-2xl shadow-2xl z-40 flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-10 fade-in duration-300 transition-colors">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 md:rounded-t-2xl flex justify-between items-center text-white shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <span className="font-semibold">Gemini Assistant</span>
        </div>
        <button
          onClick={() => chat.setIsChatOpen(false)}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
          aria-label={ARIA_LABELS.CLOSE_CHAT}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors">
        {chat.chatMessages.length === 0 && (
          <div className="text-center text-slate-400 dark:text-slate-500 mt-10">
            <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">
              Ask me anything about your notes or general questions!
            </p>
          </div>
        )}
        {chat.chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {chat.isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 md:rounded-b-2xl transition-colors">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/50 transition-all">
          <input
            value={chat.chatInput}
            onChange={(e) => chat.setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            aria-label="Chat message input"
          />
          <button
            onClick={chat.sendMessage}
            disabled={!chat.chatInput.trim() || chat.isChatLoading}
            className="text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={ARIA_LABELS.SEND_MESSAGE}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
