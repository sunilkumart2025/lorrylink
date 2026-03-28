import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  X,
  Mic,
  IndianRupee,
  Package,
  MessageSquare,
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { sendMessage } from '../../lib/db/messages';
import { supabase } from '../../lib/supabase';
import NegotiationOffer from './NegotiationOffer';

/**
 * ChatWindow Component: Premium, real-time negotiation interface.
 * Implements Pillar 4.1: Frictionless Load Matching & Direct Negotiation.
 */
export default function ChatWindow({ shipment, user, onClose }) {
  const [inputText, setInputText] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState(shipment?.price || 0);
  const [isListening, setIsListening] = useState(false);

  const { messages, isLoading } = useChat(shipment?.id, user.id);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    await sendMessage({
      shipment_id: shipment.id,
      sender_id: user.id,
      receiver_id: shipment.business_id,
      content: inputText.trim(),
      type: 'text'
    });

    setInputText('');
  };

  const handleSendOffer = async () => {
    await sendMessage({
      shipment_id: shipment.id,
      sender_id: user.id,
      receiver_id: shipment.business_id,
      content: `Proposed a new price: ₹${offerPrice}`,
      type: 'offer',
      metadata: { price: Number(offerPrice), weight: shipment.weight_kg / 1000, expiry: '1h' }
    });
    setShowOfferForm(false);
  };

  const handleAcceptOffer = async (offer) => {
    const { price } = offer.metadata;
    
    // 1. Update Shipment Price
    const { error: shipmentError } = await supabase
      .from('shipments')
      .update({ price })
      .eq('id', shipment.id);

    if (shipmentError) {
      alert("Error updating shipment: " + shipmentError.message);
      return;
    }

    // 2. Send System Message
    await sendMessage({
      shipment_id: shipment.id,
      sender_id: user.id,
      receiver_id: shipment.business_id,
      content: `Accepted the offer of ₹${price.toLocaleString()}. Route locked!`,
      type: 'system'
    });

    alert("Offer accepted! This price will be used for the booking.");
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported on this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.start();
  };

  return (
    <div className="mac-window-shell">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mac-window-backdrop"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.7 }}
        transition={{ type: 'spring', damping: 24, stiffness: 210 }}
        className="mac-window"
      >
        <div className="mac-window-toolbar">
          <div className="mac-window-heading">
            <div className="mac-window-controls" aria-hidden="true">
              <span className="mac-window-control is-red" />
              <span className="mac-window-control is-yellow" />
              <span className="mac-window-control is-green" />
            </div>

            <div style={{ position: 'relative' }}>
              <div className="mac-window-icon">
                <Package size={22} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: '-3px',
                  bottom: '-3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  border: '2px solid var(--color-surface)',
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div className="mac-window-eyebrow">Direct lane chat</div>
              <h3 className="mac-window-title">Active Negotiation</h3>
              <div className="mac-window-subtitle">
                <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
                  #{shipment.id.slice(0, 6).toUpperCase()}
                </span>
                <span>•</span>
                <span>Online now</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="app-close" aria-label="Close negotiation">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="mac-window-body">
          {isLoading ? (
            <div className="mac-empty-state">
              <MessageSquare size={42} />
              <strong>Loading conversation</strong>
              <span>Fetching the latest negotiation history.</span>
            </div>
          ) : (
            <div className="chat-message-stack">
              {messages.length === 0 && (
                <div className="mac-empty-state">
                  <MessageSquare size={48} />
                  <strong>No messages yet</strong>
                  <span>Start the negotiation with a note or send a counter-offer.</span>
                </div>
              )}

              {messages.map((message, index) => {
                const isMe = message.sender_id === user.id;
                const bubbleClass = [
                  'chat-message-bubble',
                  isMe ? 'is-me' : '',
                  message.type === 'system' ? 'is-system' : '',
                ].filter(Boolean).join(' ');

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`chat-message-item${isMe ? ' is-me' : ''}`}
                  >
                    {message.type === 'offer' ? (
                      <NegotiationOffer
                        offer={message}
                        isSender={isMe}
                        onAccept={() => handleAcceptOffer(message)}
                      />
                    ) : (
                      <div className={bubbleClass}>{message.content}</div>
                    )}

                    <div className="chat-message-time" style={{ textAlign: isMe ? 'right' : 'left' }}>
                      {message.created_at
                        ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showOfferForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="chat-offer-strip"
            >
              <div className="chat-offer-header">
                <div className="chat-offer-heading">Propose Counter-Offer</div>
                <button
                  onClick={() => setShowOfferForm(false)}
                  className="app-close"
                  aria-label="Close counter offer form"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="chat-offer-form">
                <div className="chat-price-field">
                  <label className="chat-price-label" htmlFor="offer-price">
                    New Offer Price (INR)
                  </label>
                  <input
                    id="offer-price"
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="chat-price-input"
                  />
                </div>

                <button onClick={handleSendOffer} className="trip-action-button is-primary" style={{ minHeight: '52px', paddingInline: '22px' }}>
                  Send Proposal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="chat-composer">
          <button
            type="button"
            onClick={() => setShowOfferForm((prev) => !prev)}
            className="chat-icon-button is-offer"
            aria-label="Open counter offer"
          >
            <IndianRupee size={22} />
          </button>

          <div className="chat-input-wrap">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
            />
            <button type="submit" disabled={!inputText.trim()} className="chat-send-button" aria-label="Send message">
              <Send size={17} fill="currentColor" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleVoiceInput}
            className={`chat-icon-button${isListening ? ' is-recording' : ''}`}
            aria-label="Start voice input"
          >
            <Mic size={22} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
