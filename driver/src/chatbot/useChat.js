import { useState, useCallback, useRef } from 'react';
import { DEFAULT_SUGGESTIONS, getAssistantReply } from './assistantBrain';

/**
 * Hook for LoadLink AI Assistant
 * Pillar 5.0 - Intelligence Layer
 */
export const useChat = () => {
  const nextIdRef = useRef(2);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Swagat hai! I am LinkAI, your highway performance assistant. Ask me a basic task or question about loads, bookings, wallet, KYC, or membership.',
      sender: 'ai',
      timestamp: new Date(),
      suggestions: DEFAULT_SUGGESTIONS,
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const createMessage = useCallback((payload) => ({
    id: nextIdRef.current++,
    timestamp: new Date(),
    ...payload,
  }), []);

  const sendMessage = useCallback(async (text) => {
    const userMsg = createMessage({ text, sender: 'user' });
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    const reply = getAssistantReply(text);
    const aiMsg = createMessage({
      text: reply.text,
      sender: 'ai',
      suggestions: reply.suggestions,
    });

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  }, [createMessage]);

  return { messages, sendMessage, isTyping };
};
