import { NavLink, Outlet } from 'react-router-dom';
import { Home, BarChart3, Wallet, User, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';

export default function DriverLayout() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Premium Glass Header */}
      <header style={{ 
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(15px)',
        color: 'white', 
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h2 style={{ margin: 0, fontWeight: '900', fontSize: '20px', letterSpacing: '-1px' }}>
          LoadLink<span style={{ color: 'var(--color-primary)' }}>.</span>
        </h2>
        <LanguageSwitcher />
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '90px' }}>
        <Outlet />
      </main>

      {/* Modern Floating Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(17, 24, 39, 0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0 24px', 
        zIndex: 1000
      }}>
        <NavItem to="/driver/home" icon={<Home size={22} />} label={t('nav.home')} />
        <NavItem to="/driver/network" icon={<BarChart3 size={22} />} label={t('nav.market')} />
        <NavItem to="/driver/bookings" icon={<ClipboardList size={22} />} label={t('nav.bookings')} />
        <NavItem to="/driver/wallet" icon={<Wallet size={22} />} label={t('nav.wallet')} />
        <NavItem to="/driver/profile" icon={<User size={22} />} label={t('nav.profile')} />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        textDecoration: 'none'
      })}
    >
      {icon}
      <span style={{ fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>{label}</span>
    </NavLink>
  );
}
