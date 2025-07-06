"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // <-- Rất quan trọng: Import CSS của Leaflet
import L from 'leaflet'; // <-- Import L để sửa lỗi icon

// Fix lỗi icon marker mặc định không hiển thị trong Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface MapDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    lat: number;
    lng: number;
  } | null;
}

export function MapDialog({ isOpen, onOpenChange, location }: MapDialogProps) {
  if (!location) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vị trí chấm công</DialogTitle>
        </DialogHeader>
        <div className="h-[450px] w-full mt-4 rounded-md overflow-hidden">
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={16} 
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="http://googleusercontent.com/osm/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                Vị trí chấm công của nhân viên.
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}