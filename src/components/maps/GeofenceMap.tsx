"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon assets in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface GeofenceMapProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  interactive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export default function GeofenceMap({
  latitude,
  longitude,
  radiusMeters,
  interactive = true,
  onLocationChange,
  className = "h-[340px] w-full",
  zoom = 16,
}: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      touchZoom: interactive,
    });

    // OpenStreetMap standard tile layer (free, no API key needed)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initial Marker
    const marker = L.marker([latitude, longitude], {
      draggable: interactive,
    }).addTo(map);

    // Initial Geofence Circle
    const circle = L.circle([latitude, longitude], {
      radius: radiusMeters,
      color: "#2563eb", // blue-600
      fillColor: "#3b82f6", // blue-500
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    if (interactive) {
      // Map click handler to relocate center
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
      });

      // Marker drag handler
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        if (onLocationChange) {
          onLocationChange(pos.lat, pos.lng);
        }
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync external position updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const currentLatLng = markerRef.current?.getLatLng();
    if (
      currentLatLng &&
      (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude)
    ) {
      markerRef.current?.setLatLng([latitude, longitude]);
      circleRef.current?.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Sync external radius updates
  useEffect(() => {
    if (circleRef.current && radiusMeters > 0) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className={className} />
      {interactive && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-sm pointer-events-none">
          Click map or drag pin to move center
        </div>
      )}
    </div>
  );
}
