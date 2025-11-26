import React from 'react';
import { AppView } from '../types';
import { t } from '../constants';

interface NavBarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  language?: string;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, setView, language = 'en-US' }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: 'home', label: t('home', language) },
    { view: AppView.CHAT, icon: 'medical_services', label: t('firstAid', language) },
    { view: AppView.MAPS, icon: 'near_me', label: t('nearby', language) },
    { view: AppView.PROFILE, icon: 'person', label: t('profile', language) },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === item.view ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className={`material-symbols-rounded text-2xl mb-0.5 ${currentView === item.view ? 'filled' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavBar;