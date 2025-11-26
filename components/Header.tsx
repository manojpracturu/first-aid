import React from 'react';

interface HeaderProps {
  title: string;
  showLogout?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showLogout, onLogout }) => {
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 h-14 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span className="material-symbols-rounded text-red-600">health_and_safety</span>
        {title}
      </h1>
      {showLogout && (
        <button onClick={onLogout} className="text-gray-500 hover:text-red-600 transition-colors">
          <span className="material-symbols-rounded">logout</span>
        </button>
      )}
    </div>
  );
};

export default Header;