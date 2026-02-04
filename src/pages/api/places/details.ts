import type { NextApiRequest, NextApiResponse } from 'next'

interface ParsedAddress {
  street: string
  city: string
  state: string
  zip: string
  county?: string
  formattedAddress?: string
}

interface ErrorResponse {
  error: string
  message?: string
}

// Google Places address component types
const COMPONENT_TYPES = {
  STREET_NUMBER: 'street_number',
  ROUTE: 'route',
  LOCALITY: 'locality',
  SUBLOCALITY: 'sublocality',
  ADMINISTRATIVE_AREA_1: 'administrative_area_level_1', // State
  ADMINISTRATIVE_AREA_2: 'administrative_area_level_2', // County
  POSTAL_CODE: 'postal_code',
  COUNTRY: 'country'
} as const

/**
 * Google Places Details Proxy API
 *
 * This endpoint fetches place details from Google Places API and
 * parses the address components into a structured format.
 *
 * Query Parameters:
 * - place_id: The Google Places place_id (required)
 *
 * Returns parsed address components: street, city, state, zip, county
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedAddress | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { place_id } = req.query

  if (!place_id || typeof place_id !== 'string') {
    return res.status(400).json({
      error: 'Invalid place_id',
      message: 'place_id is required'
    })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // If no API key is configured, return a 503
  if (!apiKey) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Google Places API key not configured'
    })
  }

  try {
    const params = new URLSearchParams({
      place_id,
      fields: 'address_components,formatted_address',
      key: apiKey
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    )

    if (!response.ok) {
      console.error('Google Places Details API error:', response.status, response.statusText)
      return res.status(502).json({
        error: 'Upstream error',
        message: 'Failed to fetch from Google Places API'
      })
    }

    const data = await response.json()

    // Check for API-level errors
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied:', data.error_message)
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Google Places API request denied'
      })
    }

    if (data.status === 'NOT_FOUND' || data.status === 'INVALID_REQUEST') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Place not found'
      })
    }

    if (!data.result || !data.result.address_components) {
      return res.status(404).json({
        error: 'Invalid response',
        message: 'No address components found'
      })
    }

    // Parse address components
    const components = data.result.address_components as Array<{
      long_name: string
      short_name: string
      types: string[]
    }>

    const parsed: ParsedAddress = {
      street: '',
      city: '',
      state: '',
      zip: '',
      formattedAddress: data.result.formatted_address
    }

    let streetNumber = ''
    let route = ''

    for (const component of components) {
      const types = component.types

      if (types.includes(COMPONENT_TYPES.STREET_NUMBER)) {
        streetNumber = component.long_name
      } else if (types.includes(COMPONENT_TYPES.ROUTE)) {
        route = component.long_name
      } else if (
        types.includes(COMPONENT_TYPES.LOCALITY) ||
        types.includes(COMPONENT_TYPES.SUBLOCALITY)
      ) {
        // Prefer locality over sublocality for city name
        if (!parsed.city || types.includes(COMPONENT_TYPES.LOCALITY)) {
          parsed.city = component.long_name
        }
      } else if (types.includes(COMPONENT_TYPES.ADMINISTRATIVE_AREA_1)) {
        // Use short_name for state (e.g., "TX" instead of "Texas")
        parsed.state = component.short_name
      } else if (types.includes(COMPONENT_TYPES.ADMINISTRATIVE_AREA_2)) {
        parsed.county = component.long_name
      } else if (types.includes(COMPONENT_TYPES.POSTAL_CODE)) {
        parsed.zip = component.long_name
      }
    }

    // Combine street number and route
    if (streetNumber && route) {
      parsed.street = `${streetNumber} ${route}`
    } else if (route) {
      parsed.street = route
    } else if (streetNumber) {
      parsed.street = streetNumber
    }

    res.status(200).json(parsed)
  } catch (error) {
    console.error('Places details error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process place details request'
    })
  }
}
