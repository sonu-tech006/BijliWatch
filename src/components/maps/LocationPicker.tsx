import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  state: string;
  district: string;
  locality: string;
  address: string;
  onLocationChange: (loc: {
    lat?: number;
    lng?: number;
    state: string;
    district: string;
    locality: string;
    address: string;
  }) => void;
}

export default function LocationPicker({
  initialLat = 25.5941, // Default Patna coordinates
  initialLng = 85.1376,
  state,
  district,
  locality,
  address,
  onLocationChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // avoid duplicate map init

    // Fix leaflet default icon in bundler environments
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const lat = coords.lat || 25.5941;
    const lng = coords.lng || 85.1376;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      onLocationChange({
        lat: pos.lat,
        lng: pos.lng,
        state,
        district,
        locality,
        address,
      });
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      onLocationChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        state,
        district,
        locality,
        address,
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        onLocationChange({
          lat: latitude,
          lng: longitude,
          state,
          district,
          locality,
          address,
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('GPS permission denied or unavailable. You can click on the map or type address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Incident Location & Jurisdiction</span>
        </label>
        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Locating...' : 'Detect Current GPS'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Interactive Map Box */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-400 z-[1000] pointer-events-none">
          {coords.lat && coords.lng ? (
            <span>Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</span>
          ) : (
            <span>Click map to pin point</span>
          )}
        </div>
      </div>

      {/* Manual Fallback Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">State</label>
          <input
            type="text"
            value={state}
            onChange={(e) =>
              onLocationChange({
                ...coords,
                state: e.target.value,
                district,
                locality,
                address,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Bihar"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">District</label>
          <input
            type="text"
            value={district}
            onChange={(e) =>
              onLocationChange({
                ...coords,
                state,
                district: e.target.value,
                locality,
                address,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Patna"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Locality / Panchayat</label>
          <input
            type="text"
            value={locality}
            onChange={(e) =>
              onLocationChange({
                ...coords,
                state,
                district,
                locality: e.target.value,
                address,
              })
            }
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Rampur Ward 4"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1">Detailed Service / Incident Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) =>
            onLocationChange({
              ...coords,
              state,
              district,
              locality,
              address: e.target.value,
            })
          }
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          placeholder="e.g. House 42, Near Primary Health Sub-Centre, Rampur"
          required
        />
      </div>
    </div>
  );
}
