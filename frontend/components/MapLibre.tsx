"use client";
import React from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import type { FeatureCollection, LineString, Point } from "geojson";

// Convert your points into GeoJSON LineString features
const paths = [
  [
    [ -79.48948, 43.61324 ],
    [ -79.48945, 43.61345 ],
    [ -79.4893, 43.61377 ],
    [ -79.4899499, 43.61371 ],
    [ -79.49186, 43.61328 ],
    [ -79.49214, 43.61322 ],
    [ -79.4927699, 43.61306 ],
    [ -79.4929, 43.6131 ],
    [ -79.49298, 43.613 ],
    [ -79.49335, 43.61293 ],
    [ -79.49415, 43.61277 ],
    [ -79.49507, 43.61259 ],
    [ -79.49545, 43.61251 ],
    [ -79.49641, 43.61236 ],
    [ -79.49674, 43.6122299 ],
    [ -79.49712, 43.6130799 ],
    [ -79.49762, 43.61432 ],
    [ -79.4977399, 43.61496 ]
  ],
  [
    [ -79.50178, 43.62643 ],
    [ -79.50152, 43.6266 ],
    [ -79.50068, 43.62669 ],
    [ -79.50053, 43.6268 ],
    [ -79.50031, 43.62684 ],
    [ -79.49954, 43.62702 ],
    [ -79.49856, 43.62723 ],
    [ -79.4983, 43.62728 ],
    [ -79.49735, 43.6275 ],
    [ -79.49723, 43.6274299 ],
    [ -79.49712, 43.62754 ],
    [ -79.49626, 43.62773 ],
    [ -79.4959, 43.6278099 ],
    [ -79.49517, 43.62797 ],
    [ -79.49468, 43.62798 ],
    [ -79.49458, 43.62809 ],
    [ -79.49422, 43.62729 ],
    [ -79.49393, 43.6266 ],
    [ -79.49369, 43.62599 ],
    [ -79.49364, 43.62587 ],
    [ -79.49362, 43.62566 ],
    [ -79.49329, 43.62505 ],
    [ -79.49318, 43.6248 ],
    [ -79.4931299, 43.6247 ],
    [ -79.49309, 43.6246 ],
    [ -79.49297, 43.62436 ],
    [ -79.49285, 43.62407 ],
    [ -79.49253, 43.62336 ],
    [ -79.49257, 43.62318 ]
  ]
  // ... you can add the rest of your paths here
];

const lineGeoJSON: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: paths.map((coords) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coords
    },
    properties: {}
  }))
};

const pointGeoJSON: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: paths.flatMap((coords) =>
    coords.map(([lng, lat]) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {}
    }))
  )
};


export default function MapWithPaths() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Map
        mapLib={import("maplibre-gl")}
        initialViewState={{
          longitude: -79.49,
          latitude: 43.613,
          zoom: 13
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      >
        <NavigationControl position="top-right" />

        {/* Line layer */}
        <Source id="lines" type="geojson" data={lineGeoJSON}>
          <Layer
            id="line-layer"
            type="line"
            paint={{
              "line-color": "#ff0000",
              "line-width": 3
            }}
          />
        </Source>

        {/* Point layer */}
        <Source id="points" type="geojson" data={pointGeoJSON}>
          <Layer
            id="point-layer"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#0000ff"
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
