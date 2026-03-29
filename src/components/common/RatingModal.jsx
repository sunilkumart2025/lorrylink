import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    await onSubmit({ rating, comment });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="mac-dialog-backdrop" onClick={onClose}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="mac-dialog"
            onClick={(event) => event.stopPropagation()}
            style={{ textAlign: 'center' }}
          >
            {!submitted ? (
              <>
                <div className="mac-dialog-controls">
                  <div className="mac-window-controls" aria-hidden="true">
                    <span className="mac-window-control is-red" />
                    <span className="mac-window-control is-yellow" />
                    <span className="mac-window-control is-green" />
                  </div>
                  <button onClick={onClose} className="app-close" aria-label="Close rating">
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ backgroundColor: 'rgba(29, 233, 182, 0.12)', width: '64px', height: '64px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1px solid rgba(29, 233, 182, 0.18)' }}>
                    <Star size={32} color="var(--color-primary)" fill="var(--color-primary)" />
                  </div>
                  <div className="mac-window-eyebrow" style={{ justifyContent: 'center', marginBottom: '8px' }}>Trip feedback</div>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)' }}>Rate this Shipment</h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>How was your experience with this delivery?</p>
                </div>

                <div className="mac-dialog-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                    >
                      <Star 
                        size={32} 
                        color={star <= (hover || rating) ? 'var(--color-warning)' : 'rgba(148, 163, 184, 0.4)'} 
                        fill={star <= (hover || rating) ? 'var(--color-warning)' : 'none'}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  ))}
                </div>

                <div className="mac-dialog-textarea-wrap">
                  <MessageSquare size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--color-text-muted)' }} />
                  <textarea
                    placeholder="Add a comment (Optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mac-dialog-textarea"
                  />
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="trip-action-button is-primary"
                  style={{ width: '100%', minHeight: '52px', opacity: rating === 0 ? 0.5 : 1 }}
                >
                  SUBMIT REVIEW <Send size={16} style={{ marginLeft: '8px' }} />
                </button>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '20px' }}
              >
                <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '10px' }}>Feedback Received!</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Thank you for helping us maintain high standards.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
