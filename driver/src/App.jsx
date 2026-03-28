import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import LanguageSelector from './pages/driver/LanguageSelector';
import Login from './pages/driver/Login';
import DriverLayout from './components/layout/DriverLayout';
import Home from './pages/driver/Home';
import PostEmptyTruck from './pages/driver/PostEmptyTruck';
import Matches from './pages/driver/Matches';
import Wallet from './pages/driver/Wallet';
import ComboTrips from './pages/driver/ComboTrips';
import Profile from './pages/driver/Profile';
import History from './pages/driver/History';
import MarketInsights from './pages/driver/MarketInsights';
import Bookings from './pages/driver/Bookings';
import Subscription from './pages/driver/Subscription';
import PostLoad from './pages/shipper/PostLoad';
import ShipperDashboard from './pages/shipper/Dashboard';
import DetourCalculator from './pages/driver/DetourCalculator';
import ChatWidget from './chatbot/ChatWidget';
import LiveNavigation from './pages/driver/LiveNavigation';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useLocationBroadcast } from './hooks/useLocationBroadcast';
import Vault from './pages/driver/Vault';


import { useAuth } from './hooks/useAuth';

function App() {
  const { i18n } = useTranslation();
  const { language, theme } = useStore();
  // Initialize Global Auth & Session Sync
  useAuth();
  useLocationBroadcast();
  
  // Initialize Push Notifications listener globally
  usePushNotifications();

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const currentTheme = theme || 'dark';
    
    root.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
    }
  }, [theme]);

  return  (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Driver Interface */}
        <Route path="/driver/lang" element={<LanguageSelector />} />
        <Route path="/driver/login" element={<Login />} />
        <Route path="/driver" element={<DriverLayout />}>
          <Route path="home" element={<Home />} />
          <Route path="post-truck" element={<PostEmptyTruck />} />
          <Route path="matches" element={<Matches />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="combo" element={<ComboTrips />} />
          <Route path="detour" element={<DetourCalculator />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="history" element={<History />} />
          <Route path="vault" element={<Vault />} />
          <Route path="network" element={<MarketInsights />} />
        </Route>

        {/* Full-screen navigation (outside layout) */}
        <Route path="/driver/navigate" element={<LiveNavigation />} />

        {/* Shipper Interface */}
        <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
        <Route path="/shipper/post" element={<PostLoad />} />
      </Routes>
      
      {/* Global AI Assistant (Pillar 5.0) */}
      <ChatWidget />
    </div>
  );
}

export default App;
