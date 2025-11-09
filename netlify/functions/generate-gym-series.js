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
    const { seriesName, category, subtopic, description } = JSON.parse(event.body)

    if (!seriesName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Series name is required' })
      }
    }

    const topicContext = subtopic 
      ? `${seriesName} - ${subtopic}` 
      : seriesName

    const fullDescription = description 
      ? `${description}` 
      : `A comprehensive gym series covering ${topicContext}`

    // Generate gym series with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 16000,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: `You are designing a Pokemon-style gym challenge series for studying "${topicContext}" (Category: ${category}).

Create 8 themed gyms with progressive difficulty. Each gym should have:
1. A creative gym leader name (thematic, like "Professor Newton" or "Captain Syntax")
2. A specific badge name related to the subtopic (like "Mechanics Badge" or "Grammar Badge")
3. A single emoji badge icon
4. 40 unique study questions with varied phrasing

Difficulty tiers:
- Gyms 1-2: Easy (introductory, basic concepts)
- Gyms 3-4: Medium (intermediate, application)
- Gyms 5-6: Hard (advanced, synthesis)
- Gyms 7-8: Expert (mastery, edge cases)

${fullDescription}

Return ONLY valid JSON in this exact format:
{
  "gyms": [
    {
      "gymNumber": 1,
      "leaderName": "Professor Newton",
      "badgeName": "Mechanics Badge",
      "badgeEmoji": "⚙️",
      "difficultyTier": "easy",
      "questions": [
        { "question": "What is Newton's first law?", "answer": "An object in motion stays in motion unless acted upon by a force" },
        ... 39 more questions
      ]
    },
    ... 7 more gyms
  ]
}

Make questions DIVERSE and UNIQUE. Avoid repetition. Focus each gym on a specific subtopic within ${topicContext}.`
      }]
    })

    const responseText = message.content[0].text
    console.log('Claude response:', responseText.substring(0, 500))

    // Parse the JSON response
    let parsedData
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        parsedData = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      throw new Error('Invalid response format from AI')
    }

    if (!parsedData.gyms || parsedData.gyms.length !== 8) {
      throw new Error('AI did not return 8 gyms')
    }

    // Validate each gym has 40 questions
    for (let gym of parsedData.gyms) {
      if (!gym.questions || gym.questions.length < 40) {
        console.warn(`Gym ${gym.gymNumber} has only ${gym.questions?.length || 0} questions, padding...`)
        // Pad with fallback questions if needed
        while (!gym.questions || gym.questions.length < 40) {
          gym.questions = gym.questions || []
          gym.questions.push({
            question: `Sample question about ${topicContext} (${gym.difficultyTier})`,
            answer: 'Sample answer'
          })
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gyms: parsedData.gyms })
    }

  } catch (error) {
    console.error('Error generating gym series:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate gym series',
        details: error.message 
      })
    }
  }
}

