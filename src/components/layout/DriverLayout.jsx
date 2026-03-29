import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Wallet, User, ClipboardList, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ThemeToggle from '../common/ThemeToggle';

export default function DriverLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser({ id: null });
    navigate('/driver/login');
  };

  return (
    <div className="driver-layout">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="desktop-only side-nav driver-sidebar">
        <div className="driver-sidebar-brand">
          <h2>
            LoadLink<span style={{ color: 'var(--color-primary)' }}>.</span>
          </h2>
          <p>
            Driver Portal
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <SidebarItem to="/driver/home" icon={<Home size={20} />} label={t('nav.home')} />
          <SidebarItem to="/driver/network" icon={<BarChart3 size={20} />} label={t('nav.market')} />
          <SidebarItem to="/driver/bookings" icon={<ClipboardList size={20} />} label={t('nav.bookings')} />
          <SidebarItem to="/driver/wallet" icon={<Wallet size={20} />} label={t('nav.wallet')} />
          <SidebarItem to="/driver/profile" icon={<User size={20} />} label={t('nav.profile')} />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
          <div className="app-button-row" style={{ marginBottom: '16px' }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-block"
            style={{ justifyContent: 'flex-start', border: 'none' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div className="main-content driver-main">
        {/* Mobile-Only Glass Header */}
        <header className="mobile-only driver-mobile-header">
          <div className="driver-mobile-header-inner">
            <div className="driver-mobile-brand">
              <div className="driver-mobile-brand-copy">
                <h2>
                  LoadLink<span style={{ color: 'var(--color-primary)' }}>.</span>
                </h2>
                <p>Driver portal</p>
              </div>
            </div>

            <div className="driver-mobile-controls">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="driver-main-content">
          <Outlet />
        </main>

        {/* Mobile-Only Navigation */}
        <nav className="mobile-only driver-mobile-nav" aria-label="Driver navigation">
          <div className="driver-mobile-nav-shell">
            <div className="driver-mobile-nav-inner">
              <NavItem to="/driver/home" icon={<Home size={22} />} label={t('nav.home')} />
              <NavItem to="/driver/network" icon={<BarChart3 size={22} />} label={t('nav.market')} />
              <NavItem to="/driver/bookings" icon={<ClipboardList size={22} />} label={t('nav.bookings')} />
              <NavItem to="/driver/wallet" icon={<Wallet size={22} />} label={t('nav.wallet')} />
              <NavItem to="/driver/profile" icon={<User size={22} />} label={t('nav.profile')} />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className="sidebar-item"
      style={({ isActive }) => ({
        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
      })}
    >
      {icon}
      <span style={{ fontSize: '14px' }}>{label}</span>
    </NavLink>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `mobile-nav-item${isActive ? ' is-active' : ''}`}
      style={({ isActive }) => ({
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      })}
    >
      <span className="mobile-nav-icon">{icon}</span>
      <span className="mobile-nav-label">{label}</span>
    </NavLink>
  );
}
