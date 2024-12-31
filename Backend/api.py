import json
import requests
import xml.etree.ElementTree as ET
import interface

def get_routes():
    "Returns all routes from the ttc"
    url = "https://retro.umoiq.com/service/publicXMLFeed?command=routeList&a=ttc"
    response = requests.get(url)

    xml_data = response.text
    root = ET.fromstring(xml_data)
    routes = {}

    for route in root.findall("route"):
        route_tag = route.get("tag")
        route_title = route.get("title")
        
        routes[route_tag] = route_title
    
    return routes

def get_stops(route):
    "Return all stops of {route} given"
    url = f"https://retro.umoiq.com/service/publicXMLFeed?command=routeConfig&a=ttc&r={route}&terse" # <--- terse to truncate we dont need points!
    response = requests.get(url)

    xml_data = response.text
    root = ET.fromstring(xml_data)
    stops = {}
    r = root.find("route")
    for stop in r.findall("stop"):
        stop_tag = stop.get("tag")
        stops[stop_tag] = {
            "title": stop.get("title"),
            "stopId": stop.get("stopId"),
            "lat": stop.get("lat"),
            "lon": stop.get("lon"),
            "stop_tag": stop_tag
        }

    return stops

# Function to fetch direction data for a given route
def get_directions_stops(route):
    """
    Fetches directions for the given route and returns direction info with associated stops.
    All details of stops are fetched from the same endpoint.
    """
    url = f"https://retro.umoiq.com/service/publicXMLFeed?command=routeConfig&a=ttc&r={route}&terse"
    response = requests.get(url)
    
    # Parse XML response
    xml_data = response.text
    root = ET.fromstring(xml_data)
        
    route_data = {
        'route_id': route,
        'directions': {}
    }
    
    # Get all stop details from the route configuration (stops may appear in multiple directions)
    stops_details = get_stops(route)

    # Loop through directions and stop tags
    for direction in root.find("route").findall("direction"):
        direction_title = direction.get("title")
        direction_id = direction.get("tag")
        direction_name = direction.get("name")
        
        direction_data = {
            'direction_id': direction_id,
            'direction_title': direction_title,
            'direction_name': direction_name,
            'stops': []
        }
        
        # For each stop in the direction, get stop tag
        stop_tags = [stop.get("tag") for stop in direction.findall("stop")]
        
        # For each stop tag, match it with the stop details
        for stop_tag in stop_tags:
            stop_details = stops_details.get(stop_tag)
            if stop_details:
                direction_data['stops'].append(stop_details)
        
        # Add the direction data to the route data
        route_data['directions'][direction_id] = direction_data

    return route_data

def get_bus_arrival(stop):
    "returns all bus predctions from each stopId"
    url=f'https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=ttc&stopId={stop}'
    response = requests.get(url)
    xml_data = response.text
    root = ET.fromstring(xml_data)
    predictions = {}
    
    for i in root.findall("predictions"):
        predictions[i.get("routeTitle")] = []
        for direction in i.findall("direction"):
            for pred in direction.findall("prediction"):
                p = {
                     "time": pred.get("epochTime"),
                     "sec":pred.get("seconds"),
                     "min": pred.get("minutes"),
                     "isDepart":pred.get("isDeparture"),
                     "branch":pred.get("branch"),
                     "dir_tag": pred.get("dirTag"),
                     "vehicle":pred.get("vehicle"),
                     "block":pred.get("block"),
                     "tripTag":pred.get("tripTag"),
                     "affectedByLayover": pred.get("affectedByLayover"),
                     "delayed":pred.get("delayed")
                    }
                predictions[i.get("routeTitle")].append(p)
    return predictions

def get_vehicle_location(id):
    "gets vehicle location from {id} param"
    url=f'https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocation&a=ttc&v={id}'
    response = requests.get(url)
    xml_data = response.text
    root = ET.fromstring(xml_data)
    v = root.find("vehicle")
    return {
        "id" : v.get("id"),
        "route": v.get("routeTag"),
        "lat" : v.get("lat"), 
        "lon" : v.get("lon"), 
        "time" :v.get("secsSinceReport"), 
        "predictable" : v.get("predictable"), 
        "speed" : v.get("speedKmHr")
    }

def get_all_vehicle_location(route, time):
    "Get all vechiles associated with route since time"

    url=f'https://retro.umoiq.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r={route}&t={time}'
    response = requests.get(url)
    xml_data = response.text
    root = ET.fromstring(xml_data)
    v = root.findall("vehicle")
    
    vehicles = {}
    for i in v:
        iv = {
            "id" : i.get("id"),
            "route": i.get("routeTag"),
            "lat" : i.get("lat"), 
            "lon" : i.get("lon"), 
            "time" :i.get("secsSinceReport"), 
            "predictable" : i.get("predictable"), 
            "speed" : i.get("speedKmHr"),
            "heading": i.get("heading")
            }
        vehicles[i.get("id")] = iv
    
    return vehicles

def get_closest_stops(lat, lon, number_stops) -> dict:
    closest_stops = interface.get_closest_stops(lat, lon, number_stops)
    
    all_stops = {}
    for stop in closest_stops:
        distance, stop_id, stop_title, stop_lat, stop_lon, stop_tag, direction_id, direction_title, direction_name, route_id, route_title = stop
        all_stops[stop_tag] = {
            "distance": distance,
            "stop_id": stop_id,
            "stop_title": stop_title,
            "stop_lat": stop_lat,
            "stop_lon": stop_lon,
            "direction_id": direction_id,
            "direction_title": direction_title,
            "direction_name": direction_name,
            "route_id": route_id,
        }
    return all_stops





if __name__ == "__main__":
    
    # Dump the dictionary into the JSON file
    json_file = "test.json"
    with open(json_file, mode="w") as file:
        json.dump(get_closest_stops(43.626069, -79.490618, 5), file, indent=4)  # Pretty-print with an indent of 4