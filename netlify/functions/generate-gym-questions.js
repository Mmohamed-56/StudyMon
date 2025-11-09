const Anthropic = require('@anthropic-ai/sdk')

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const { seriesName, subtopic, gymLeaderName, focusArea, difficultyTier } = JSON.parse(event.body)

    if (!seriesName || !gymLeaderName || !difficultyTier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    const topicContext = subtopic 
      ? `${seriesName} - ${subtopic}` 
      : seriesName

    const focusContext = focusArea 
      ? ` focusing on ${focusArea}`
      : ''

    // Generate 40 questions for this specific gym
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8000,
      temperature: 0.9,
      messages: [{
        role: 'user',
        content: `You are ${gymLeaderName}, a gym leader specializing in ${topicContext}${focusContext}.

Generate 40 UNIQUE study questions at ${difficultyTier} difficulty level.

Difficulty guidelines:
- Easy: Basic definitions, simple recall, straightforward concepts
- Medium: Application, problem-solving, understanding connections
- Hard: Complex scenarios, synthesis, multi-step reasoning
- Expert: Edge cases, mastery-level, expert analysis

Questions should:
- Cover different aspects of ${focusArea || topicContext}
- Vary in phrasing and format
- Be UNIQUE (no repetition)
- Have clear, concise answers
- Test understanding, not just memorization

Return ONLY valid JSON array in this exact format:
[
  { "question": "What is Newton's first law of motion?", "answer": "An object in motion stays in motion unless acted upon by an external force" },
  { "question": "Define inertia.", "answer": "The tendency of an object to resist changes in its state of motion" },
  ... 38 more questions
]

Generate all 40 questions NOW. Timestamp: ${Date.now()}`
      }]
    })

    const responseText = message.content[0].text
    console.log('Claude response:', responseText.substring(0, 300))

    // Parse the JSON response
    let questions
    try {
      // Try to extract JSON array if wrapped in markdown
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        questions = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      throw new Error('Invalid response format from AI')
    }

    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array')
    }

    // Ensure we have 40 questions
    if (questions.length < 40) {
      console.warn(`Only got ${questions.length} questions, padding...`)
      while (questions.length < 40) {
        questions.push({
          question: `Sample question about ${topicContext} (${difficultyTier})`,
          answer: 'Sample answer - please regenerate this gym'
        })
      }
    }

    // Limit to exactly 40
    questions = questions.slice(0, 40)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ questions })
    }

  } catch (error) {
    console.error('Error generating gym questions:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate questions',
        details: error.message 
      })
    }
  }
}

