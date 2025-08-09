"use client"
import {BusStop} from "@/components/BusStop";
import Intro from "@/components/Intro";
import LiveBusMap from "@/components/LiveMap";
import MapWithPaths from "@/components/MapLibre";

export default function Home() {
  return (
    <div className="">
      <Intro />
      <BusStop />
      {/* <LiveBusMap /> */}
      <MapWithPaths />
    </div>
  );
}
