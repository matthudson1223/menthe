import React from 'react';
import { Loader2, Sparkles, BrainCircuit, Zap } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface Props {
  status: ProcessingStatus;
}

export const ProcessingOverlay: React.FC<Props> = ({ status }) => {
  if (status.step === 'idle') return null;

  const getIcon = () => {
    switch (status.step) {
      case 'transcribing': return <Zap className="w-12 h-12 text-yellow-500 animate-pulse" />;
      case 'summarizing': return <BrainCircuit className="w-12 h-12 text-purple-500 animate-pulse" />;
      case 'titling': return <Sparkles className="w-12 h-12 text-blue-500 animate-bounce" />;
      default: return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col items-center max-w-sm w-full shadow-2xl border border-white/20 dark:border-slate-700 transition-colors">
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-full shadow-inner transition-colors">
          {getIcon()}
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Gemini is working</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-6">{status.message}</p>
        
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden transition-colors">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-progress w-full origin-left-right"></div>
        </div>
      </div>
    </div>
  );
};