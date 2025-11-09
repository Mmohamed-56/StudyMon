// AI Service for generating study questions using Claude API
// You'll need to add your Anthropic API key to environment variables

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export const generateQuestion = async (topic, difficulty = 'medium') => {
  // Better mock questions based on common subjects
  const topicLower = topic?.toLowerCase() || 'general'
  
  const questionBank = {
    biology: {
      easy: [
        { question: 'What is the powerhouse of the cell?', answer: 'mitochondria', difficulty: 'easy' },
        { question: 'What carries oxygen in blood?', answer: 'hemoglobin', difficulty: 'easy' },
        { question: 'What is the basic unit of life?', answer: 'cell', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What process converts glucose to ATP?', answer: 'cellular respiration', difficulty: 'medium' },
        { question: 'What molecule carries genetic information?', answer: 'DNA', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What is the name of programmed cell death?', answer: 'apoptosis', difficulty: 'hard' }
      ]
    },
    math: {
      easy: [
        { question: 'What is 7 × 8?', answer: '56', difficulty: 'easy' },
        { question: 'What is 15 + 27?', answer: '42', difficulty: 'easy' },
        { question: 'What is 100 ÷ 4?', answer: '25', difficulty: 'easy' }
      ],
      medium: [
        { question: 'Solve: 3x + 5 = 20. What is x?', answer: '5', difficulty: 'medium' },
        { question: 'What is the square root of 144?', answer: '12', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What is the derivative of x²?', answer: '2x', difficulty: 'hard' }
      ]
    },
    history: {
      easy: [
        { question: 'Who was the first US president?', answer: 'washington', difficulty: 'easy' },
        { question: 'In what year did WWII end?', answer: '1945', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What year was the Declaration of Independence signed?', answer: '1776', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What treaty ended WWI?', answer: 'versailles', difficulty: 'hard' }
      ]
    },
    chemistry: {
      easy: [
        { question: 'What is the chemical symbol for water?', answer: 'H2O', difficulty: 'easy' },
        { question: 'What is the atomic number of carbon?', answer: '6', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What is the pH of a neutral solution?', answer: '7', difficulty: 'medium' }
      ],
      hard: [
        { question: "What is Avogadro's number? (scientific notation)", answer: '6.02e23', difficulty: 'hard' }
      ]
    },
    physics: {
      easy: [
        { question: 'What is the unit of force?', answer: 'newton', difficulty: 'easy' },
        { question: 'What does F = ma stand for?', answer: 'force equals mass times acceleration', difficulty: 'easy' },
        { question: 'What is the speed of light? (in m/s)', answer: '3e8', difficulty: 'easy' }
      ],
      medium: [
        { question: 'What is the formula for kinetic energy?', answer: '1/2mv^2', difficulty: 'medium' },
        { question: "What is Newton's first law called?", answer: 'inertia', difficulty: 'medium' },
        { question: 'What is the acceleration due to gravity on Earth? (m/s²)', answer: '9.8', difficulty: 'medium' }
      ],
      hard: [
        { question: 'What is the centripetal force formula?', answer: 'mv^2/r', difficulty: 'hard' },
        { question: "What is Hooke's Law formula?", answer: 'F=-kx', difficulty: 'hard' }
      ]
    }
  }

  // Find matching topic or use general
  let selectedTopic = questionBank[topicLower] || {
    easy: [
      { question: `Name one important concept in ${topic}`, answer: 'knowledge', difficulty: 'easy' }
    ],
    medium: [
      { question: `What is a key principle of ${topic}?`, answer: 'understanding', difficulty: 'medium' }
    ],
    hard: [
      { question: `What is an advanced topic in ${topic}?`, answer: 'mastery', difficulty: 'hard' }
    ]
  }

  // Simulate API delay (make it more visible)
  await new Promise(resolve => setTimeout(resolve, 1000))

  const questions = selectedTopic[difficulty] || selectedTopic.medium || selectedTopic.easy
  return questions[Math.floor(Math.random() * questions.length)]
}

// Claude API Integration via Netlify Backend
export const generateQuestionsWithClaude = async (topic, difficulty, count = 1) => {
  console.log(`Generating ${count} ${difficulty} question(s) for ${topic}`)
  
  // Check if running on localhost or production
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  // In development, use mock questions (faster, no backend needed)
  if (isDev) {
    console.log('[DEV MODE] Using mock questions')
    try {
      const questions = []
      for (let i = 0; i < count; i++) {
        const q = await generateQuestion(topic, difficulty)
        if (q && q.question) {
          questions.push(q)
        }
      }
      return questions.length > 0 ? questions : [{
        question: 'What is 2 + 2?',
        answer: '4',
        difficulty: difficulty
      }]
    } catch (error) {
      console.error('Error generating mock questions:', error)
      return [{
        question: 'What is 2 + 2?',
        answer: '4',
        difficulty: difficulty
      }]
    }
  }

  // In production, try Claude API first, fallback to mocks
  /* NETLIFY BACKEND - Re-enabled! */
  
  // Check if running on localhost or production
  const isDev = window.location.hostname === 'localhost'
  
  if (isDev) {
    // Development: Use mock questions
    const questions = []
    for (let i = 0; i < count; i++) {
      questions.push(await generateQuestion(topic, difficulty))
    }
    return questions
  }

  // Production: Call Netlify function
  try {
    console.log('[PRODUCTION] Calling Claude API via backend...')
    const response = await fetch('/.netlify/functions/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        difficulty,
        count
      })
    })

    if (!response.ok) {
      console.warn(`Backend returned ${response.status}, falling back to mocks`)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[PRODUCTION] Got questions from Claude:', data.questions)
    return data.questions
  } catch (error) {
    console.error('Error calling backend API:', error)
    console.log('[PRODUCTION] Using mock questions as fallback')
    // Fallback to mock questions
    const questions = []
    for (let i = 0; i < count; i++) {
      const q = await generateQuestion(topic, difficulty)
      if (q && q.question) {
        questions.push(q)
      }
    }
    return questions.length > 0 ? questions : [{
      question: 'What is 2 + 2?',
      answer: '4',
      difficulty: difficulty
    }]
  }
}

