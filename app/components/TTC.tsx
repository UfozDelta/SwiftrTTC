import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function BusStop() {
  const [data, setData] = useState({});
  const [stopId, setStopId] = useState('');
  const [currentStopId, setCurrentStopId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const validateStopId = (id) => {
    if (!id) return "Stop ID is required";
    if (!/^\d+$/.test(id)) return "Stop ID must be a number";
    return null;
  };

  const fetchData = async (stopId) => {
    if (!stopId) return;
  
    try {
      const response = await fetch(`http://10.0.0.37:5000/api/routes/stops/arrival?stopid=${stopId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const apiData = await response.json();
  
      // Process the new data and preserve remainingSeconds if it exists
      const processedData = Object.fromEntries(
        Object.entries(apiData).map(([route, predictions]) => [
          route,
          predictions.map(pred => {
            const previousRouteData = data[route] || [];
            const previousPred = previousRouteData.find(p => p.vehicle === pred.vehicle);
  
            // Preserve remainingSeconds if available, otherwise calculate from new prediction
            const initialSeconds = parseInt(pred.sec) || 0;
            const remainingSeconds = previousPred?.remainingSeconds ?? initialSeconds;
  
            return {
              ...pred,
              initialSeconds,
              remainingSeconds,
              timestamp: Date.now(),
            };
          }),
        ])
      );
  
      setData(processedData);
      setError('');
    } catch (err) {
      setError('Failed to fetch bus data');
      console.log(err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Format time to display minutes and seconds
  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return "Due";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Update countdown times
  const updateTimes = useCallback(() => {
    setData(prevData => {
      const updatedData = {};
      Object.entries(prevData).forEach(([route, predictions]) => {
        updatedData[route] = predictions.map(pred => {
          const elapsedSeconds = (Date.now() - pred.timestamp) / 1000;
          const remainingSeconds = Math.max(0, pred.initialSeconds - elapsedSeconds);
          return {
            ...pred,
            remainingSeconds
          };
        });
      });
      return updatedData;
    });
  }, []);

  useEffect(() => {
    if (currentStopId) {
      if (initialLoad) {
        setLoading(true);
      }
      fetchData(currentStopId);
      
      // Set up intervals for countdown and data refresh
      const countdownInterval = setInterval(updateTimes, 1000);
      const refreshInterval = setInterval(() => {
        fetchData(currentStopId);
      }, 30000);

      return () => {
        clearInterval(countdownInterval);
        clearInterval(refreshInterval);
      };
    }
  }, [currentStopId]);

  const handleSubmit = () => {
    const validationError = validateStopId(stopId);
    if (validationError) {
      setError(validationError);
      return;
    }
    setCurrentStopId(stopId);
    setInitialLoad(true);
  };

  // Sort the data entries by array length
  const sortedEntries = Object.entries(data)
    .sort(([, a], [, b]) => {
      return (b as any[]).length - (a as any[]).length;
    });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            {/* <Bus color="#2e2e2e" size={24} /> */}
            <Text style={styles.title}>Find Your Bus</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.label}>Stop ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter stop # here"
            value={stopId}
            onChangeText={setStopId}
            keyboardType="numeric"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.description}>Enter the TTC bus stop number</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Find Buses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && initialLoad ? (
        <ActivityIndicator size="large" color="#2e2e2e" style={styles.loader} />
      ) : (
        <View style={styles.predictionsGrid}>
          {sortedEntries.map(([number, routeData]) => (
            <View key={number} style={styles.predictionCard}>
              <Text style={styles.routeNumber}>{number}</Text>
              {(routeData as any[]).map((prediction, index) => (
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2e2e2e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 8,
  },
  loader: {
    marginTop: 20,
  },
  predictionsGrid: {
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