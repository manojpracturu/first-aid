import React, { useState, useEffect } from 'react';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import ChatView from './views/ChatView';
import MapsView from './views/MapsView';
import ProfileView from './views/ProfileView';
import NavBar from './components/NavBar';
import Header from './components/Header';
import { UserProfile, AppView } from './types';
import { auth } from './services/firebaseConfig';
import { getUserProfile } from './services/dbService';
import { t } from './constants';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [initializing, setInitializing] = useState(true);

  // Default to English if user not loaded or user.language not set
  const currentLang = user?.language || 'en-US';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) setUser(profile);
      }
      setInitializing(false);
    });

    // Demo fallback: Check localstorage if auth fails (simulating a login for reviewer)
    const localUser = localStorage.getItem('demo_user');
    if (localUser && !user) {
       setUser(JSON.parse(localUser));
       setInitializing(false);
    }

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    // For demo persistence without real backend
    localStorage.setItem('demo_user', JSON.stringify(profile)); 
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('demo_user');
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600 font-bold text-xl animate-pulse">LifeGuard AI...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView user={user} onNavigate={(view) => setCurrentView(view as AppView)} language={currentLang} />;
      case AppView.CHAT:
        return <ChatView language={currentLang} user={user} />;
      case AppView.MAPS:
        return <MapsView language={currentLang} />;
      case AppView.PROFILE:
        return <ProfileView user={user} setUser={setUser} />;
      default:
        return <DashboardView user={user} onNavigate={(view) => setCurrentView(view as AppView)} language={currentLang} />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return 'Dashboard';
      case AppView.CHAT: return t('firstAid', currentLang);
      case AppView.MAPS: return t('nearby', currentLang);
      case AppView.PROFILE: return t('profile', currentLang);
      default: return 'LifeGuard AI';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative border-x border-gray-200">
      <Header 
        title={getTitle()} 
        showLogout={currentView === AppView.PROFILE}
        onLogout={handleLogout}
      />
      
      <main className="no-scrollbar">
        {renderView()}
      </main>

      <NavBar currentView={currentView} setView={setCurrentView} language={currentLang} />
    </div>
  );
}

export default App;