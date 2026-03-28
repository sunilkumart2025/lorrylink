import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Paperclip, Mic, ArrowDown, 
  IndianRupee, Package, Clock, ShieldCheck, MessageSquare
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { sendMessage } from '../../lib/db/messages';
import NegotiationOffer from './NegotiationOffer';

/**
 * ChatWindow Component: Premium, real-time negotiation interface.
 * Implements Pillar 4.1: Frictionless Load Matching & Direct Negotiation.
 */
export default function ChatWindow({ shipment, user, onClose }) {
  const [inputText, setInputText] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState(shipment?.price || 0);
  
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

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '92vh',
        background: 'var(--color-background)',
        zIndex: 10000,
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        border: '1px solid var(--glass-border)'
      }}
    >
      {/* ── Chat Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Package size={24} />
            </div>
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--color-success)', border: '2px solid var(--color-background)' }}></div>
          </div>
          <div>
             <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>Active Negotiation</h3>
             <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: '800' }}>#{shipment.id.slice(0, 6).toUpperCase()}</span>
                <span>•</span>
                <span>Online</span>
             </div>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
           <X size={20} />
        </button>
      </div>

      {/* ── Chat Messages (History) ─────────────────────────────────── */}
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>LOADING HISTORY...</div>
        ) : (
          <>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, paddingBottom: '100px' }}>
                <MessageSquare size={48} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '14px', fontWeight: '800' }}>No messages yet</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>Start the negotiation by typing below</div>
              </div>
            )}
            {messages.map((m, i) => {
              const isMe = m.sender_id === user.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  {m.type === 'offer' ? (
                    <NegotiationOffer 
                      offer={m} 
                      isSender={isMe} 
                      onAccept={() => handleAcceptOffer(m)} 
                    />
                  ) : (
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                      background: isMe ? 'var(--color-primary)' : 'var(--glass-bg)',
                      color: isMe ? 'white' : 'white',
                      fontSize: '15px',
                      lineHeight: 1.5,
                      boxShadow: isMe ? '0 10px 20px rgba(59,130,246,0.15)' : 'none',
                      border: isMe ? 'none' : '1px solid var(--glass-border)'
                    }}>
                      {m.content}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px', textAlign: isMe ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showOfferForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: '24px', background: 'rgba(59,130,246,0.05)', borderTop: '1px solid var(--color-primary)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h4 style={{ fontSize: '12px', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Propose Counter-Offer</h4>
               <button onClick={() => setShowOfferForm(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
               <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>New Offer Price (₹)</label>
                  <input 
                    type="number" 
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-primary)', color: 'white', fontSize: '24px', fontWeight: '900', padding: '8px 0', outline: 'none' }} 
                  />
               </div>
               <button 
                onClick={handleSendOffer}
                style={{ height: '52px', padding: '0 24px', borderRadius: '16px', background: 'var(--color-primary)', color: 'white', fontWeight: '900', border: 'none', cursor: 'pointer' }}
               >
                 SEND PROPOSAL
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Input ─────────────────────────────────────────────── */}
      <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowOfferForm(true)}
            style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <IndianRupee size={22} />
          </button>
          
          <div style={{ flex: 1, position: 'relative' }}>
             <input 
               type="text" 
               placeholder="Type a message..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
               style={{ width: '100%', height: '52px', borderRadius: '16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0 54px 0 20px', color: 'white', fontSize: '15px', outline: 'none' }}
             />
             <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              style={{ position: 'absolute', right: '6px', top: '6px', width: '40px', height: '40px', borderRadius: '12px', background: inputText.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
             >
                <Send size={18} fill="currentColor" />
             </button>
          </div>
          
          <button style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
