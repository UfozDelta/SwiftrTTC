import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bus, MapPin, Map } from 'lucide-react-native';
import BusStop from '@/components/TTC';
import NearbyStops from '@/components/NearbyStops';
const Tab = createBottomTabNavigator();

export default function App() {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Stops') {
              return <Bus size={size} color={color} />;
            } else if (route.name === 'Nearby') {
              return <MapPin size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: '#2e2e2e',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Stops" component={BusStop} />
        <Tab.Screen name="Nearby" component={NearbyStops} />
      </Tab.Navigator>
  );
}