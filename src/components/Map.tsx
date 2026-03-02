import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { OliveTree } from '../types';
import { format } from 'date-fns';

// Fix για τα εικονίδια του Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component για να κεντράρει το χάρτη στην τοποθεσία του χρήστη
function LocationMarker({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 18);
      onLocationFound(e.latlng.lat, e.latlng.lng);
    });
  }, [map]);

  return null;
}

interface MapProps {
  trees: OliveTree[];
  onAddTree: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
}

export default function Map({ trees, onAddTree, userLocation, setUserLocation }: MapProps) {
  return (
    <div className="h-full w-full relative">
      <MapContainer center={[38.0, 23.7]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })} />

        {/* Δείκτης για την τρέχουσα τοποθεσία του χρήστη */}
        {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} opacity={0.6}>
                <Popup>Είσαι εδώ!</Popup>
            </Marker>
        )}

        {/* Οι ελιές που έχουμε καταγράψει */}
        {trees.map((tree) => (
          <Marker key={tree.id} position={[tree.lat, tree.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{tree.variety.toUpperCase()}</p>
                <p>Υγεία: {tree.health}</p>
                <p>Εκτίμηση: {tree.yieldEstimate}kg</p>
                <p className="text-gray-500 text-xs">{format(new Date(tree.dateAdded), 'dd/MM/yyyy')}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Κουμπί Προσθήκης */}
      <button 
        onClick={() => userLocation && onAddTree(userLocation.lat, userLocation.lng)}
        className="absolute bottom-24 right-4 z-[1000] bg-lime-600 text-white p-4 rounded-full shadow-lg hover:bg-lime-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!userLocation}
      >
        <span className="text-2xl font-bold">+</span>
      </button>
      {!userLocation && (
          <div className="absolute bottom-24 right-20 z-[1000] bg-white px-3 py-1 rounded shadow text-xs text-gray-600">
              Αναμονή GPS...
          </div>
      )}
    </div>
  );
}
