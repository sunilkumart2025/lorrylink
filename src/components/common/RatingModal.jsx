import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function RatingModal({ isOpen, onClose, onSubmit, bookingId }) {
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
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="card-glass"
            style={{ 
              maxWidth: '400px', 
              width: '100%', 
              textAlign: 'center',
              padding: '30px',
              position: 'relative',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {!submitted ? (
              <>
                <button 
                  onClick={onClose}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ backgroundColor: 'rgba(29, 233, 182, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                    <Star size={32} color="var(--color-primary)" fill="var(--color-primary)" />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>Rate this Shipment</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>How was your experience with this delivery?</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
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
                        color={star <= (hover || rating) ? 'var(--color-warning)' : 'rgba(255,255,255,0.2)'} 
                        fill={star <= (hover || rating) ? 'var(--color-warning)' : 'none'}
                        transition={{ duration: 0.2 }}
                      />
                    </motion.button>
                  ))}
                </div>

                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <MessageSquare size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
                  <textarea
                    placeholder="Add a comment (Optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '10px 10px 10px 36px',
                      color: 'white',
                      fontSize: '14px',
                      resize: 'none',
                      outline: 'none'
                    }}
                  />
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="btn btn-primary btn-block"
                  style={{ height: '52px', opacity: rating === 0 ? 0.5 : 1 }}
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
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>Feedback Received!</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Thank you for helping us maintain high standards.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
