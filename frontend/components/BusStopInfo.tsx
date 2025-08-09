"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Bus, Clock } from 'lucide-react'
  
// Calcualte timer form epoch
const calculateCountdown = (timestamp: number) => {
  const now = Date.now()
  const diff = Math.max(0, timestamp - now)
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { minutes, seconds }
}

// Format to make look nice
const formatArrivalTime = (timestamp: string) => {
  return new Date(parseInt(timestamp))
    .toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase()
}

interface BusStopInfoProps {
  data: any;
  num: string;
}

const formatRouteName = (name: string) => {
    // Remove dashes and split into words
    const words = name.split('-').join(' ').split(' ');
    
    // Capitalize first letter of each word and join back together
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };


const grabNumFromString = (name:string) => {
    const words = name.split('-').join(' ').split(' ');
    return words[0]
}

const BusStopInfo: React.FC<BusStopInfoProps> = ({ data, num }) => {
  
  const [currentTime, setCurrentTime] = useState(Date.now())
  
  useEffect(() => {
    // Update current time every second for countdown
    const timeTimer = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(timeTimer)
  }, [])

  if (!data || data.length === 0) return (
    <Card className="w-full max-w-md mx-auto hover:drop-shadow-xl transition-shadow duration-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          {grabNumFromString(num)}
        </CardTitle>
        <Badge variant="secondary" className="text-sm">
          <Bus className="w-4 h-4 mr-1" />
          {formatRouteName(num) || 'Main Route'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-black-500" />
          </div>
          <h3 className="text-lg font-semibold text-black-foreground mb-2">
            No Buses Available
          </h3>
          <p className="text-m text-black-foreground">
            There are currently no active buses for this route.
          </p>
        </div>
      </CardContent>
    </Card>
  )

  // Sort buses by arrival time
  const sortedBuses = [...data].sort((a, b) => 
    parseInt(a.time) - parseInt(b.time)
  )

  const nextBus = sortedBuses[0]
  
  return (
    <Card className="w-full max-w-md mx-auto hover:drop-shadow-xl transition-shadow duration-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          {nextBus.branch}
        </CardTitle>
        <Badge variant="secondary" className="text-sm">
          <Bus className="w-4 h-4 mr-1" />
          {formatRouteName(num) || 'Main Route'}
        </Badge>
      </CardHeader>
      <CardContent>
        {nextBus && (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Next arrival
            </h3>
            <div className="text-5xl font-bold">
              {(() => {
                const { minutes, seconds } = calculateCountdown(parseInt(nextBus.time))
                return `${minutes}:${seconds.toString().padStart(2, '0')}`
              })()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Arrives at {formatArrivalTime(nextBus.time)}
              {nextBus.delayed && <span className="text-red-500 ml-2">Delayed</span>}
            </p>
          </div>
        )}
        
        {sortedBuses.length > 1 && (
          <>
            <h4 className="font-semibold mb-2">Upcoming arrivals</h4>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {sortedBuses.slice(1).map((bus, index) => (
                <div key={`${bus.vehicle}-${index}`} className="flex justify-between items-center mb-2">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    {formatArrivalTime(bus.time)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {(() => {
                        const { minutes, seconds } = calculateCountdown(parseInt(bus.time))
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`
                      })()}
                    </Badge>
                    {bus.delayed && (
                      <Badge variant="destructive">Delayed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default BusStopInfo;