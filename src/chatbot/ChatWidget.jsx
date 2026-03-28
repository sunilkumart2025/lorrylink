import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, User, Bot, HelpCircle } from 'lucide-react';
import { useChat } from './useChat';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, isTyping } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '100px', // Above bottom nav
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1DE9B6 0%, #00BFA5 100%)',
          color: '#00241B',
          border: 'none',
          boxShadow: '0 8px 32px rgba(29, 233, 182, 0.4)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? <X size={28} /> : (
          <div style={{ position: 'relative' }}>
            <Bot size={28} style={{ position: 'relative', zIndex: 1 }} />
            <Sparkles size={14} style={{ position: 'absolute', top: -4, right: -4, color: '#fff', zIndex: 2 }} />
          </div>
        )}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#FF5252',
              border: '3px solid #00241B'
            }}
          />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            style={{
              position: 'fixed',
              bottom: '180px',
              right: '20px',
              width: '350px',
              height: '500px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', padding: '8px', borderRadius: '12px', color: '#00241B' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px' }}>LoadLink AI</h4>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                  ULTRA-FAST LOGISTICS ASSISTANT
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {messages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ padding: '12px 16px', borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px', backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: msg.sender === 'user' ? '#00241B' : 'white', fontSize: '14px', lineHeight: '1.4' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px' }}>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ask LinkAI..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'white',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  color: '#00241B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
