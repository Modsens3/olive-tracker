import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon, Polyline, LayersControl, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { OliveTree, Field } from '../types';
import { format } from 'date-fns';
import { Crosshair, Edit, CheckSquare, MousePointer2, LandPlot, Ruler, Save, Trash2, Undo2, X, QrCode } from 'lucide-react';
import { getArea, getPerimeter, getDistance, toStremmata, isPointInPolygon } from '../utils/geometry';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  onEditTree: (tree: OliveTree) => void;
  onShowQR: (tree: OliveTree) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number }) => void;
  
  // Selection
  isSelectionMode: boolean;
  selectedTreeIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectionMode: () => void;

  // Fields & Drawing
  fields: Field[];
  isDrawingMode: boolean;
  isMeasureMode: boolean;
  onSaveField: (field: Field) => void;
  onDeleteField: (id: string) => void;
  onToggleDrawingMode: () => void;
  onToggleMeasureMode: () => void;
}

// Component for handling map clicks during drawing/measuring
function MapEvents({ 
    isDrawingMode, 
    isMeasureMode, 
    onMapClick 
}: { 
    isDrawingMode: boolean; 
    isMeasureMode: boolean; 
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            if (isDrawingMode || isMeasureMode) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function Map({ 
    trees, 
    onAddTree, 
    onEditTree, 
    onShowQR,
    userLocation, 
    setUserLocation,
    isSelectionMode,
    selectedTreeIds,
    onToggleSelection,
    onToggleSelectionMode,
    fields,
    isDrawingMode,
    isMeasureMode,
    onSaveField,
    onDeleteField,
    onToggleDrawingMode,
    onToggleMeasureMode
}: MapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [drawPoints, setDrawPoints] = useState<{lat: number, lng: number}[]>([]);
  const [measurePoints, setMeasurePoints] = useState<{lat: number, lng: number}[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number>(0);

  // Clear points when mode changes
  useEffect(() => {
    if (!isDrawingMode) setDrawPoints([]);
  }, [isDrawingMode]);

  useEffect(() => {
    if (!isMeasureMode) {
        setMeasurePoints([]);
        setMeasureDistance(0);
    }
  }, [isMeasureMode]);

  const handleMapClick = (lat: number, lng: number) => {
    if (isDrawingMode) {
        setDrawPoints(prev => [...prev, { lat, lng }]);
    } else if (isMeasureMode) {
        setMeasurePoints(prev => {
            const newPoints = [...prev, { lat, lng }];
            // Calculate total distance
            if (newPoints.length > 1) {
                let dist = 0;
                for(let i=0; i<newPoints.length-1; i++) {
                    dist += getDistance(newPoints[i].lat, newPoints[i].lng, newPoints[i+1].lat, newPoints[i+1].lng);
                }
                setMeasureDistance(dist);
            } else {
                setMeasureDistance(0);
            }
            return newPoints;
        });
    }
  };

  const handleSaveDrawnField = () => {
    if (drawPoints.length < 3) {
        toast.error('Χρειάζονται τουλάχιστον 3 σημεία για να οριστεί χωράφι.');
        return;
    }

    const name = prompt('Δώσε όνομα για το χωράφι:', `Χωράφι ${fields.length + 1}`);
    if (!name) return;

    const newField: Field = {
        id: uuidv4(),
        name,
        coordinates: drawPoints,
        color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
    };

    onSaveField(newField);
    setDrawPoints([]);
  };

  const handleUndoDraw = () => {
    setDrawPoints(prev => prev.slice(0, -1));
  };

  const handleUndoMeasure = () => {
    setMeasurePoints(prev => {
        const newPoints = prev.slice(0, -1);
        // Recalculate distance
        if (newPoints.length > 1) {
            let dist = 0;
            for(let i=0; i<newPoints.length-1; i++) {
                dist += getDistance(newPoints[i].lat, newPoints[i].lng, newPoints[i+1].lat, newPoints[i+1].lng);
            }
            setMeasureDistance(dist);
        } else {
            setMeasureDistance(0);
        }
        return newPoints;
    });
  };

  const handleAdd = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      onAddTree(center.lat, center.lng);
    } else if (userLocation) {
      onAddTree(userLocation.lat, userLocation.lng);
    }
  };

  const getTreesInField = (fieldCoords: {lat: number, lng: number}[]) => {
      return trees.filter(tree => isPointInPolygon({lat: tree.lat, lng: tree.lng}, fieldCoords));
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
        <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Χάρτης Δρόμων">
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="dark:invert dark:hue-rotate-180 dark:brightness-95 dark:contrast-90"
                />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Δορυφορικός">
                <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
            </LayersControl.BaseLayer>
        </LayersControl>
        
        <LocationMarker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })} />
        <MapEvents isDrawingMode={isDrawingMode} isMeasureMode={isMeasureMode} onMapClick={handleMapClick} />

        {/* Δείκτης για την τρέχουσα τοποθεσία του χρήστη */}
        {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} opacity={0.6}>
                <Popup>Είσαι εδώ!</Popup>
            </Marker>
        )}

        {/* Saved Fields */}
        {fields.map(field => {
            const area = getArea(field.coordinates);
            const perimeter = getPerimeter(field.coordinates);
            const treesInField = getTreesInField(field.coordinates);
            const stremmata = toStremmata(area);

            return (
                <Polygon 
                    key={field.id}
                    positions={field.coordinates}
                    pathOptions={{ color: field.color, fillOpacity: 0.2 }}
                >
                    <Popup>
                        <div className="text-sm">
                            <h3 className="font-bold text-lg mb-1">{field.name}</h3>
                            <p><strong>Εμβαδόν:</strong> {area.toFixed(0)} m² ({stremmata} στρ.)</p>
                            <p><strong>Περίμετρος:</strong> {perimeter.toFixed(0)} m</p>
                            <p><strong>Δέντρα εντός:</strong> {treesInField.length}</p>
                            {field.notes && <p className="italic mt-1">{field.notes}</p>}
                            <button 
                                onClick={() => onDeleteField(field.id)}
                                className="mt-2 w-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 py-1 px-2 rounded flex items-center justify-center gap-1 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <Trash2 size={14} />
                                Διαγραφή Χωραφιού
                            </button>
                        </div>
                    </Popup>
                    <Tooltip sticky direction="center" opacity={0.7}>
                        {field.name} ({stremmata} στρ.)
                    </Tooltip>
                </Polygon>
            );
        })}

        {/* Current Drawing Field */}
        {isDrawingMode && drawPoints.length > 0 && (
            <>
                <Polygon positions={drawPoints} pathOptions={{ color: 'blue', dashArray: '5, 5', fillOpacity: 0.1 }} />
                {drawPoints.map((point, idx) => (
                    <Marker key={idx} position={point} opacity={0.5} icon={DefaultIcon} />
                ))}
            </>
        )}

        {/* Current Measuring Line */}
        {isMeasureMode && measurePoints.length > 0 && (
            <>
                <Polyline positions={measurePoints} pathOptions={{ color: 'red', dashArray: '10, 10' }} />
                {measurePoints.map((point, idx) => (
                    <Marker key={idx} position={point} opacity={0.5} icon={DefaultIcon}>
                        {idx > 0 && (
                            <Tooltip permanent direction="top">
                                {getDistance(measurePoints[idx-1].lat, measurePoints[idx-1].lng, point.lat, point.lng).toFixed(1)}m
                            </Tooltip>
                        )}
                    </Marker>
                ))}
            </>
        )}

        {/* Οι ελιές που έχουμε καταγράψει */}
        {trees.map((tree) => {
          const pendingTasks = tree.tasks?.filter(t => t.status === 'pending') || [];
          const isSelected = selectedTreeIds.includes(tree.id);
          
          return (
          <Marker 
            key={tree.id} 
            position={[tree.lat, tree.lng]}
            opacity={isSelectionMode ? (isSelected ? 1 : 0.5) : 1}
            eventHandlers={{
                click: (e) => {
                    if (isSelectionMode) {
                        e.target.closePopup(); // Prevent popup in selection mode
                        onToggleSelection(tree.id);
                    }
                }
            }}
          >
            {!isSelectionMode && (
                <Popup>
                <div className="text-sm">
                    <p className="font-bold">{tree.variety.toUpperCase()}</p>
                    <p>Υγεία: {tree.health}</p>
                    <p>Εκτίμηση: {tree.yieldEstimate}kg</p>
                    
                    {pendingTasks.length > 0 && (
                        <div className="mt-1 mb-1 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs px-2 py-1 rounded border border-orange-200 dark:border-orange-800 font-bold flex items-center gap-1">
                            ⚠️ {pendingTasks.length} εκκρεμείς εργασίες
                        </div>
                    )}

                    {tree.notes && <p className="italic text-gray-600 dark:text-gray-400">{tree.notes}</p>}
                    {tree.photoUrl && (
                        <div className="mt-2 mb-2 w-full h-32 overflow-hidden rounded-md">
                            <img src={tree.photoUrl} alt="Tree" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{format(new Date(tree.dateAdded), 'dd/MM/yyyy')}</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onEditTree(tree)}
                            className="flex-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-2 rounded flex items-center justify-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <Edit size={14} />
                            Επεξεργασία
                        </button>
                        <button 
                            onClick={() => onShowQR(tree)}
                            className="bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 py-1 px-2 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            title="Εμφάνιση QR Code"
                        >
                            <QrCode size={14} />
                        </button>
                    </div>
                </div>
                </Popup>
            )}
          </Marker>
        )})}
      </MapContainer>
      
      {/* Κεντρικός Στόχος (Crosshair) */}
      {!isDrawingMode && !isMeasureMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none text-lime-600">
            <Crosshair size={40} strokeWidth={1.5} />
        </div>
      )}

      {/* Control Buttons Container */}
      <div className="absolute top-24 right-3 z-[1000] flex flex-col gap-2">
          {/* Selection Mode Toggle */}
          <button 
            onClick={onToggleSelectionMode}
            className={`p-2 rounded-lg shadow-md transition-colors ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            title="Λειτουργία Επιλογής"
          >
            {isSelectionMode ? <CheckSquare size={24} /> : <MousePointer2 size={24} />}
          </button>

          {/* Drawing Mode Toggle */}
          <button 
            onClick={onToggleDrawingMode}
            className={`p-2 rounded-lg shadow-md transition-colors ${isDrawingMode ? 'bg-orange-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            title="Σχεδίαση Χωραφιού"
          >
            <LandPlot size={24} />
          </button>

          {/* Measure Mode Toggle */}
          <button 
            onClick={onToggleMeasureMode}
            className={`p-2 rounded-lg shadow-md transition-colors ${isMeasureMode ? 'bg-purple-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            title="Μέτρηση Απόστασης"
          >
            <Ruler size={24} />
          </button>
      </div>

      {/* Drawing Controls Overlay */}
      {isDrawingMode && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg flex gap-2 items-center animate-in slide-in-from-bottom-4">
            <span className="text-sm font-bold mr-2 text-orange-700 dark:text-orange-400">Σχεδίαση Χωραφιού ({drawPoints.length} σημεία)</span>
            <button onClick={handleUndoDraw} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200" title="Αναίρεση τελευταίου σημείου">
                <Undo2 size={20} />
            </button>
            <button onClick={handleSaveDrawnField} className="p-2 bg-green-600 hover:bg-green-700 rounded text-white flex gap-1 items-center">
                <Save size={20} /> Αποθήκευση
            </button>
            <button onClick={onToggleDrawingMode} className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded text-red-700 dark:text-red-300" title="Ακύρωση">
                <X size={20} />
            </button>
        </div>
      )}

      {/* Measuring Controls Overlay */}
      {isMeasureMode && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg flex gap-2 items-center animate-in slide-in-from-bottom-4">
            <span className="text-sm font-bold mr-2 text-purple-700 dark:text-purple-400">
                Μέτρηση: {measureDistance.toFixed(1)}m
            </span>
            <button onClick={handleUndoMeasure} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-gray-700 dark:text-gray-200" title="Αναίρεση τελευταίου σημείου">
                <Undo2 size={20} />
            </button>
            <button onClick={onToggleMeasureMode} className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded text-red-700 dark:text-red-300" title="Κλείσιμο">
                <X size={20} />
            </button>
        </div>
      )}

      {/* Κουμπί Προσθήκης */}
      <button 
        onClick={handleAdd}
        className={`absolute bottom-24 right-4 z-[1000] bg-lime-600 dark:bg-lime-700 text-white p-4 rounded-full shadow-lg hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors flex items-center justify-center ${isSelectionMode || isDrawingMode || isMeasureMode ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className="text-2xl font-bold">+</span>
      </button>
      
      {!userLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-full shadow text-xs text-gray-600 dark:text-gray-200 flex items-center gap-2">
              <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></span>
              Αναμονή GPS - Σύρετε το χάρτη στο σημείο
          </div>
      )}
    </div>
  );
}
