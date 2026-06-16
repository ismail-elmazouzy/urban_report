import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

export function LocationPicker({ onSelect }) {
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer center={[33.5731, -7.5898]} zoom={12}
      style={{ height:'250px', borderRadius:'8px', marginTop:'8px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler />
    </MapContainer>
  );
}