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

    // Generate gym themes only (questions generated on-demand later)
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: `You are designing a Pokemon-style gym challenge series for studying "${topicContext}" (Category: ${category}).

Create 8 themed gyms with progressive difficulty. Each gym should focus on a different aspect of ${topicContext}.

For each gym provide:
1. A creative gym leader name (thematic, like "Professor Newton" or "Captain Syntax")
2. A specific badge name related to the subtopic (like "Mechanics Badge" or "Grammar Badge")
3. A single emoji badge icon
4. A brief focus area (what this gym specializes in)
5. An intro voice line (what the gym leader says when you enter, 1-2 sentences, in character)
6. A victory line (what they say when you beat them, 1 sentence)
7. A defeat line (what they say when you lose, 1 sentence, encouraging)

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
      "focusArea": "Newton's laws of motion and basic kinematics",
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "introLine": "Welcome, young scholar! I am Professor Newton, master of mechanics. Show me you understand the fundamental laws of motion!",
      "victoryLine": "Excellent work! You have proven your understanding of the fundamentals.",
      "defeatLine": "Don't give up! Study the basics and return when you're ready."
    },
    {
      "gymNumber": 2,
      "leaderName": "Dr. Hooke",
      "badgeName": "Elasticity Badge",
      "badgeEmoji": "🔧",
      "difficultyTier": "easy",
      "focusArea": "Springs, elastic forces, and Hooke's law",
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "introLine": "Ah, a challenger! I specialize in elasticity and springs. Let's see if you can handle the tension!",
      "victoryLine": "You've mastered the elastic forces! Well done!",
      "defeatLine": "Springs can be tricky. Review the material and bounce back!"
    },
    ... 6 more gyms
  ]
}

Make each gym UNIQUE with distinct themes within ${topicContext}.`
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

    // Questions will be generated on-demand when user first enters each gym
    // For now, set empty questions array
    parsedData.gyms.forEach(gym => {
      gym.questions = [] // Will be populated on first access
    })

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

