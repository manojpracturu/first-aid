import React, { useState } from 'react';
import { UserProfile } from '../types';
import { BLOOD_GROUPS, SUPPORTED_LANGUAGES, t } from '../constants';
import { saveUserProfile } from '../services/dbService';

interface AuthViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authLang, setAuthLang] = useState('en-US'); // Local state for pre-login language
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mobile, setMobile] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [healthIssues, setHealthIssues] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const mockUid = email.replace(/[^a-zA-Z0-9]/g, '');
      
      const userProfile: UserProfile = {
        uid: mockUid,
        email,
        displayName: isSignUp ? displayName : (displayName || "User"),
        mobile: isSignUp ? mobile : (mobile || "000-000-0000"),
        emergencyContact: isSignUp ? emergencyContact : (emergencyContact || "000-000-0000"),
        bloodGroup: isSignUp ? bloodGroup : (bloodGroup || "Unknown"),
        healthIssues: isSignUp ? healthIssues : (healthIssues || "None"),
        language: authLang // Save the selected language on signup
      };

      if (isSignUp) {
        await saveUserProfile(userProfile);
      }
      
      setTimeout(() => {
        onLoginSuccess(userProfile);
        setIsLoading(false);
      }, 800);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 relative">
      <div className="absolute top-4 right-4">
        <select 
          value={authLang} 
          onChange={(e) => setAuthLang(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg p-2"
        >
           {SUPPORTED_LANGUAGES.map(lang => (
             <option key={lang.code} value={lang.code}>{lang.name}</option>
           ))}
        </select>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-rounded text-4xl text-red-600">local_hospital</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">{t('appTitle', authLang)}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSignUp ? t('createAccount', authLang) : t('signIn', authLang)}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input required type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <input required type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('contact', authLang)}</label>
                  <input required type="tel" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('blood', authLang)}</label>
                        <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm">
                            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Health Issues</label>
                  <textarea rows={2} value={healthIssues} onChange={e => setHealthIssues(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" placeholder="e.g. Diabetes, Penicillin allergy" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors"
              >
                {isLoading ? 'Processing...' : (isSignUp ? t('createAccount', authLang) : t('signIn', authLang))}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isSignUp ? 'Already have an account?' : 'New to LifeGuard AI?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                {isSignUp ? t('signIn', authLang) : t('createAccount', authLang)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;