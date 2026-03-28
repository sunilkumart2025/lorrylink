import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, FileText, Upload, AlertCircle, 
  CheckCircle2, Clock, X, Eye, ChevronRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

const DOC_TYPES = [
  { id: 'RC', name: 'Registration Certificate (RC)', icon: <FileText size={20} /> },
  { id: 'DL', name: 'Driving License (DL)', icon: <ShieldCheck size={20} /> },
  { id: 'INSURANCE', name: 'Vehicle Insurance', icon: <ShieldCheck size={20} /> },
  { id: 'PERMIT', name: 'National Permit', icon: <FileText size={20} /> },
];

export default function Vault() {
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['driver-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ type, file }) => {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      const filePath = `vault/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('driver-vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-vault')
        .getPublicUrl(filePath);

      // 3. Upsert into Table
      const { error: dbError } = await supabase
        .from('driver_documents')
        .upsert({
          driver_id: user.id,
          type,
          document_url: publicUrl,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, { onConflict: 'driver_id,type' });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-documents']);
      setIsUploading(false);
      alert('Document uploaded successfully for verification!');
    },
    onError: (err) => {
      setIsUploading(false);
      alert('Upload failed: ' + err.message);
    }
  });

  const getDocStatus = (type) => {
    return documents?.find(d => d.type === type);
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>DIGITAL VAULT</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' }}>Secure Document Management</p>
      </header>

      {/* Security Banner */}
      <div style={{ 
        background: 'rgba(34,197,94,0.05)', 
        border: '1px solid rgba(34,197,94,0.2)', 
        borderRadius: '20px', padding: '20px', marginBottom: '32px',
        display: 'flex', gap: '16px', alignItems: 'center'
      }}>
        <div style={{ background: 'rgba(34,197,94,0.1)', padding: '10px', borderRadius: '12px' }}>
          <ShieldCheck size={24} color="#22C55E" />
        </div>
        <div>
          <h4 style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '800' }}>Encrypted Storage</h4>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '12px' }}>All documents are securely stored and only visible to authorized shippers during booking.</p>
        </div>
      </div>

      {/* Document Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {DOC_TYPES.map((doc) => {
          const status = getDocStatus(doc.id);
          return (
            <motion.div
              layout
              key={doc.id}
              whileHover={{ scale: 1.01 }}
              style={{
                background: 'var(--glass-bg)',
                borderRadius: '24px',
                border: `1px solid ${status?.status === 'verified' ? 'rgba(34,197,94,0.3)' : 'var(--glass-border)'}`,
                padding: '20px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => setSelectedDoc(doc)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    background: status?.status === 'verified' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
                    padding: '12px', borderRadius: '16px',
                    color: status?.status === 'verified' ? '#22C55E' : 'rgba(255,255,255,0.5)'
                  }}>
                    {doc.icon}
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '800' }}>{doc.name}</h3>
                    <StatusBadge status={status?.status} />
                  </div>
                </div>
                <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Upload/Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div style={{ 
            position: 'fixed', inset: 0, zIndex: 1000, 
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
          }}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              style={{ 
                width: '100%', maxWidth: '500px', background: '#0A0A0F', 
                borderTopLeftRadius: '32px', borderTopRightRadius: '32px', 
                padding: '32px 24px 60px', borderTop: '1px solid rgba(255,255,255,0.1)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{selectedDoc.name}</h3>
                <button onClick={() => setSelectedDoc(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              {getDocStatus(selectedDoc.id) ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <motion.img 
                      src={getDocStatus(selectedDoc.id).document_url} 
                      style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '16px' }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label className="btn btn-ghost" style={{ flex: 1, height: '56px', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                      <Upload size={18} /> Update
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) uploadMutation.mutate({ type: selectedDoc.id, file });
                      }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                   <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--color-primary)' }}>
                      <Upload size={32} />
                   </div>
                   <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No Document Uploaded</h4>
                   <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>Please upload a clear photo of your {selectedDoc.name} for verification.</p>
                   
                   <label className="btn btn-primary btn-block" style={{ height: '60px', borderRadius: '20px', position: 'relative' }}>
                      {isUploading ? <Clock className="animate-spin" size={20} /> : <><Upload size={20} /> Select File</>}
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate({ type: selectedDoc.id, file });
                      }} />
                   </label>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: '700' }}>Not Uploaded</span>;
  
  const config = {
    pending: { color: '#F59E0B', text: 'Pending Review', icon: <Clock size={12} /> },
    verified: { color: '#10B981', text: 'Verified', icon: <CheckCircle2 size={12} /> },
    rejected: { color: '#EF4444', text: 'Rejected', icon: <AlertCircle size={12} /> },
    expired: { color: '#6B7280', text: 'Expired', icon: <AlertCircle size={12} /> },
  }[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ color: config.color, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.text}</span>
    </div>
  );
}
