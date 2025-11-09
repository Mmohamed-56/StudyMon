// Netlify Function to generate questions using Claude API
// This avoids CORS issues by calling Claude from the backend

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { topic, difficulty, count = 1 } = JSON.parse(event.body)

    // Validate inputs
    if (!topic || !difficulty) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing topic or difficulty' })
      }
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid difficulty. Use: easy, medium, or hard' })
      }
    }

    // Get API key from environment
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
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Generate ${count} ${difficulty} difficulty question(s) about ${topic}.

Format as JSON array:
[{
  "question": "the question text",
  "answer": "the correct answer",
  "difficulty": "${difficulty}"
}]

Requirements:
- Questions should be clear and educational
- Answers should be concise (1-3 words when possible)
- For multiple choice, answers should be unambiguous
- Match the difficulty level appropriately
- Return ONLY the JSON array, no other text`
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Claude API error:', data)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to generate questions', details: data })
      }
    }

    // Parse Claude's response
    let questions
    try {
      // Claude returns JSON in content[0].text
      const jsonText = data.content[0].text.trim()
      // Remove markdown code blocks if present
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      questions = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', data.content[0].text)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to parse questions',
          rawResponse: data.content[0].text 
        })
      }
    }

    // Return questions
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ questions })
    }
  } catch (error) {
    console.error('Error in generate-questions function:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

