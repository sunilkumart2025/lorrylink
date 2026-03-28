import { useState, useCallback } from 'react';

/**
 * Hook for LoadLink AI Assistant
 * Pillar 5.0 - Intelligence Layer
 */
export const useChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Swagat hai! (Welcome!) I am LinkAI, your highway performance assistant. How can I help you earn more today?", sender: 'ai', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (text) => {
    // 1. Add User Message
    const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // 2. Simulate AI Thinking
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Simple Pattern Matching for "Training" context
    let response = "I'm still learning that, but I can help you with Detour Calculations, Combo Trips, and Ratings. Type 'Help' for more.";
    
    const input = text.toLowerCase();
    if (input.includes('detour')) {
      response = "Detour value is calculated as: Load Earning - (Extra KM * Diesel Cost). I recommend detours with a net gain > ₹5,000.";
    } else if (input.includes('rating') || input.includes('star')) {
      response = "High ratings (4.5+) give you priority access to premium loads. Always ask shippers to rate you after delivery!";
    } else if (input.includes('combo')) {
      response = "Combo trips chain two loads (e.g., A->B, B->C) to double your revenue. Check the 'Build My Trip' section.";
    } else if (input.includes('help')) {
      response = "Try asking: 'How do I calculate detour profit?' or 'How do I get 5 stars?'";
    }

    const aiMsg = { id: Date.now() + 1, text: response, sender: 'ai', timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  }, []);

  return { messages, sendMessage, isTyping };
};
