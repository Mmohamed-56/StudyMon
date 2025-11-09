// Netlify Function to generate subtopics using Claude API

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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Given the study topic "${topic}", suggest 5-8 specific subtopics that a student might need to focus on.

These should be:
- Specific and focused (not too broad)
- Common areas students study
- Natural subdivisions of the main topic
- Appropriate for quizzing

For example:
- Topic: "Physics A" → Subtopics: ["Kinematics", "Newton's Laws", "Free Body Diagrams", "Work and Energy", "Momentum"]
- Topic: "Biology" → Subtopics: ["Cell Structure", "DNA and Genetics", "Evolution", "Ecology", "Human Body Systems"]
- Topic: "Calculus" → Subtopics: ["Limits", "Derivatives", "Integrals", "Related Rates", "Optimization"]

Format as JSON array of strings:
["Subtopic 1", "Subtopic 2", "Subtopic 3", ...]

Return ONLY the JSON array, no other text.`
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Claude API error:', data)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to generate subtopics', details: data })
      }
    }

    // Parse Claude's response
    try {
      const jsonText = data.content[0].text.trim()
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const subtopics = JSON.parse(cleanJson)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ subtopics })
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', data.content[0].text)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to parse subtopics',
          rawResponse: data.content[0].text 
        })
      }
    }
  } catch (error) {
    console.error('Error in generate-subtopics function:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

