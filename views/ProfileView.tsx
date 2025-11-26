import React, { useState, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { updateUserProfile, getChatHistory } from '../services/dbService';
import { t, SUPPORTED_LANGUAGES } from '../constants';
import ReactMarkdown from 'react-markdown';

interface ProfileViewProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  const [msg, setMsg] = useState('');
  
  // Use user.language or default to English if undefined
  const currentLang = user.language || 'en-US';

  // Location State
  const [location, setLocation] = useState<{lat: number, long: number} | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  // History State
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocation();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const data = await getChatHistory(user.uid);
    setHistory(data);
  };

  const fetchLocation = () => {
    setLocLoading(true);
    setLocError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            long: position.coords.longitude
          });
          setLocLoading(false);
        },
        (error) => {
          console.error(error);
          setLocError('Unable to retrieve location.');
          setLocLoading(false);
        }
      );
    } else {
      setLocError('Geolocation not supported.');
      setLocLoading(false);
    }
  };

  const handleSave = async () => {
    setMsg('Saving...');
    await updateUserProfile(user.uid, formData);
    setUser(formData);
    setIsEditing(false);
    setMsg('Profile Updated!');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const updatedUser = { ...user, language: newLang };
    setUser(updatedUser);
    setFormData(updatedUser);
    await updateUserProfile(user.uid, { language: newLang });
  };

  // Filter history to show only user questions initially
  const userQuestions = history.filter(h => h.role === 'user').reverse();

  // Helper to get the AI response for a specific user message
  const getResponseFor = (msgId: string) => {
    const index = history.findIndex(h => h.id === msgId);
    if (index !== -1 && index + 1 < history.length && history[index+1].role === 'model') {
      return history[index+1];
    }
    return null;
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in bg-gray-50 min-h-[calc(100vh-112px)]">
      
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-red-50 p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-3">
             <span className="material-symbols-rounded text-4xl text-red-500">person</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{formData.displayName}</h2>
          <p className="text-sm text-gray-500">{formData.email}</p>
        </div>

        <div className="p-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">{t('medicalId', currentLang)}</h3>
             <button 
               onClick={() => isEditing ? handleSave() : setIsEditing(true)}
               className={`text-sm font-medium px-3 py-1 rounded-full ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
             >
               {isEditing ? t('save', currentLang) : t('edit', currentLang)}
             </button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">{t('blood', currentLang)}</label>
               {isEditing ? (
                 <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full mt-1 border-b border-gray-300 py-1 focus:border-red-500 outline-none" />
               ) : (
                 <p className="text-gray-900 font-medium">{user.bloodGroup}</p>
               )}
             </div>

             <div>
               <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">{t('medicalCond', currentLang)}</label>
               {isEditing ? (
                 <textarea name="healthIssues" value={formData.healthIssues} onChange={handleChange} className="w-full mt-1 border border-gray-300 rounded p-2 focus:border-red-500 outline-none text-sm" rows={2}/>
               ) : (
                 <p className="text-gray-900 font-medium">{user.healthIssues}</p>
               )}
             </div>

             <div>
               <label className="text-xs uppercase text-gray-400 font-semibold tracking-wider">{t('contact', currentLang)}</label>
               {isEditing ? (
                 <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="w-full mt-1 border-b border-gray-300 py-1 focus:border-red-500 outline-none" />
               ) : (
                 <p className="text-gray-900 font-medium">{user.emergencyContact}</p>
               )}
             </div>
           </div>
           
           {msg && <p className="text-center text-green-600 text-sm mt-4">{msg}</p>}
        </div>
      </div>

      {/* Chat History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
           <span className="material-symbols-rounded text-red-500">history</span>
           {t('chatHistory', currentLang)}
         </h3>
         
         <div className="space-y-3">
            {userQuestions.length === 0 ? (
               <p className="text-gray-400 text-sm text-center py-4">{t('noHistory', currentLang)}</p>
            ) : (
              userQuestions.slice(0, 5).map(q => {
                const response = getResponseFor(q.id);
                const isExpanded = expandedMsgId === q.id;
                
                return (
                  <div key={q.id} className="border border-gray-100 rounded-lg overflow-hidden transition-all">
                    <button 
                      onClick={() => setExpandedMsgId(isExpanded ? null : q.id)}
                      className="w-full text-left p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="material-symbols-rounded text-gray-400 text-xl flex-shrink-0">chat_bubble</span>
                        <div className="truncate">
                           <p className="text-xs text-gray-400 mb-0.5">{new Date(q.timestamp).toLocaleDateString()}</p>
                           <p className="text-sm font-medium text-gray-800 truncate">{q.text}</p>
                        </div>
                      </div>
                      <span className={`material-symbols-rounded text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    
                    {isExpanded && response && (
                       <div className="p-3 bg-white border-t border-gray-100 text-sm text-gray-600">
                          <div className="markdown-body prose prose-sm max-w-none text-inherit prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                            <ReactMarkdown>
                              {response.text}
                            </ReactMarkdown>
                          </div>
                       </div>
                    )}
                  </div>
                );
              })
            )}
            {userQuestions.length > 5 && (
              <p className="text-center text-xs text-gray-400 pt-2">Showing last 5 interactions</p>
            )}
         </div>
      </div>

      {/* Location Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">{t('currentLoc', currentLang)}</h3>
             <button 
               onClick={fetchLocation}
               disabled={locLoading}
               className="text-sm font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 transition-colors disabled:opacity-50"
             >
               <span className={`material-symbols-rounded text-base ${locLoading ? 'animate-spin' : ''}`}>
                 {locLoading ? 'refresh' : 'my_location'}
               </span>
               {locLoading ? t('updating', currentLang) : t('update', currentLang)}
             </button>
         </div>
         
         {locError ? (
           <p className="text-red-500 text-sm flex items-center gap-1">
             <span className="material-symbols-rounded text-sm">warning</span>
             {locError}
           </p>
         ) : location ? (
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
               <span className="text-xs text-gray-500 block mb-1">Lat</span>
               <span className="font-mono font-medium text-gray-800">{location.lat.toFixed(6)}</span>
             </div>
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
               <span className="text-xs text-gray-500 block mb-1">Long</span>
               <span className="font-mono font-medium text-gray-800">{location.long.toFixed(6)}</span>
             </div>
           </div>
         ) : (
           <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100 border-dashed">
             <p className="text-gray-500 text-sm">Location not available</p>
           </div>
         )}
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-bold text-gray-700 mb-4">{t('settings', currentLang)}</h3>
        <ul className="space-y-3">
          <li className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">{t('language', currentLang)}</span>
            <select 
              value={currentLang} 
              onChange={handleLanguageChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </li>
          <li className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">Location Services</span>
            <span className="text-green-600 font-medium">On</span>
          </li>
          <li className="flex justify-between items-center py-2">
            <span className="text-gray-600">{t('privacy', currentLang)}</span>
            <span className="material-symbols-rounded text-gray-400 text-sm">arrow_forward_ios</span>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default ProfileView;