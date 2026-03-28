import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatStyles.css';

/**
 * LoadLink AI Chatbot - Modular Component
 * Designed for easy training and integration.
 */
export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Namaste! I'm your LoadLink Assistant. How can I help you find a load or manage your truck today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulated AI Logic (Phase 11.2)
    setTimeout(() => {
      const botResponse = getMockResponse(input);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
      setIsTyping(false);
    }, 1500);
  };

  const getMockResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('match') || q.includes('load')) return "I see 3 high-paying loads from Chennai to Mumbai. Would you like me to show them in your matches?";
    if (q.includes('wallet') || q.includes('payment')) return "Your current balance is ₹2,45,000. Your last payment of ₹15,000 was processed 2 hours ago.";
    if (q.includes('kyc') || q.includes('verify')) return "Your Aadhaar is verified. Please upload your Driving License to reach 'Gold' status.";
    return "I'm not sure about that. I can help with loads, payments, or your profile. What would you like to know?";
  };

  return (
    <>
      {/* Floating Bubble */}
      <motion.button
        className="chat-bubble"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={24} color="white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="flex items-center gap-sm">
                <div className="bot-avatar">
                  <Bot size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>LoadLink AI</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Online Assistant</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={scrollRef}>
              {messages.map(msg => (
                <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                  <div className="message-content">
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-wrapper bot">
                  <div className="message-content typing">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button type="submit">
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
