import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get API token from environment variables
    const apiToken = Deno.env.get('WAQI_API_TOKEN')
    
    if (!apiToken) {
      throw new Error('WAQI_API_TOKEN not found in environment variables')
    }

    // Fetch Singapore AQI data from World Air Quality Index API
    const response = await fetch(`https://api.waqi.info/feed/singapore/?token=${apiToken}`)
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'ok') {
      throw new Error(`API returned error: ${data.data || 'Unknown error'}`)
    }

    // Extract and format the relevant data
    const aqiInfo = {
      aqi: data.data.aqi || 0,
      city: data.data.city?.name || 'Singapore',
      dominantPollutant: data.data.dominentpol || 'pm25',
      pm25: data.data.iaqi?.pm25?.v || 0,
      pm10: data.data.iaqi?.pm10?.v || 0,
      o3: data.data.iaqi?.o3?.v || 0,
      no2: data.data.iaqi?.no2?.v || 0,
      so2: data.data.iaqi?.so2?.v || 0,
      co: data.data.iaqi?.co?.v || 0,
      time: data.data.time?.s || new Date().toISOString(),
      temperature: data.data.iaqi?.t?.v || 0,
      humidity: data.data.iaqi?.h?.v || 0,
    }

    return new Response(
      JSON.stringify(aqiInfo),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching Singapore AQI:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch Singapore AQI data',
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})