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
    console.log('Starting Singapore AQI fetch from aqicn.org API...')
    
    // Get API token from environment variables
    const apiToken = Deno.env.get('AQICN_API_TOKEN')
    
    if (!apiToken) {
      console.error('AQICN_API_TOKEN not found in environment variables')
      throw new Error('AQICN_API_TOKEN not found in environment variables')
    }

    console.log('API token found, fetching data from aqicn.org API...')

    // Fetch Singapore East AQI data from aqicn.org API
    // Format: https://api.aqicn.org/feed/@{station_id}/?token={token}
    // For Singapore East, using the specific feed endpoint
    const apiUrl = `https://api.aqicn.org/feed/singapore/east/?token=${apiToken}`
    console.log('Fetching from URL:', apiUrl.replace(apiToken, '[REDACTED]'))
    
    const response = await fetch(apiUrl)
    console.log('API Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API request failed with status: ${response.status}, body: ${errorText}`)
      throw new Error(`API request failed with status: ${response.status}`)
    }

    const data = await response.json()
    console.log('API Response data status:', data.status)
    console.log('Full response data:', JSON.stringify(data, null, 2))
    
    if (data.status !== 'ok') {
      console.error('API returned error:', data.data || 'Unknown error')
      throw new Error(`API returned error: ${data.data || 'Unknown error'}`)
    }

    console.log('Successfully received AQI data for:', data.data?.city?.name || 'Singapore East')

    // Extract and format the relevant data from aqicn.org format
    const aqiInfo = {
      aqi: data.data?.aqi || 0,
      city: data.data?.city?.name || 'Singapore East',
      dominantPollutant: data.data?.dominentpol || 'pm25',
      pm25: data.data?.iaqi?.pm25?.v || 0,
      pm10: data.data?.iaqi?.pm10?.v || 0,
      o3: data.data?.iaqi?.o3?.v || 0,
      no2: data.data?.iaqi?.no2?.v || 0,
      so2: data.data?.iaqi?.so2?.v || 0,
      co: data.data?.iaqi?.co?.v || 0,
      time: data.data?.time?.s || new Date().toISOString(),
      temperature: data.data?.iaqi?.t?.v || 0,
      humidity: data.data?.iaqi?.h?.v || 0,
    }

    console.log('Formatted AQI data:', JSON.stringify(aqiInfo, null, 2))

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
        details: error.toString(),
        timestamp: new Date().toISOString()
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