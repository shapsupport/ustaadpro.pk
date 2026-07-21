"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon path issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapCoreProps {
  position: { lat: number; lng: number };
  onPositionChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom());
  }, [position, map]);
  return null;
}

export default function LeafletMapCore({ position, onPositionChange }: LeafletMapCoreProps) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: "350px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={customIcon}
        draggable={true}
        eventHandlers={{
          dragend(e) {
            const marker = e.target;
            const latLng = marker.getLatLng();
            onPositionChange(latLng.lat, latLng.lng);
          },
        }}
      />
      <MapClickHandler onPositionChange={onPositionChange} />
      <MapRecenter position={position} />
    </MapContainer>
  );
}
