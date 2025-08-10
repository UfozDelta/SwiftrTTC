import React, { useEffect, useState } from "react";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import * as Location from "expo-location";

type Stop = {
  lat: string;
  lon: string;
  stopId: string;
  stop_tag: string;
  title: string;
};

type Point = {
  lat: number;
  lon: number;
};

type PathSegment = Point[];

export default function App() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [pathSegments, setPathSegments] = useState<PathSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://swiftrttc.onrender.com/api/routes/stops/lines?r=76"
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();

        // Stops - filter out non-stop data
        const stopsArray: Stop[] = Object.values(json).filter(
          (item) => (item as any).stopId
        ) as Stop[];
        setStops(stopsArray);

        // Path Segments - handle the new path_segments structure
        if (json.path_segments && Array.isArray(json.path_segments)) {
          // New format: array of path segments
          const segments = json.path_segments.map((segment: Point[]) => 
            segment.map((point: Point) => ({
              lat: typeof point.lat === 'string' ? parseFloat(point.lat) : point.lat,
              lon: typeof point.lon === 'string' ? parseFloat(point.lon) : point.lon,
            }))
          );
          setPathSegments(segments);
        } else if (json.points && Array.isArray(json.points)) {
          // Fallback: old format with single points array
          const singleSegment = json.points.map((p: Point) => ({
            lat: typeof p.lat === 'string' ? parseFloat(p.lat) : p.lat,
            lon: typeof p.lon === 'string' ? parseFloat(p.lon) : p.lon,
          }));
          setPathSegments([singleSegment]); // Wrap in array to make it a segment
        } else {
          console.warn('No path data found in response');
          setPathSegments([]);
        }

      } catch (err) {
        setError((err as Error).message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        console.error('Location error:', err);
        // Don't set error here, just log it - location is optional
      }
    };

    fetchData();
    fetchUserLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Loading Route 76...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={new_style}
        initialRegion={{
          latitude: userLocation?.latitude || 43.624981,
          longitude: userLocation?.longitude || -79.490183,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
      >
        {/* Bus Stop Markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.stop_tag}
            coordinate={{
              latitude: parseFloat(stop.lat),
              longitude: parseFloat(stop.lon),
            }}
            title={stop.title}
            description={`Stop ID: ${stop.stopId}`}
            pinColor="#0066CC"
          />
        ))}

        {/* Route Polylines - Multiple segments */}
        {pathSegments.map((segment, index) => {
          if (segment.length === 0) return null;
          
          const coordinates = segment.map((point) => ({
            latitude: point.lat,
            longitude: point.lon,
          }));

          return (
            <Polyline
              key={`segment-${index}`}
              coordinates={coordinates}
              strokeColor="#FF0000"
              strokeWidth={4}
            />
          );
        })}
      </MapView>
      
      {/* Debug Info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Stops: {stops.length} | Segments: {pathSegments.length} | 
          Points: {pathSegments.reduce((total, segment) => total + segment.length, 0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242f3e',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242f3e',
    padding: 20,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
    textAlign: 'center',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 5,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});

const new_style =[
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#7c7c7cff"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffffff"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#263c3f"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#ffffffff"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#212a37"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9ca5b3"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#1f2835"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2f3948"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.station.bus",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#515c6d"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  }
]