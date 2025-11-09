const fetch = require('node-fetch')

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { text, duration = 1.0 } = JSON.parse(event.body)

    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text description is required' })
      }
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'ElevenLabs API key not configured' })
      }
    }

    // Call ElevenLabs Sound Effects API
    const response = await fetch(
      'https://api.elevenlabs.io/v1/sound-generation',
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          duration_seconds: duration,
          prompt_influence: 0.3
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs Sound API error:', errorText)
      throw new Error(`ElevenLabs error: ${response.status}`)
    }

    // Get audio buffer
    const audioBuffer = await response.buffer()
    
    // Return as base64 encoded MP3
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg'
      })
    }

  } catch (error) {
    console.error('Error generating sound:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate sound',
        details: error.message 
      })
    }
  }
}

