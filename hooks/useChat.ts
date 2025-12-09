import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, UseChatReturn } from '../types';
import * as geminiService from '../services/geminiService';
import { MESSAGES } from '../constants';
import { retryWithBackoff } from '../utils/helpers';

/**
 * Custom hook for managing AI chat functionality
 */
export function useChat(): UseChatReturn {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await retryWithBackoff(() =>
        geminiService.chatWithAI(userMessage)
      );
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: MESSAGES.CHAT_ERROR
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  return {
    isChatOpen,
    chatMessages,
    chatInput,
    isChatLoading,
    setIsChatOpen,
    setChatInput,
    sendMessage,
    clearChat,
  };
}
