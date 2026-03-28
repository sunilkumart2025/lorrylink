import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadBookingProof } from '../../lib/db/bookings';

/**
 * ProofUploadSheet Component
 * Handles the pickup (loading) and drop-off (delivery) photo verification flow.
 */
export default function ProofUploadSheet({ booking, type, user, isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size too large. Please select an image under 5MB.');
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadBookingProof(booking.id, type, file, user.id);
      
      // Mock Auto-Approve (for demo purposes)
      setTimeout(async () => {
        const { supabase } = await import('../../lib/supabase');
        await supabase
          .from('bookings')
          .update({ [type === 'loading' ? 'loading_proof_status' : 'delivery_proof_status']: 'verified' })
          .eq('id', booking.id);
      }, 5000);

      onSuccess?.();
      onClose();
      // Reset state for next use
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-sheet-overlay">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="app-sheet-backdrop" 
        onClick={() => !uploading && onClose()} 
      />
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="app-sheet"
        style={{ maxWidth: '600px', margin: 'auto auto 0' }}
      >
        <div className="app-sheet-handle" />
        
        <div className="app-sheet-header">
          <div>
            <h3 className="app-sheet-title">
              {type === 'loading' ? 'Capture Pickup Proof' : 'Capture Delivery Proof'}
            </h3>
            <p className="app-page-subtitle">
              {type === 'loading' 
                ? 'Document the load before departure' 
                : 'Document the safe delivery of freight'}
            </p>
          </div>
          {!uploading && (
            <button onClick={onClose} className="app-close">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="app-stacked-list" style={{ paddingBottom: '20px' }}>
          {!preview ? (
            <div className="app-upload-tile" style={{ minHeight: '240px', position: 'relative' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '22px', 
                  background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                  <Camera size={32} />
                </div>
                <div className="app-list-title">Camera Access Required</div>
                <div className="app-list-subtitle" style={{ maxWidth: '240px', margin: '8px auto 0' }}>
                  Please take a clear, well-lit photo of the loaded truck or cargo.
                </div>
                
                <label className="app-button is-primary" style={{ marginTop: '24px', cursor: 'pointer' }}>
                  <Camera size={16} /> Open Camera
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div className="card-glass" style={{ 
                overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)' 
              }}>
                <img 
                  src={preview} 
                  alt="Proof Preview" 
                  style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', display: 'block' }} 
                />
              </div>
              {!uploading && (
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  style={{ 
                    position: 'absolute', top: '12px', right: '12px', 
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '12px', 
                    padding: '8px', color: 'white', backdropFilter: 'blur(4px)' 
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                marginTop: '16px', padding: '12px 16px', borderRadius: '14px', 
                background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700'
              }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button 
              disabled={!file || uploading} 
              onClick={handleUpload}
              className={`app-button is-primary is-block ${uploading ? 'loading' : ''}`}
              style={{ 
                minHeight: '56px', fontSize: '15px', fontWeight: '900',
                opacity: (!file || uploading) ? 0.6 : 1
              }}
            >
              {uploading ? (
                <>
                  <Clock size={18} className="animate-spin" />
                  UPLOADING SECURELY...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  SUBMIT FOR VERIFICATION
                </>
              )}
            </button>
            <p style={{ 
              textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', 
              marginTop: '14px', fontWeight: '700', letterSpacing: '0.05em' 
            }}>
              BY SUBMITTING, YOU CONFIRM THE CARGO IS READY FOR TRANSIT
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
