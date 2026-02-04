import type { NextApiRequest, NextApiResponse } from 'next'

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface AutocompleteResponse {
  predictions: PlacePrediction[]
}

interface ErrorResponse {
  error: string
  message?: string
}

/**
 * Google Places Autocomplete Proxy API
 *
 * This endpoint proxies requests to the Google Places Autocomplete API,
 * keeping the API key secure on the server side.
 *
 * Query Parameters:
 * - input: The address search string (required)
 *
 * Returns an array of place predictions with place_id and description
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutocompleteResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { input } = req.query

  if (!input || typeof input !== 'string' || input.length < 3) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Input must be at least 3 characters'
    })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // If no API key is configured, return a 503 to signal fallback to manual entry
  if (!apiKey) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Google Places API key not configured. Please use manual address entry.'
    })
  }

  try {
    const params = new URLSearchParams({
      input,
      types: 'address',
      components: 'country:us',
      key: apiKey
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    )

    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText)
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
        message: 'Google Places API request denied. Check API key configuration.'
      })
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      })
    }

    // Return predictions array
    const predictions: PlacePrediction[] = (data.predictions || []).map(
      (p: any) => ({
        place_id: p.place_id,
        description: p.description,
        structured_formatting: p.structured_formatting
          ? {
              main_text: p.structured_formatting.main_text,
              secondary_text: p.structured_formatting.secondary_text
            }
          : undefined
      })
    )

    res.status(200).json({ predictions })
  } catch (error) {
    console.error('Places autocomplete error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process autocomplete request'
    })
  }
}
