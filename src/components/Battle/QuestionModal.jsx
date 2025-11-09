import { useState, useEffect } from 'react'
import { generateQuestionsWithClaude } from '../../utils/aiService'
import { supabase } from '../../utils/supabase'

function QuestionModal({ 
  isOpen, 
  onClose, 
  onCorrectAnswer, 
  currentTopic,
  actionType = 'sp' // 'sp', 'catch'
}) {
  const [difficulty, setDifficulty] = useState(null)
  const [question, setQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset when modal opens
      setDifficulty(null)
      setQuestion(null)
      setUserAnswer('')
      setShowResult(false)
      setIsCorrect(false)
    }
  }, [isOpen])

  const selectDifficulty = async (diff) => {
    setDifficulty(diff)
    setLoading(true)
    setQuestion(null) // Clear previous question

    try {
      console.log('Generating question:', { topic: currentTopic?.topic_name, difficulty: diff })
      
      let generatedQuestion = null

      if (currentTopic) {
        // Use AI to generate topic-specific question
        const questions = await generateQuestionsWithClaude(
          currentTopic.topic_name, 
          diff, 
          1
        )
        console.log('Got questions from AI:', questions)
        generatedQuestion = questions && questions.length > 0 ? questions[0] : null
      } else {
        // Fallback to database questions
        const { data, error } = await supabase
          .from('battle_questions')
          .select('*')
          .eq('difficulty', diff)
          .is('topic_id', null)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching question from DB:', error)
        } else if (data && data.length > 0) {
          generatedQuestion = data[Math.floor(Math.random() * data.length)]
          console.log('Got question from DB:', generatedQuestion)
        }
      }

      // Ensure we have a valid question
      if (!generatedQuestion || !generatedQuestion.question) {
        console.warn('No question generated, using fallback')
        generatedQuestion = {
          question: 'What is 2 + 2?',
          answer: '4',
          difficulty: diff
        }
      }

      console.log('Setting question:', generatedQuestion)
      setQuestion(generatedQuestion)
    } catch (error) {
      console.error('Error in selectDifficulty:', error)
      // Fallback question
      setQuestion({
        question: 'What is 2 + 2?',
        answer: '4',
        difficulty: diff
      })
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = () => {
    const correctAnswer = question.answer || question.correct_answer || '4'
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      const spReward = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15
      setTimeout(() => {
        onCorrectAnswer(spReward, difficulty)
        onClose()
      }, 1500)
    } else {
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-8 border-double border-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(148,163,184,0.1),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-amber-50 mb-2 drop-shadow-lg">
              {actionType === 'catch' ? '🎯 Catch Challenge!' : '📚 Gain SP'}
            </h2>
            <p className="text-slate-300 font-semibold">
              {actionType === 'catch' 
                ? 'Answer correctly to catch this creature!' 
                : 'Answer a question to gain Skill Points!'}
            </p>
          </div>

          {/* Difficulty Selection */}
          {!question && !loading && (
            <div className="space-y-4">
              <button
                onClick={() => selectDifficulty('easy')}
                className="w-full bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-6 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl border-4 border-double border-green-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <div className="relative">
                  <div className="text-2xl mb-1">⭐ Easy</div>
                  <div className="text-sm opacity-90">+5 SP Reward</div>
                </div>
              </button>

              <button
                onClick={() => selectDifficulty('medium')}
                className="w-full bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-amber-50 font-bold py-6 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl border-4 border-double border-yellow-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <div className="relative">
                  <div className="text-2xl mb-1">⭐⭐ Medium</div>
                  <div className="text-sm opacity-90">+10 SP Reward</div>
                </div>
              </button>

              <button
                onClick={() => selectDifficulty('hard')}
                className="w-full bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-amber-50 font-bold py-6 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl border-4 border-double border-red-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <div className="relative">
                  <div className="text-2xl mb-1">⭐⭐⭐ Hard</div>
                  <div className="text-sm opacity-90">+15 SP Reward</div>
                </div>
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-b from-stone-700 to-stone-900 hover:from-stone-600 hover:to-stone-800 text-stone-300 font-bold py-4 px-6 rounded-2xl transition-all shadow-lg border-4 border-double border-stone-950"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 animate-bounce">🤔</div>
              <p className="text-amber-50 text-xl font-bold mb-2">Generating question...</p>
              <p className="text-slate-400 text-sm">Please wait...</p>
            </div>
          )}

          {/* Question */}
          {question && !showResult && !loading && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-6 border-4 border-dashed border-stone-700 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    difficulty === 'easy' ? 'bg-green-900 text-green-200' :
                    difficulty === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-red-900 text-red-200'
                  }`}>
                    {difficulty?.toUpperCase()}
                  </span>
                </div>
                <p className="text-amber-50 text-xl font-bold leading-relaxed">
                  {question.question || 'Loading question...'}
                </p>
              </div>

              <div>
                <label className="block text-amber-50 font-bold mb-2">Your Answer:</label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                  placeholder="Type your answer..."
                  autoFocus
                  className="w-full bg-stone-900 text-amber-50 border-4 border-stone-700 rounded-xl px-6 py-4 text-lg font-semibold focus:outline-none focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-b from-stone-700 to-stone-900 hover:from-stone-600 hover:to-stone-800 text-stone-300 font-bold py-4 px-6 rounded-2xl transition-all shadow-lg border-4 border-double border-stone-950"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim()}
                  className="bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 disabled:text-stone-500 font-bold py-4 px-6 rounded-2xl transition-all shadow-lg border-4 border-double border-blue-950 disabled:border-stone-950"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className="text-center py-12">
              {isCorrect ? (
                <>
                  <div className="text-7xl mb-4">✅</div>
                  <p className="text-green-400 text-3xl font-bold mb-2">Correct!</p>
                  <p className="text-amber-50 text-xl">
                    +{difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15} SP
                  </p>
                </>
              ) : (
                <>
                  <div className="text-7xl mb-4">❌</div>
                  <p className="text-red-400 text-3xl font-bold mb-2">Wrong!</p>
                  <p className="text-amber-50 text-xl">
                    Correct answer: <span className="text-amber-300 font-bold">{question.answer || question.correct_answer}</span>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionModal

