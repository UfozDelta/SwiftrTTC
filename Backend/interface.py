import sqlite3
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c * 1000
    return distance

def get_closest_stops(lat, lon, num_results=5):
    conn = sqlite3.connect('C:/Users/f3l/Desktop/TTC/database/transportation.db')
    cursor = conn.cursor()
    # Query to retrieve all stops with their corresponding route and direction info
    cursor.execute('''
    SELECT stops.stop_id, stops.stop_title, stops.lat, stops.lon, stops.stop_tag, 
           directions.direction_id, directions.direction_title, directions.direction_name, 
           routes.route_id, routes.route_title 
    FROM stops
    JOIN directions ON stops.direction_id = directions.direction_id
    JOIN routes ON directions.route_id = routes.route_id
    ''')
    stops = cursor.fetchall()
    conn.close()
    
    # Calculate the distance to each stop and store it with the stop data
    stop_distances = []
    for stop in stops:
        stop_id, stop_title, stop_lat, stop_lon, stop_tag, direction_id, direction_title, direction_name, route_id, route_title = stop
        distance = haversine(lat, lon, float(stop_lat), float(stop_lon))
        stop_distances.append((distance, stop_id, stop_title, stop_lat, stop_lon, stop_tag, direction_id, direction_title, direction_name, route_id, route_title))

    stop_distances.sort(key=lambda x: x[0])
    return stop_distances[:num_results]

latitude = 43.626069
longitude = -79.490618

def get_closest_test():
    closest_stops = get_closest_stops(latitude, longitude, num_results=6)

    print(f"The {len(closest_stops)} closest stops to the coordinates ({latitude}, {longitude}):")
    for stop in closest_stops:
        distance, stop_id, stop_title, stop_lat, stop_lon, stop_tag, direction_id, direction_title, direction_name, route_id, route_title = stop
        print(f"\nStop ID: {stop_id}")
        print(f"Stop Title: {stop_title}")
        print(f"Latitude: {stop_lat}, Longitude: {stop_lon}")
        print(f"Stop Tag: {stop_tag}")
        print(f"Direction ID: {direction_id}, Direction Title: {direction_title}, Direction Name: {direction_name}")
        print(f"Route ID: {route_id}, Route Title: {route_title}")
        print(f"Distance: {distance:.2f} m")
