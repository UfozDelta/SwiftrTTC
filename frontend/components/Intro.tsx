import { Bus, MapPin, Bell, Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function TTCBusTrackerHeader() {

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bus className="w-8 h-8" />
            <h1 className="text-2xl font-bold">TTC Bus Tracker</h1>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Button variant="ghost" className="text-primary-foreground hover:text-primary hover:bg-primary-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              Find Stops
            </Button>
            <Button variant="ghost" className="text-primary-foreground hover:text-primary hover:bg-primary-foreground">
              <Bus className="w-4 h-4 mr-2" />
              Track Routes
            </Button>
            <Button variant="ghost" className="text-primary-foreground hover:text-primary hover:bg-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </Button>
          </nav>
        </div>
      </div>
      <div className="bg-secondary">
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-black">Real-Time TTC Bus Tracking</h2>
          <p className="text-xl mb-6 text-black">Stay informed with live updates on bus locations, arrival times, and service alerts across Toronto.</p>
          <div className="flex flex-wrap justify-center gap-4">
          </div>
        </div>
      </div>
    </header>
  )
}

