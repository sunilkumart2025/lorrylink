import React, { useState } from 'react';
import {
  IndianRupee,
  ArrowDownToLine,
  FileText,
  ChevronRight,
  Calendar,
  Download,
  X,
  TrendingUp,
  CreditCard,
  Target,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinancials } from '../../hooks/useFinancials';

export default function Wallet() {
  const { data: financials, isLoading, error } = useFinancials();
  const [showStatement, setShowStatement] = useState(false);
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);

  if (isLoading) return <div className="text-center p-xl">Calculating earnings...</div>;
  if (error) return <div className="text-center p-xl color-danger">Error: {error.message}</div>;

  const currentBalance = financials?.balance || 0;
  const transactions = financials?.transactions || [];

  const handleExportAll = () => {
    const rows = [
      ['Date', 'Type', 'Amount'],
      ...transactions.map((transaction) => [transaction.date, transaction.type, transaction.amount]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loadlink-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-page app-page-narrow">
      <header className="app-page-header">
        <div className="app-title-wrap">
          <h1 className="app-page-title">Link Wallet</h1>
          <p className="app-page-subtitle">A quieter financial view with balance, trends, payout access, and recent activity.</p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass"
        style={{
          padding: '34px 28px',
          borderRadius: '34px',
          background: 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-primary)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 'auto -32px -42px auto',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '11px', opacity: 0.72, fontWeight: '800', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Available to withdraw
          </span>
          <div style={{ marginTop: '10px', fontSize: '54px', fontWeight: '900', letterSpacing: '-0.08em' }}>
            ₹{currentBalance.toLocaleString()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={() => setShowPayoutInfo(true)}
              className="btn"
              style={{
                height: '58px',
                background: 'white',
                color: 'var(--color-primary-dark)',
                borderRadius: '18px',
                fontWeight: '900',
              }}
            >
              <ArrowDownToLine size={18} /> Withdraw
            </button>
            <button
              onClick={() => setShowStatement(true)}
              className="btn"
              style={{
                height: '58px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'white',
                borderRadius: '18px',
                fontWeight: '900',
              }}
            >
              <FileText size={18} /> Statement
            </button>
          </div>
        </div>
      </motion.div>

      <div className="app-stat-grid" style={{ marginBottom: '20px' }}>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} />
            <h3>Monthly trend</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '56px', marginTop: '12px' }}>
            {[30, 60, 45, 80, 55, 90, 70].map((height, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                style={{
                  flex: 1,
                  background: index === 5 ? 'var(--color-primary)' : 'rgba(59, 130, 246, 0.14)',
                  borderRadius: '999px',
                }}
              />
            ))}
          </div>
          <p>₹84.2K</p>
        </div>

        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} />
            <h3>Savings goal</h3>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(59,130,246,0.08)', borderRadius: '999px', marginTop: '18px' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--color-accent)', borderRadius: '999px' }} />
          </div>
          <p>65%</p>
        </div>

        <div className="card-glass app-metric-card">
          <div style={{ color: '#f6b84d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} />
            <h3>Premium perks</h3>
          </div>
          <p style={{ fontSize: '22px' }}>Active</p>
          <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Priority payouts and accidental insurance included.
          </div>
        </div>
      </div>

      <div className="card-glass" style={{ padding: '22px 24px', borderRadius: '30px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(59,130,246,0.08)',
              }}
            >
              <CreditCard size={22} color="var(--color-primary)" />
            </div>
            <div>
              <div className="home-card-kicker">Primary settlement account</div>
              <div style={{ marginTop: '6px', fontWeight: '800', fontSize: '16px', color: 'var(--color-text-primary)' }}>HDFC Bank State-0321</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--color-text-muted)" />
        </div>
      </div>

      <div className="app-page-header" style={{ marginBottom: '14px' }}>
        <div className="app-title-wrap">
          <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>Recent Activity</h2>
          <p className="app-page-subtitle">Incoming load payments and payouts.</p>
        </div>
        <button onClick={handleExportAll} className="ui-chip-button">Export all</button>
      </div>

      <div className="app-stacked-list">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="card-glass"
            style={{ padding: '16px 20px', borderRadius: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      transaction.type === 'Payout' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color: transaction.type === 'Payout' ? '#EF4444' : '#22C55E',
                  }}
                >
                  {transaction.type === 'Payout' ? <ArrowDownToLine size={18} /> : <IndianRupee size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    {transaction.type === 'Payout' ? 'Withdrawal' : 'Load payment'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{transaction.date}</div>
                </div>
              </div>
              <div
                style={{
                  fontWeight: '900',
                  fontSize: '16px',
                  color: transaction.type === 'Payout' ? 'var(--color-text-primary)' : 'var(--color-success)',
                }}
              >
                {transaction.type === 'Payout' ? '−' : '+'} ₹{transaction.amount.toLocaleString()}
              </div>
            </div>
          </motion.div>
        ))}

        {transactions.length === 0 && (
          <div className="card-glass app-empty-card">
            <p style={{ color: 'var(--color-text-muted)', fontWeight: '700' }}>No historical transactions yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPayoutInfo && (
          <div className="app-sheet-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-sheet-backdrop"
              onClick={() => setShowPayoutInfo(false)}
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
                  <h3 className="app-sheet-title">Payout Overview</h3>
                  <p className="app-page-subtitle">Review your linked settlement path before moving funds.</p>
                </div>
                <button onClick={() => setShowPayoutInfo(false)} className="app-close">
                  <X size={18} />
                </button>
              </div>

              <div className="app-stacked-list">
                <div className="card-glass app-data-card">
                  <div className="app-section-kicker">Available balance</div>
                  <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-0.08em', color: 'var(--color-text-primary)' }}>
                    ₹{currentBalance.toLocaleString()}
                  </div>
                  <div className="app-inline-stat-grid" style={{ marginTop: '18px' }}>
                    <div className="app-inline-stat">
                      <span>Settlement</span>
                      <strong>T+1</strong>
                    </div>
                    <div className="app-inline-stat">
                      <span>Account</span>
                      <strong style={{ fontSize: '18px' }}>0321</strong>
                    </div>
                    <div className="app-inline-stat">
                      <span>Status</span>
                      <strong style={{ fontSize: '18px', color: 'var(--color-success)' }}>Ready</strong>
                    </div>
                  </div>
                </div>

                <div className="app-note-surface">
                  <strong>Your payout flow remains unchanged.</strong> This panel gives a quieter review step for balance, account,
                  and export before you initiate settlement.
                </div>

                <div className="app-button-row">
                  <button onClick={handleExportAll} className="app-button is-secondary">
                    <Download size={16} /> Export ledger
                  </button>
                  <button onClick={() => setShowPayoutInfo(false)} className="app-button is-primary">
                    Close review
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatement && (
          <div className="app-sheet-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-sheet-backdrop"
              onClick={() => setShowStatement(false)}
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
                  <h3 className="app-sheet-title">Financial Summary</h3>
                  <p className="app-page-subtitle">Monthly breakdown and export.</p>
                </div>
                <button onClick={() => setShowStatement(false)} className="app-close">
                  <X size={18} />
                </button>
              </div>

              <div className="app-stacked-list">
                <div className="card-glass" style={{ padding: '24px', borderRadius: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <Calendar size={18} color="var(--color-primary)" />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>March 2026 Dashboard</span>
                  </div>
                  <SummaryRow label="Gross revenue" value="₹2,45,000" />
                  <SummaryRow label="GST & fees" value="- ₹4,900" danger />
                  <div style={{ height: '1px', background: 'var(--glass-border)', margin: '16px 0' }} />
                  <SummaryRow label="Net earnings" value="₹2,40,100" emphasis />
                </div>

                <button
                  onClick={() => {
                    handleExportAll();
                    setShowStatement(false);
                  }}
                  className="btn btn-primary btn-block"
                  style={{ height: '58px', borderRadius: '18px' }}
                >
                  <Download size={18} /> Export Fiscal Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ label, value, danger, emphasis }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '12px' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{label}</span>
      <span
        style={{
          color: emphasis ? 'var(--color-success)' : danger ? 'var(--color-error)' : 'var(--color-text-primary)',
          fontWeight: '800',
          fontSize: emphasis ? '18px' : '14px',
        }}
      >
        {value}
      </span>
    </div>
  );
}
