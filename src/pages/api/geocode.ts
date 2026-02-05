import type { NextApiRequest, NextApiResponse } from 'next'

type GeocodeResponse = {
  lat: number
  lng: number
} | {
  error: string
}

/**
 * Geocoding API proxy
 * Converts address strings to lat/lng coordinates using Google Geocoding API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeocodeResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { address } = req.body

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Geocoding API key not configured' })
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'ZERO_RESULTS') {
      return res.status(404).json({ error: 'Address not found' })
    }

    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data.status, data.error_message)
      return res.status(500).json({ error: `Geocoding failed: ${data.status}` })
    }

    const location = data.results[0]?.geometry?.location

    if (!location) {
      return res.status(404).json({ error: 'Could not extract coordinates' })
    }

    return res.status(200).json({
      lat: location.lat,
      lng: location.lng
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return res.status(500).json({ error: 'Geocoding request failed' })
  }
}
