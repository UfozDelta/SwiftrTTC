import sqlite3
import json

# Connect to SQLite database (create if not exists)
conn = sqlite3.connect('transportation.db')
cursor = conn.cursor()

# Create tables if they don't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS routes (
    route_id TEXT PRIMARY KEY,
    route_title TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS directions (
    direction_id TEXT PRIMARY KEY,
    route_id TEXT,
    direction_title TEXT,
    direction_name TEXT,
    FOREIGN KEY(route_id) REFERENCES routes(route_id)
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS stops (
    stop_id TEXT PRIMARY KEY,
    stop_title TEXT,
    lat REAL,
    lon REAL,
    stop_tag TEXT,
    direction_id TEXT,
    FOREIGN KEY(direction_id) REFERENCES directions(direction_id)
)
''')

# Function to load and insert data from the JSON file into the database
def load_and_insert_data(json_file):
    with open(json_file, 'r') as file:
        data = json.load(file)

    # Iterate over the routes in the data
    for route_key, route in data.items():
        # Extract route details
        route_id = route.get('route_id')
        if route_id is None:
            continue

        # Insert route into the routes table
        cursor.execute('''
        INSERT OR REPLACE INTO routes (route_id, route_title)
        VALUES (?, ?)
        ''', (route_id, route_key))  # Assuming route_title is the route_key (e.g., '7', '8')

        # Extract directions and insert them
        directions = route.get('directions', {})
        for direction_key, direction in directions.items():
            direction_id = direction.get('direction_id')
            direction_title = direction.get('direction_title')
            direction_name = direction.get('direction_name')

            # Insert direction into the directions table
            cursor.execute('''
            INSERT OR REPLACE INTO directions (direction_id, route_id, direction_title, direction_name)
            VALUES (?, ?, ?, ?)
            ''', (direction_id, route_id, direction_title, direction_name))

            # Extract stops and insert them
            stops = direction.get('stops', [])
            for stop in stops:
                stop_id = stop.get('stopId')
                stop_title = stop.get('title')
                lat = stop.get('lat')
                lon = stop.get('lon')
                stop_tag = stop.get('stop_tag')

                # Insert stop into the stops table
                cursor.execute('''
                INSERT OR REPLACE INTO stops (stop_id, stop_title, lat, lon, stop_tag, direction_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (stop_id, stop_title, lat, lon, stop_tag, direction_id))

    # Commit the transaction and close the connection
    conn.commit()

# Example usage
json_file = 'fine.json'  # Replace with your actual JSON file path
load_and_insert_data(json_file)

# Close the connection after the operation
conn.close()
