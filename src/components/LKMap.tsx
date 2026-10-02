/**
 * Interactive OpenStreetMap component centred on Sri Lanka.
 * Uses Leaflet imperatively via useRef/useEffect so no react-leaflet needed.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths broken by Vite's asset pipeline
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  count?: number;
  bank?: string;
}

interface Props {
  markers: MapMarker[];
  height?: number;
}

export default function LKMap({ markers, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Mount the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Re-draw markers whenever they change
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    for (const m of markers) {
      const popup = `<strong>${m.label}</strong>${m.bank ? `<br>${m.bank.toUpperCase()}` : ''}${m.count ? `<br>${m.count} offer(s)` : ''}`;
      L.marker([m.lat, m.lng])
        .bindPopup(popup)
        .addTo(layerRef.current);
    }

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [markers]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 0 }}
    />
  );
}
