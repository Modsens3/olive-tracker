import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { OliveTree } from '../types';
import { format } from 'date-fns';
import { Crosshair } from 'lucide-react';

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
  const firstFound = useRef(false);

  useEffect(() => {
    map.locate({
      watch: true,
      enableHighAccuracy: true,
      maximumAge: 10000 // Δέξου θέση έως 10 δευτερόλεπτα παλιά για ταχύτητα
    });

    const handleLocationFound = (e: L.LocationEvent) => {
      onLocationFound(e.latlng.lat, e.latlng.lng);
      if (!firstFound.current) {
        map.flyTo(e.latlng, 18);
        firstFound.current = true;
      }
    };

    const handleLocationError = (e: L.ErrorEvent) => {
      console.warn("GPS Error:", e.message);
    };

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);

    return () => {
      map.stopLocate();
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
    };
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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleAdd = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      onAddTree(center.lat, center.lng);
    } else if (userLocation) {
      onAddTree(userLocation.lat, userLocation.lng);
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[38.0, 23.7]} 
        zoom={6} 
        scrollWheelZoom={true} 
        className="h-full w-full"
        ref={setMapInstance}
      >
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
      
      {/* Κεντρικός Στόχος (Crosshair) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none text-lime-600">
        <Crosshair size={40} strokeWidth={1.5} />
      </div>

      {/* Κουμπί Προσθήκης */}
      <button 
        onClick={handleAdd}
        className="absolute bottom-24 right-4 z-[1000] bg-lime-600 text-white p-4 rounded-full shadow-lg hover:bg-lime-700 transition-colors flex items-center justify-center"
      >
        <span className="text-2xl font-bold">+</span>
      </button>
      
      {!userLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 px-3 py-1 rounded-full shadow text-xs text-gray-600 flex items-center gap-2">
              <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></span>
              Αναμονή GPS - Σύρετε το χάρτη στο σημείο
          </div>
      )}
    </div>
  );
}
