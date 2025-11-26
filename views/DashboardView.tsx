
import React from 'react';
import { EMERGENCY_NUMBERS, t } from '../constants';
import { UserProfile } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  onNavigate: (view: any) => void;
  language?: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate, language = 'en-US' }) => {
  
  const handleCall = (number: string, label: string) => {
    // In a real mobile environment, this opens the dialer
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">{t('welcome', language)}, {user.displayName}</h2>
        <p className="text-gray-300 text-sm mt-1">
          {t('emergencyMode', language)}
        </p>
        
        {/* Vitals Row */}
        <div className="mt-4 flex gap-3">
          <div className="bg-white/10 rounded-lg p-2 text-center flex-1">
            <span className="block text-xs text-gray-400">{t('blood', language)}</span>
            <span className="font-bold text-red-400">{user.bloodGroup}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center flex-1">
             <span className="block text-xs text-gray-400">{t('contact', language)}</span>
             <a href={`tel:${user.emergencyContact}`} className="font-bold text-green-400 text-sm">{user.emergencyContact}</a>
          </div>
        </div>

        {/* Medical Conditions Row - Added to show saved profile data */}
        {user.healthIssues && user.healthIssues !== 'None' && (
           <div className="mt-3 pt-3 border-t border-white/10">
              <span className="block text-xs text-gray-400 mb-1">{t('medicalCond', language)}</span>
              <div className="flex items-start gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                 <span className="material-symbols-rounded text-red-400 text-base mt-0.5">medical_information</span>
                 <p className="text-gray-100 text-sm font-medium leading-tight">{user.healthIssues}</p>
              </div>
           </div>
        )}
      </div>

      {/* SOS Section */}
      <div>
        <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
           <span className="material-symbols-rounded text-red-600">emergency</span>
           {t('sosTitle', language)}
        </h3>
        <div className="grid grid-cols-2 gap-4">
           <button 
             onClick={() => handleCall(EMERGENCY_NUMBERS.AMBULANCE, 'Ambulance')}
             className="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-red-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 h-32"
           >
             <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
               <span className="material-symbols-rounded text-blue-600 text-2xl">ambulance</span>
             </div>
             <span className="font-bold text-gray-800">{t('ambulance', language)}</span>
             <span className="text-xs text-gray-500">{EMERGENCY_NUMBERS.AMBULANCE}</span>
           </button>

           <button 
             onClick={() => handleCall(EMERGENCY_NUMBERS.POLICE, 'Police')}
             className="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-red-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 h-32"
           >
             <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
               <span className="material-symbols-rounded text-indigo-600 text-2xl">local_police</span>
             </div>
             <span className="font-bold text-gray-800">{t('police', language)}</span>
             <span className="text-xs text-gray-500">{EMERGENCY_NUMBERS.POLICE}</span>
           </button>

           <button 
             onClick={() => handleCall(EMERGENCY_NUMBERS.FIRE, 'Fire')}
             className="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-red-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 h-32"
           >
             <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
               <span className="material-symbols-rounded text-orange-600 text-2xl">local_fire_department</span>
             </div>
             <span className="font-bold text-gray-800">{t('fire', language)}</span>
             <span className="text-xs text-gray-500">{EMERGENCY_NUMBERS.FIRE}</span>
           </button>

           <button 
             onClick={() => handleCall(user.emergencyContact, 'Family')}
             className="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-red-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 h-32"
           >
             <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
               <span className="material-symbols-rounded text-green-600 text-2xl">family_restroom</span>
             </div>
             <span className="font-bold text-gray-800">{t('family', language)}</span>
             <span className="text-xs text-gray-500">SOS</span>
           </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
         <h3 className="text-gray-900 font-bold mb-3">{t('quickAssist', language)}</h3>
         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="space-y-4">
               <div className="flex items-start gap-3 pb-4 border-b border-gray-100" onClick={() => onNavigate('CHAT')}>
                  <div className="bg-red-50 p-2 rounded-lg">
                    <span className="material-symbols-rounded text-red-500">medical_mask</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('firstAidTitle', language)}</h4>
                    <p className="text-sm text-gray-500">{t('firstAidDesc', language)}</p>
                  </div>
               </div>
               <div className="flex items-start gap-3" onClick={() => onNavigate('MAPS')}>
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <span className="material-symbols-rounded text-blue-500">location_on</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('findHospitals', language)}</h4>
                    <p className="text-sm text-gray-500">{t('findHospitalsDesc', language)}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DashboardView;
