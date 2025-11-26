

import React, { useEffect, useState, useRef } from 'react';
import { findNearbyPlaces } from '../services/geminiService';
import { t } from '../constants';

// Leaflet global declaration
declare const L: any;

interface MapsViewProps {
  language?: string;
}

interface PlaceData {
  id: number;
  name: string;
  address: string;
  distance: string;
  hours: string;
  rating: number;
  reviews: number;
  isOpen: boolean;
  coords?: { lat: number; long: number };
}

const CACHE_KEY_PLACES = 'lifeguard_cached_places';
const CACHE_KEY_COORDS = 'lifeguard_cached_coords';
const CACHE_KEY_LOC_ENABLED = 'lifeguard_loc_enabled';

const MapsView: React.FC<MapsViewProps> = ({ language = 'en-US' }) => {
  const [coords, setCoords] = useState<{lat: number, long: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Custom Pin State
  const [customPin, setCustomPin] = useState<{lat: number, long: number} | null>(null);
  const [pinAddress, setPinAddress] = useState<string>('');

  // New features state
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  
  const watchId = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  // Simulated data for demo purposes, now with coordinate offsets
  const getMockPlaces = (baseLat: number, baseLong: number): PlaceData[] => [
    {
      id: 1,
      name: "City General Hospital",
      address: "123 Health Ave, Metro City",
      distance: "1.2 km",
      hours: "Open 24 Hours",
      rating: 4.5,
      reviews: 128,
      isOpen: true,
      coords: { lat: baseLat + 0.005, long: baseLong + 0.005 }
    },
    {
      id: 2,
      name: "Community Clinic",
      address: "45 Care Lane, Metro City",
      distance: "0.8 km",
      hours: "Closes 9 PM",
      rating: 4.2,
      reviews: 45,
      isOpen: true,
      coords: { lat: baseLat - 0.003, long: baseLong + 0.004 }
    },
    {
      id: 3,
      name: "Westside Emergency Room",
      address: "89 West Blvd, Metro City",
      distance: "2.5 km",
      hours: "Open 24 Hours",
      rating: 4.7,
      reviews: 210,
      isOpen: true,
      coords: { lat: baseLat + 0.008, long: baseLong - 0.006 }
    }
  ];

  useEffect(() => {
    // Check saved preference for location
    const savedLocPref = localStorage.getItem(CACHE_KEY_LOC_ENABLED);
    if (savedLocPref !== null) {
      setIsLocationEnabled(JSON.parse(savedLocPref));
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Load
    const initData = async () => {
      const cachedCoords = localStorage.getItem(CACHE_KEY_COORDS);
      let initialLat = 40.7128;
      let initialLong = -74.0060;

      if (cachedCoords) {
        const c = JSON.parse(cachedCoords);
        setCoords(c);
        initialLat = c.lat;
        initialLong = c.long;
      }

      const cachedPlaces = localStorage.getItem(CACHE_KEY_PLACES);
      if (cachedPlaces) {
        setPlaces(JSON.parse(cachedPlaces));
      } else {
        const mocks = getMockPlaces(initialLat, initialLong);
        setPlaces(mocks);
      }
      
      setLoading(false);
    };

    initData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!loading && !isOffline && mapContainerRef.current && !mapRef.current && coords) {
      // Create map
      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.long], 13);
      mapRef.current = map;

      // Add Tile Layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Handle Map Clicks (Drop Pin)
      map.on('click', (e: any) => {
         const { lat, lng } = e.latlng;
         setCustomPin({ lat, long: lng });
         setPinAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
         setSelectedPlace(null); // Deselect hospital if any
      });
      
      // Fix map resize issues usually caused by container rendering updates
      setTimeout(() => { map.invalidateSize(); }, 100);
    }
  }, [loading, isOffline, coords]);

  // Update Markers when data changes
  useEffect(() => {
    if (mapRef.current) {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add User Location Marker (Blue Circle)
      if (coords) {
        const userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        const userMarker = L.marker([coords.lat, coords.long], { icon: userIcon }).addTo(mapRef.current);
        userMarker.bindPopup(t('currentLoc', language));
        markersRef.current.push(userMarker);
      }

      // Add Hospital Markers (Red Icons)
      places.forEach(place => {
        if (place.coords) {
          const hospIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:#dc2626; color:white; width: 32px; height: 32px; border-radius: 50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);'><span class="material-symbols-rounded" style="font-size:20px">local_hospital</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          
          const marker = L.marker([place.coords.lat, place.coords.long], { icon: hospIcon }).addTo(mapRef.current);
          
          // Click handler to select place
          marker.on('click', () => {
             setSelectedPlace(place);
             setCustomPin(null);
          });
          
          markersRef.current.push(marker);
        }
      });

      // Add Custom Pin Marker (Purple)
      if (customPin) {
        const pinIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style='background-color:#9333ea; color:white; width: 32px; height: 32px; border-radius: 50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);'><span class="material-symbols-rounded" style="font-size:20px">push_pin</span></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        const marker = L.marker([customPin.lat, customPin.long], { icon: pinIcon }).addTo(mapRef.current);
        marker.bindPopup(`
          <div style="text-align: center;">
            <strong>${t('dropPin', language)}</strong><br/>
            ${customPin.lat.toFixed(4)}, ${customPin.long.toFixed(4)}
          </div>
        `).openPopup();
        markersRef.current.push(marker);
      }
    }
  }, [places, coords, customPin, language]);


  // Handle Location Toggle & Tracking
  useEffect(() => {
    if (isLocationEnabled) {
      if (navigator.geolocation) {
        // Initial fetch
        navigator.geolocation.getCurrentPosition(
            (pos) => updateLocation(pos),
            (err) => handleError(err)
        );

        // Continuous watch
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => updateLocation(pos),
          (err) => handleError(err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        setError("Geolocation not supported.");
      }
    } else {
      // Stop tracking
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }
    
    localStorage.setItem(CACHE_KEY_LOC_ENABLED, JSON.stringify(isLocationEnabled));

  }, [isLocationEnabled]);

  const updateLocation = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const newCoords = { lat: latitude, long: longitude };
    
    setCoords(newCoords);
    localStorage.setItem(CACHE_KEY_COORDS, JSON.stringify(newCoords));
    setError('');
    
    // Refresh places if we moved significantly (simplified logic) or if empty
    if (places.length === 0) {
      loadPlaces(latitude, longitude);
    }
  };

  const handleError = (err: GeolocationPositionError) => {
    console.warn("Location error:", err);
    if (err.code === err.PERMISSION_DENIED) {
      setError("Location access denied.");
      setIsLocationEnabled(false);
    }
  };

  const loadPlaces = async (lat: number, long: number) => {
    try {
      await findNearbyPlaces(lat, long, "hospitals");
      // Use mock places with dynamic coords
      const freshPlaces = getMockPlaces(lat, long);
      setPlaces(freshPlaces);
      localStorage.setItem(CACHE_KEY_PLACES, JSON.stringify(freshPlaces));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetDirections = (destination: string) => {
    // Open Google Maps in a new tab/app with direction parameters
    if (coords) {
       const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.long}&destination=${encodeURIComponent(destination)}`;
       window.open(url, '_blank');
    } else {
       const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
       window.open(url, '_blank');
    }
  };

  const toggleLocation = () => {
    setIsLocationEnabled(!isLocationEnabled);
  };

  return (
    <div className="h-[calc(100vh-112px)] flex flex-col bg-white relative">
      
      {/* Top Bar Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-3 pointer-events-none">
        {/* Offline Indicator */}
        {isOffline ? (
          <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md pointer-events-auto flex items-center gap-1">
            <span className="material-symbols-rounded text-sm">wifi_off</span>
            Offline Mode
          </div>
        ) : <div />}

        {/* Location Toggle */}
        <button 
          onClick={toggleLocation}
          className={`pointer-events-auto px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-2 transition-all ${
            isLocationEnabled ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span className="material-symbols-rounded text-sm">
            {isLocationEnabled ? 'my_location' : 'location_disabled'}
          </span>
          {isLocationEnabled ? 'Location ON' : 'Location OFF'}
        </button>
      </div>

      {/* Map Container */}
      <div className={`${isOffline ? 'h-1/3 opacity-50' : 'h-1/2'} w-full bg-gray-200 relative transition-all`}>
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-gray-500 animate-pulse">{t('locating', language)}</span>
           </div>
        ) : isOffline ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
             <span className="material-symbols-rounded text-4xl mb-2">map</span>
             <p className="text-sm">Map unavailable offline</p>
           </div>
        ) : (
           // Leaflet Map for Interaction
           <>
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Simple Tip Overlay */}
            {!customPin && !selectedPlace && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-[400]">
                 <div className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {t('tapMap', language)}
                 </div>
              </div>
            )}
           </>
        )}
        
        {/* Error Toast */}
        {error && !isOffline && (
            <div className="absolute bottom-2 left-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded shadow-sm z-10 max-w-[90%]">
                {error}
            </div>
        )}
      </div>

      {/* Nearby List / Control Panel */}
      <div className={`${isOffline ? 'h-2/3' : 'h-1/2'} overflow-y-auto p-4 bg-white rounded-t-3xl -mt-4 relative shadow-top z-10 pb-20 transition-all`}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        
        {/* If Pin Selected, Show Action */}
        {customPin ? (
            <div className="mb-6 animate-fade-in">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                        <span className="material-symbols-rounded text-purple-600">push_pin</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{t('dropPin', language)}</h4>
                        <p className="text-xs text-gray-500 font-mono">{pinAddress}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGetDirections(pinAddress)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 flex items-center gap-1"
                  >
                    <span className="material-symbols-rounded text-base">directions</span>
                    {t('navHere', language)}
                  </button>
              </div>
            </div>
        ) : (
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded text-red-500">local_hospital</span>
            {t('nearbyCenters', language)}
          </h3>
        )}

        {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
        ) : (
            <div className="space-y-3">
                {!customPin && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-gray-800">{t('mapApp', language)}</h4>
                      <p className="text-xs text-gray-600">{t('navMap', language)}</p>
                    </div>
                    <button 
                      onClick={() => {
                          if (coords) {
                            window.open(`https://www.google.com/maps/search/hospitals/@${coords.lat},${coords.long},14z`, '_blank');
                          }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                    >
                      {t('open', language)}
                    </button>
                  </div>
                )}

                {places.map((place) => (
                  <div 
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setCustomPin(null);
                    }}
                    className={`p-4 border rounded-xl hover:shadow-md transition-all active:scale-[0.98] cursor-pointer bg-white group ${selectedPlace?.id === place.id ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base">{place.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="text-red-500 font-medium">{place.distance}</span>
                            <span>•</span>
                            <span className={place.isOpen ? "text-green-600" : "text-gray-500"}>{place.hours}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-rounded text-sm ${i < Math.floor(place.rating) ? 'filled' : ''}`}>star</span>
                              ))}
                          </div>
                          <span className="text-xs font-bold text-gray-700">{place.rating}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(`${place.name}, ${place.address}`);
                        }}
                        className="ml-3 bg-blue-50 text-blue-600 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center group-hover:scale-105"
                        aria-label={t('getDir', language)}
                      >
                          <span className="material-symbols-rounded">directions</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Sheet Details Modal */}
      {selectedPlace && !customPin && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setSelectedPlace(null)}
          />
          
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl transform transition-transform duration-300 animate-slide-up max-w-md mx-auto">
             <div className="p-1">
               <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
             </div>
             
             <div className="p-6 pt-2 pb-8">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPlace.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Open Now</span>
                         <span className="text-gray-500 text-sm">{selectedPlace.distance} away</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => setSelectedPlace(null)}
                     className="bg-gray-100 rounded-full p-2 text-gray-500 hover:bg-gray-200"
                   >
                      <span className="material-symbols-rounded">close</span>
                   </button>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                         <span className="material-symbols-rounded text-blue-600">location_on</span>
                      </div>
                      <div>
                         <p className="text-sm font-medium text-gray-900">Address</p>
                         <p className="text-sm text-gray-500">{selectedPlace.address}</p>
                      </div>
                   </div>

                   <div className="flex items-start gap-3">
                      <div className="bg-yellow-50 p-2 rounded-lg">
                         <span className="material-symbols-rounded text-yellow-600">star</span>
                      </div>
                      <div>
                         <p className="text-sm font-medium text-gray-900">Rating</p>
                         <p className="text-sm text-gray-500">{selectedPlace.rating} ({selectedPlace.reviews} reviews)</p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => handleGetDirections(`${selectedPlace.name}, ${selectedPlace.address}`)}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                   <span className="material-symbols-rounded">directions</span>
                   {t('getDir', language)}
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapsView;
