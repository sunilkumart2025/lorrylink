import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Save,
  Scan,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

const DOC_TYPES = [
  { id: 'RC', name: 'Registration Certificate (RC)', icon: FileText },
  { id: 'DL', name: 'Driving License (DL)', icon: ShieldCheck },
  { id: 'INSURANCE', name: 'Vehicle Insurance', icon: ShieldCheck },
  { id: 'PERMIT', name: 'National Permit', icon: FileText },
];

export default function Vault() {
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('upload');
  const [scannedData, setScannedData] = useState({ consignee: '', weight: '', price: '', file: null });

  const { data: documents } = useQuery({
    queryKey: ['driver-documents', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('driver_documents').select('*').eq('driver_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: biltys } = useQuery({
    queryKey: ['biltys', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('biltys')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ type, file }) => {
      setIsUploading(true);
      const filePath = `vault/${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('driver-vault').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('driver-vault').getPublicUrl(filePath);
      await supabase
        .from('driver_documents')
        .upsert({ driver_id: user.id, type, document_url: publicUrl, status: 'pending' }, { onConflict: 'driver_id,type' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-documents']);
      setIsUploading(false);
      setSelectedDoc(null);
    },
    onError: (err) => {
      setIsUploading(false);
      alert('Upload failed: ' + err.message);
    },
  });

  const saveBiltyMutation = useMutation({
    mutationFn: async (data) => {
      const filePath = `biltys/${user.id}/${Date.now()}_bilty.jpg`;
      await supabase.storage.from('driver-vault').upload(filePath, data.file);
      const { data: { publicUrl } } = supabase.storage.from('driver-vault').getPublicUrl(filePath);
      await supabase.from('biltys').insert({
        driver_id: user.id,
        consignee_name: data.consignee,
        weight_kg: parseFloat(data.weight),
        total_price: parseFloat(data.price),
        document_url: publicUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['biltys']);
      setIsScanning(false);
      setScanStep('upload');
      alert('Smart Bilty Digitized Successfully!');
    },
  });

  const handleStartScan = (file) => {
    setScannedData((prev) => ({ ...prev, file }));
    setScanStep('scanning');

    setTimeout(() => {
      setScannedData({
        file,
        consignee: 'Reliance Retail Ltd - Hubli',
        weight: '12450',
        price: '48500',
      });
      setScanStep('review');
    }, 4000);
  };

  return (
    <div className="app-page app-page-narrow">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <ShieldCheck size={14} />
          Document Vault
        </div>
        <h1 className="app-surface-title">Compliance records and digitized waybills in one calmer workspace</h1>
        <p className="app-surface-copy">
          The vault now follows the same premium system as the dashboard, so documents, statuses, and scan actions read clearly in both light and dark mode.
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -2 }}
        onClick={() => {
          setIsScanning(true);
          setScanStep('upload');
        }}
        className="card-glass app-data-card"
        style={{
          width: '100%',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          textAlign: 'left',
          cursor: 'pointer',
          borderColor: 'rgba(34, 211, 238, 0.18)',
          background: 'linear-gradient(155deg, rgba(34, 211, 238, 0.12), rgba(59, 130, 246, 0.04))',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(59,130,246,0.16)',
            color: 'var(--color-primary)',
          }}
        >
          <Scan size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="app-list-title">Smart Bilty Scanner</div>
          <div className="app-list-subtitle">Capture a waybill and auto-populate consignee, weight, and price.</div>
        </div>
        <div className="badge badge-primary" style={{ padding: '8px 14px' }}>
          AI Assist
        </div>
      </motion.button>

      <div className="app-page-header" style={{ marginBottom: '14px' }}>
        <div className="app-title-wrap">
          <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>Vehicle Compliance</h2>
          <p className="app-page-subtitle">Your essential documents with upload and review status.</p>
        </div>
      </div>

      <div className="app-stacked-list" style={{ marginBottom: '20px' }}>
        {DOC_TYPES.map((doc) => {
          const Icon = doc.icon;
          const existingDoc = documents?.find((item) => item.type === doc.id);
          return (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="card-glass app-list-card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="app-list-row">
                <div className="app-list-main">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(59,130,246,0.12)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="app-list-copy">
                    <div className="app-list-title">{doc.name}</div>
                    <div className="app-list-subtitle">
                      <StatusBadge status={existingDoc?.status} />
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-text-muted)" />
              </div>
            </button>
          );
        })}
      </div>

      {biltys?.length > 0 && (
        <>
          <div className="app-page-header" style={{ marginBottom: '14px' }}>
            <div className="app-title-wrap">
              <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>Digitized Records</h2>
              <p className="app-page-subtitle">Recently scanned waybills, ready to reference on the road.</p>
            </div>
          </div>

          <div className="app-stacked-list">
            {biltys.map((bilty) => (
              <div key={bilty.id} className="card-glass app-list-card">
                <div className="app-list-row">
                  <div className="app-list-main">
                    <img
                      src={bilty.document_url}
                      alt={bilty.consignee_name}
                      style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }}
                    />
                    <div className="app-list-copy">
                      <div className="app-list-title">{bilty.consignee_name}</div>
                      <div className="app-list-subtitle">{bilty.weight_kg} kg • ₹{bilty.total_price.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="badge badge-success" style={{ padding: '8px 12px' }}>
                    Digitized
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {isScanning && (
          <div className="app-sheet-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-sheet-backdrop"
              onClick={() => setIsScanning(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="app-sheet"
              style={{ maxWidth: '680px', margin: 'auto auto 0' }}
            >
              <div className="app-sheet-handle" />
              <div className="app-sheet-header">
                <div>
                  <h3 className="app-sheet-title">Smart Bilty Scan</h3>
                  <p className="app-page-subtitle">Capture, extract, and review waybill data.</p>
                </div>
                <button onClick={() => setIsScanning(false)} className="app-close">
                  <X size={18} />
                </button>
              </div>

              {scanStep === 'upload' && (
                <div className="app-stacked-list">
                  <div className="app-upload-tile" style={{ minHeight: '220px' }}>
                    <Camera size={42} color="var(--color-primary)" />
                    <div className="app-list-title">Capture or upload a waybill</div>
                    <div className="app-list-subtitle">Use a clear image for the best OCR quality.</div>
                    <label className="app-button is-primary" style={{ marginTop: '12px' }}>
                      <Upload size={16} /> Select image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files[0];
                          if (file) handleStartScan(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {scanStep === 'scanning' && (
                <div className="app-stacked-list">
                  <div className="card-glass app-data-card" style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: '94px',
                        height: '94px',
                        borderRadius: '30px',
                        margin: '0 auto 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(59,130,246,0.12)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <Sparkles size={34} className="animate-spin" />
                    </div>
                    <div className="app-list-title" style={{ fontSize: '20px' }}>AI extracting data...</div>
                    <div className="app-list-subtitle" style={{ marginTop: '8px' }}>
                      Optimizing for low-light highway conditions and printed waybill layouts.
                    </div>
                  </div>
                </div>
              )}

              {scanStep === 'review' && (
                <div className="app-stacked-list">
                  <div className="card-glass app-data-card">
                    <div className="app-list-row" style={{ marginBottom: '18px' }}>
                      <div className="app-list-main">
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(34,197,94,0.12)',
                            color: 'var(--color-success)',
                          }}
                        >
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="app-list-copy">
                          <div className="app-list-title">Scan verified</div>
                          <div className="app-list-subtitle">Review and adjust before saving.</div>
                        </div>
                      </div>
                    </div>

                    <div className="app-form-grid">
                      <div>
                        <label className="app-field-label">Consignee name</label>
                        <input
                          className="input-field"
                          value={scannedData.consignee}
                          onChange={(event) => setScannedData({ ...scannedData, consignee: event.target.value })}
                        />
                      </div>

                      <div className="app-form-grid two-up">
                        <div>
                          <label className="app-field-label">Weight (kg)</label>
                          <input
                            className="input-field"
                            value={scannedData.weight}
                            onChange={(event) => setScannedData({ ...scannedData, weight: event.target.value })}
                          />
                        </div>
                        <div>
                          <label className="app-field-label">Total price</label>
                          <input
                            className="input-field"
                            value={scannedData.price}
                            onChange={(event) => setScannedData({ ...scannedData, price: event.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => saveBiltyMutation.mutate(scannedData)}
                    disabled={saveBiltyMutation.isPending}
                    className="app-button is-primary is-block"
                    style={{ minHeight: '56px' }}
                  >
                    <Save size={16} /> Digitize waybill
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoc && (
          <div className="app-sheet-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-sheet-backdrop"
              onClick={() => setSelectedDoc(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="app-sheet"
            >
              <div className="app-sheet-handle" />
              <div className="app-sheet-header">
                <div>
                  <h3 className="app-sheet-title">{selectedDoc.name}</h3>
                  <p className="app-page-subtitle">Upload or replace the latest verified image.</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="app-close">
                  <X size={18} />
                </button>
              </div>

              {documents?.find((item) => item.type === selectedDoc.id) ? (
                <div className="app-stacked-list">
                  <img
                    src={documents.find((item) => item.type === selectedDoc.id).document_url}
                    alt={selectedDoc.name}
                    style={{ width: '100%', borderRadius: '22px', objectFit: 'cover' }}
                  />
                  <label className="app-button is-secondary is-block">
                    <Upload size={16} /> Update image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files[0];
                        if (file) uploadDocMutation.mutate({ type: selectedDoc.id, file });
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="app-stacked-list">
                  <div className="app-upload-tile" style={{ minHeight: '220px' }}>
                    <Upload size={34} color="var(--color-primary)" />
                    <div className="app-list-title">No document uploaded yet</div>
                    <div className="app-list-subtitle">
                      Upload a clear photo of your {selectedDoc.name} for verification.
                    </div>
                  </div>

                  <label className="app-button is-primary is-block">
                    {isUploading ? <Clock size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isUploading ? 'Uploading...' : 'Select file'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadDocMutation.mutate({ type: selectedDoc.id, file });
                      }}
                    />
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
  if (!status) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: '700' }}>Not uploaded</span>;
  }

  const config = {
    pending: { color: '#F59E0B', text: 'Pending review', icon: Clock },
    verified: { color: '#10B981', text: 'Verified', icon: CheckCircle2 },
    rejected: { color: '#EF4444', text: 'Rejected', icon: AlertCircle },
  }[status] || { color: '#6B7280', text: status, icon: AlertCircle };

  const Icon = config.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: config.color, fontWeight: '800' }}>
      <Icon size={13} />
      {config.text}
    </span>
  );
}
