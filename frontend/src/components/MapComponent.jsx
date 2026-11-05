"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const icon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent({ lat, lng, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapInstance.current);

      markerRef.current.on('dragend', () => {
        const { lat, lng } = markerRef.current.getLatLng();
        onChange(lat, lng);
      });
    } else {
      mapInstance.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }

    return () => {
      // Cleanup if needed
    };
  }, [lat, lng]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200">
       <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
