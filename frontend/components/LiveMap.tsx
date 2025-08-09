"use client"
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card } from "@/components/ui/card"
import { Bus } from 'lucide-react'
import L from 'leaflet'

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)

const Map = dynamic(
  () => import('react-leaflet').then(mod => {
    return function Map({ children, ...props }) {
      return (
        <MapContainer {...props}>
          {children}
        </MapContainer>
      )
    }
  }),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center">Loading map...</div> }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)

interface Stop {
  stopId: string;
  title: string;
  coordinates?: {
    lat: number;
    lng: number;
  }
}

interface StopsData {
  [key: string]: Stop;
}

interface VehicleData {
  heading: string;
  id: string;
  lat: string;
  lon: string;
  predictable: string;
  route: string;
  speed: string;
  time: string;
}

interface VehiclesData {
  [key: string]: VehicleData;
}

const LiveBusMap = () => {
  const [ready, setReady] = useState(false);
  const [stops, setStops] = useState<StopsData>({});
  const [vehicles, setVehicles] = useState<VehiclesData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleIcon, setVehicleIcon] = useState<L.Icon | null>(null);

  // Initialize Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(() => {
        // Force loading the Leaflet CSS
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Create custom vehicle icon
        const customIcon = L.divIcon({
          html: `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#FF4B4B" />
              <circle cx="12" cy="12" r="6" fill="#FF0000" />
            </svg>
          `,
          className: 'custom-vehicle-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        setVehicleIcon(customIcon);
        setReady(true);
      });
    }
  }, []);

  // Fetch all vehicles data
  useEffect(() => {
    const fetchVehiclesData = async () => {
      try {
        const response = await fetch('https://swiftrttc.onrender.com/api/routes/vehicles?route=76');
        if (!response.ok) throw new Error('Failed to fetch vehicles data');
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        console.error('Error fetching vehicles data:', err);
      }
    };

    if (ready) {
      fetchVehiclesData();
      // Update vehicles positions every 10 seconds
      const interval = setInterval(fetchVehiclesData, 10000);
      return () => clearInterval(interval);
    }
  }, [ready]);

  // Fetch stops once on component mount
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await fetch('https://swiftrttc.onrender.com/api/routes/stops?r=76');
        if (!response.ok) throw new Error('Failed to fetch stops');
        const data = await response.json();
        
        const stopsWithCoordinates = Object.entries(data).reduce((acc, [key, stop]) => {
          if (key.endsWith('_ar')) return acc;
          
          acc[key] = {
            ...stop,
            coordinates: {
              lat: stop.lat,
              lng: stop.lon
            }
          }
          return acc;
        }, {});

        setStops(stopsWithCoordinates);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (ready) {
      fetchStops();
    }
  }, [ready]); // Only runs once when ready becomes true

  if (!ready || loading) {
    return (
      <Card className="p-4">
        <div className="h-[600px] flex items-center justify-center">
          Loading map...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="h-[600px] flex items-center justify-center text-red-500">
          Error: {error}
        </div>
      </Card>
    );
  }

  const defaultProps = {
    center: [43.6532, -79.3832],
    zoom: 12,
    maxZoom: 18,
    minZoom: 10,
    scrollWheelZoom: true,
    className: "h-full w-full rounded-lg"
  };

  const getRotatedIcon = (heading: string) => {
    if (!vehicleIcon) return null;
    
    return L.divIcon({
      html: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${heading}deg);">
          <circle cx="12" cy="12" r="10" fill="#FF4B4B" />
          <circle cx="12" cy="12" r="6" fill="#FF0000" />
          <path d="M12 4 L14 12 L12 10 L10 12 L12 4" fill="white"/>
        </svg>
      `,
      className: 'custom-vehicle-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className='container mx-auto p-4 space-y-8'>
    <Card>
      <div className="h-[600px] w-full relative">
        <Map {...defaultProps}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />
          {Object.entries(stops).map(([key, stop]) => (
            stop.coordinates && (
              <Marker
                key={key}
                position={[stop.coordinates.lat, stop.coordinates.lng]}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-bold flex items-center gap-2">
                      <Bus className="w-4 h-4" />
                      Stop #{stop.stopId}
                    </div>
                    <div className="text-sm mt-1">{stop.title}</div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
          
          {/* Vehicle Markers */}
          {Object.entries(vehicles).map(([id, vehicle]) => {
            const icon = getRotatedIcon(vehicle.heading);
            return (
              <Marker
                key={id}
                position={[parseFloat(vehicle.lat), parseFloat(vehicle.lon)]}
                icon={icon || vehicleIcon}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-bold flex items-center gap-2">
                      <Bus className="w-4 h-4" />
                      Bus #{vehicle.id}
                    </div>
                    <div className="text-sm mt-1">
                      <div>Route: {vehicle.route}</div>
                      <div>Speed: {vehicle.speed} km/h</div>
                      <div>Heading: {vehicle.heading}°</div>
                      <div>Last Updated: {vehicle.time} min ago</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </Map>
      </div>
    </Card>
    </div>
  );
};

export default LiveBusMap;