import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import api
import time

app = Flask(__name__)
CORS(app)

@app.route('/api/routes', methods=['GET'])
def get_routes():
    d = api.get_routes()
    return jsonify(d)

@app.route("/api/routes/stops", methods=['GET'])
def get_route_info():
    route_number = request.args.get('r')
    d = api.get_stops(route_number)

    return jsonify(d)

@app.route("/api/routes/stops/lines", methods=['GET'])
def get_route_info_lines():
    route_number = request.args.get('r')
    d = api.get_stops_polylines(route_number)

    return jsonify(d)

@app.route('/api/routes/stops/arrival', methods=['GET'])
def send_data():

    stop_id = request.args.get('stopid')
    d = api.get_bus_arrival(stop_id)
    
    return jsonify(d)

@app.route("/api/routes/stops/closest")
def get_closest_stops():

    lat = request.args.get('lat')
    lon = request.args.get('lon')
    num = request.args.get("num")

    d = api.get_closest_stops(float(lat),float(lon), int(num))
    
    return jsonify(d)

@app.route("/api/routes/vehicles")
def get_all_vehicle_location():
    id = request.args.get('route')
    d = api.get_all_vehicle_location(id, int(time.time()))

    return jsonify(d)

@app.route("/api/vehicle", methods=['GET'])
def get_vehicle_location():
    id = request.args.get('id')
    d = api.get_vehicle_location(id)

    return jsonify(d)

if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=5000, debug=True)
    # For Prod
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
