"use client"

import React, { useEffect, useState} from 'react'
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import BusStopInfo from './BusStopInfo'
import { Bus } from 'lucide-react'

const formSchema = z.object({
  stopId: z.string().min(1, { message: "Stop ID is required" }).regex(/^\d+$/, { message: "Stop ID must be a number" })
})

export const BusStop = () => {
  const [data, setData] = useState({});
  const [currentStopId, setCurrentStopId] = useState<string>("");

  // Define Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stopId: "",
    },
  })

  const fetchData = async (stopId: string) => {
    if (!stopId) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/routes/stops/arrival?stopid=${stopId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const apiData = await response.json();
      setData(apiData);
    } catch (err) {
      console.log(err);
    }
  };

  // Set up auto-refresh interval when stopId changes
  useEffect(() => {
    if (currentStopId) {
      // Initial fetch
      fetchData(currentStopId);

      // Set up interval for subsequent fetches
      const interval = setInterval(() => {
        fetchData(currentStopId);
      }, 10000); // 10 seconds

      // Cleanup interval on component unmount or stopId change
      return () => clearInterval(interval);
    }
  }, [currentStopId]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setCurrentStopId(values.stopId);
  };

  // Sort the data entries by array length
  const sortedEntries = Object.entries(data)
    .sort(([, a], [, b]) => {
      return (b as any[]).length - (a as any[]).length;
    });

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <Bus className="mr-2 h-6 w-6" />
                Find Your Bus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stopId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-primary">Stop ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter stop # here" 
                            {...field} 
                            className="bg-background border-primary/20 focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-primary/70">
                          Enter the TTC bus stop number
                        </FormDescription>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    Find Buses
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEntries.map(([number, routeData]) => (
          <BusStopInfo
            key={number}
            data={routeData}
            num={number}
          />
        ))}
      </div>
    </div>
  )
}