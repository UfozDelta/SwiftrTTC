import {BusStop} from "@/components/BusStop";
import Intro from "@/components/Intro";
import LiveBusMap from "@/components/LiveMap";

export default function Home() {
  return (
    <div className="">
      <Intro />
      <BusStop />
      <LiveBusMap />
    </div>
  );
}
