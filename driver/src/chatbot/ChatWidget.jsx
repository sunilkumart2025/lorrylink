import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles, X } from 'lucide-react';
import { DEFAULT_SUGGESTIONS } from './assistantBrain';
import ChatPanel from './ChatPanel';
import './ChatStyles.css';
import { useChat } from './useChat';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isTyping } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickPrompt = (prompt) => {
    if (!isOpen) {
      setIsOpen(true);
    }

    sendMessage(prompt);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((open) => !open)}
        className="linkai-launcher"
        aria-label={isOpen ? 'Close LinkAI' : 'Open LinkAI'}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <div className="linkai-launcher-icon">
            <Bot size={22} />
            <Sparkles size={12} className="linkai-launcher-sparkle" />
          </div>
        )}
        {!isOpen && <span className="linkai-launcher-ping" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="linkai-window-shell"
          >
            <div className="linkai-scroll-shell">
              <ChatPanel
                messages={messages}
                isTyping={isTyping}
                input={input}
                setInput={setInput}
                onSubmit={handleSend}
                onPromptClick={handleQuickPrompt}
                onClose={() => setIsOpen(false)}
                messagesRef={scrollRef}
                starterPrompts={DEFAULT_SUGGESTIONS}
                title="LinkAI Assistant"
                subtitle="Loads, bookings, wallet, KYC, and route help"
                isFloating
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
