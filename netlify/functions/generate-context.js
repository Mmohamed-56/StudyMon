// Netlify Function to generate context suggestions for ambiguous topics

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { topic } = JSON.parse(event.body)

    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing topic' })
      }
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

    if (!ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      }
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `The user wants to study "${topic}". This topic name might be ambiguous or have multiple meanings.

Suggest 3-5 different contexts/interpretations of what they might mean, to help clarify which "${topic}" they're studying.

Examples:
- "Deadlock" could mean:
  - "The game Deadlock on Steam"
  - "Deadlocking in multithreading/programming"
  - "Deadlock in negotiations/politics"

- "Python" could mean:
  - "Python programming language"
  - "Python (the snake) - biology/zoology"
  - "Monty Python - comedy/entertainment"

- "Physics" could mean:
  - "General Physics (high school/college)"
  - "AP Physics A - Mechanics"
  - "AP Physics B - Electricity & Magnetism"
  - "University Physics I"

Format as JSON array of concise context descriptions:
["Context 1", "Context 2", "Context 3"]

Return ONLY the JSON array, no other text.`
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Claude API error:', data)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to generate contexts', details: data })
      }
    }

    // Parse Claude's response
    try {
      const jsonText = data.content[0].text.trim()
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const contexts = JSON.parse(cleanJson)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ contexts })
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', data.content[0].text)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to parse contexts',
          rawResponse: data.content[0].text 
        })
      }
    }
  } catch (error) {
    console.error('Error in generate-context function:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

