import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

export default function NearbyStops() {
  const [location, setLocation] = useState<Location.LocationObject>();
  const [nearbyStops, setNearbyStops] = useState(null);
  const [arrivals, setArrivals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (err) {
        setError('Error getting location');
      }
    })();
  }, []);

  const fetchNearbyStops = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://10.0.0.37:5000/api/routes/stops/closest?lat=${location.coords.latitude}&lon=${location.coords.longitude}&num=7`
      );
      const data = await response.json();
      setNearbyStops(data);
      
      // Fetch initial arrivals for all stops
      Object.values(data).forEach(stop => {
        fetchArrivalTimes(stop.stop_id);
      });
    } catch (err) {
      setError('Error fetching nearby stops');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchArrivalTimes = async (stopId) => {
    try {
      const response = await fetch(
        `http://192.168.0.11:5000/api/routes/stops/arrival?stopid=${stopId}`
      );
      const apiData = await response.json();

      // Process the data with countdown information
      const processedData = Object.fromEntries(
        Object.entries(apiData).map(([route, predictions]) => [
          route,
          predictions.map(pred => ({
            ...pred,
            initialSeconds: parseInt(pred.sec) || 0,
            remainingSeconds: parseInt(pred.sec) || 0,
            timestamp: Date.now(),
          }))
        ])
      );

      setArrivals(prev => ({
        ...prev,
        [stopId]: processedData
      }));
    } catch (err) {
      console.error(`Error fetching arrival times for stop ${stopId}:`, err);
    }
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return "Due";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const updateTimes = useCallback(() => {
    setArrivals(prevArrivals => {
      const updatedArrivals = {};
      Object.entries(prevArrivals).forEach(([stopId, stopData]) => {
        const updatedStopData = {};
        Object.entries(stopData).forEach(([route, predictions]) => {
          updatedStopData[route] = predictions.map(pred => {
            const elapsedSeconds = (Date.now() - pred.timestamp) / 1000;
            const remainingSeconds = Math.max(0, pred.initialSeconds - elapsedSeconds);
            return {
              ...pred,
              remainingSeconds
            };
          });
        });
        updatedArrivals[stopId] = updatedStopData;
      });
      return updatedArrivals;
    });
  }, []);

  useEffect(() => {
    if (nearbyStops) {
      const countdownInterval = setInterval(updateTimes, 1000);
      const refreshInterval = setInterval(() => {
        Object.values(nearbyStops).forEach(stop => {
          fetchArrivalTimes(stop.stop_id);
        });
      }, 30000);

      return () => {
        clearInterval(countdownInterval);
        clearInterval(refreshInterval);
      };
    }
  }, [nearbyStops]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Nearby Stops</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <TouchableOpacity 
            style={styles.button}
            onPress={fetchNearbyStops}
            disabled={loading || !location}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Finding Stops...' : 'Find Nearby Stops'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && initialLoad ? (
        <ActivityIndicator size="large" color="#2e2e2e" style={styles.loader} />
      ) : (
        <View style={styles.stopsGrid}>
          {nearbyStops && Object.entries(nearbyStops).map(([key, stop]) => (
            <View key={key} style={styles.predictionCard}>
              <Text style={styles.stopTitle}>{stop.stop_title}</Text>
              <Text style={styles.routeInfo}>Route {stop.route_id} - {stop.direction_name}</Text>
              <Text style={styles.distanceInfo}>Distance: {Math.round(stop.distance)}m</Text>
              
              {arrivals[stop.stop_id] && Object.entries(arrivals[stop.stop_id]).map(([routeId, predictions]) => (
                <View key={routeId} style={styles.predictionCard}>
                  <Text style={styles.routeNumber}>Route {routeId}</Text>
                  {predictions.map((prediction, index) => (
                    <View key={`${prediction.vehicle}_${index}`} style={styles.predictionItem}>
                      <Text style={[
                        styles.arrivalTime,
                        prediction.remainingSeconds <= 60 ? styles.arrivalTimeSoon : null
                      ]}>
                        {formatTime(prediction.remainingSeconds)}
                      </Text>
                      <Text style={styles.vehicleNumber}>
                        Vehicle: {prediction.vehicle}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2e2e2e',
  },
  cardContent: {
    padding: 16,
  },
  button: {
    backgroundColor: '#2e2e2e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  stopsGrid: {
    gap: 16,
  },
  predictionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e2e2e',
  },
  routeInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  distanceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  routeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2e2e2e',
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  arrivalTimeSoon: {
    color: '#ff3b30',
  },
  vehicleNumber: {
    fontSize: 14,
    color: '#666',
  },
});