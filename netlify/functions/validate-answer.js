// Netlify Function to validate answers using Claude AI
// Handles variations, abbreviations, and alternative correct answers

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { question, correctAnswer, userAnswer } = JSON.parse(event.body)

    if (!question || !correctAnswer || !userAnswer) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

    if (!ANTHROPIC_API_KEY) {
      // Fallback to simple comparison
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          isCorrect,
          feedback: isCorrect ? 'Correct!' : `Wrong. The answer was: ${correctAnswer}`
        })
      }
    }

    // Use Claude to validate answer
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are validating a student's answer to a question.

Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${userAnswer}"

Evaluate if the student's answer is essentially correct, even if:
- Different capitalization
- Abbreviations (e.g., "WWI" for "World War I")
- Different phrasing but same meaning
- Minor spelling variations

Respond with ONLY a JSON object:
{
  "isCorrect": true or false,
  "feedback": "Brief explanation (one sentence)"
}

Be generous but fair. If the core concept is right, mark it correct.`
        }]
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Claude API error:', data)
      // Fallback to simple comparison
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          isCorrect,
          feedback: isCorrect ? 'Correct!' : `Wrong. The answer was: ${correctAnswer}`
        })
      }
    }

    // Parse Claude's validation
    try {
      const jsonText = data.content[0].text.trim()
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const validation = JSON.parse(cleanJson)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(validation)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude validation:', data.content[0].text)
      // Fallback to simple comparison
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          isCorrect,
          feedback: isCorrect ? 'Correct!' : `Wrong. The answer was: ${correctAnswer}`
        })
      }
    }
  } catch (error) {
    console.error('Error in validate-answer function:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

