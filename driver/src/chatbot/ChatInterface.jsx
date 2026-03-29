import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { DEFAULT_SUGGESTIONS } from './assistantBrain';
import ChatPanel from './ChatPanel';
import './ChatStyles.css';
import { useChat } from './useChat';

/**
 * Alternate assistant entry point kept in sync with the global widget.
 */
export default function ChatInterface() {
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
        className="chat-bubble"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((open) => !open)}
      >
        <MessageSquare size={22} color="white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
          >
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
