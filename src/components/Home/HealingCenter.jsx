import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { generateQuestionsWithClaude } from '../../utils/aiService'
import heartIcon from '../../assets/icons/heart.png'

function HealingCenter({ playerTeam, currentTopic, onHealComplete }) {
  const [selectedCreature, setSelectedCreature] = useState(null)
  const [question, setQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(false)

  const needsHealing = playerTeam?.filter(pc => {
    const maxHP = Math.floor(pc.creatures.base_hp + (pc.level * 2))
    const currentHP = pc.current_hp ?? maxHP
    return currentHP < maxHP
  }) || []

  const startHealing = async (creature) => {
    if (!currentTopic) {
      alert('Please select a study topic first!')
      return
    }

    setSelectedCreature(creature)
    setLoading(true)
    setShowResult(false)
    setUserAnswer('')

    try {
      // Generate question using Claude AI
      const questions = await generateQuestionsWithClaude(currentTopic.topic_name, 'medium', 1)
      setQuestion(questions[0])
    } catch (error) {
      console.error('Error generating question:', error)
      alert('Error generating question. Please try again.')
      setSelectedCreature(null)
    } finally {
      setLoading(false)
    }
  }

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return

    setLoading(true)
    try {
      // Check if answer is correct
      const correct = userAnswer.trim().toLowerCase() === question.answer.toLowerCase()
      setIsCorrect(correct)
      setShowResult(true)

      if (correct) {
        // Heal the creature
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const maxHP = Math.floor(selectedCreature.creatures.base_hp + (selectedCreature.level * 2))

        await supabase
          .from('user_creatures')
          .update({ current_hp: maxHP })
          .eq('id', selectedCreature.id)
          .eq('user_id', user.id)

        // Refresh data
        setTimeout(() => {
          onHealComplete()
          setSelectedCreature(null)
          setQuestion(null)
          setShowResult(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelHealing = () => {
    setSelectedCreature(null)
    setQuestion(null)
    setShowResult(false)
    setUserAnswer('')
  }

  return (
    <div className="bg-gradient-to-br from-rose-800 via-pink-900 to-red-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-rose-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,114,182,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={heartIcon} alt="Healing" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          <h2 className="text-2xl font-bold text-amber-50">Healing Center</h2>
        </div>

        {!selectedCreature ? (
          // Creature Selection
          <div>
            {needsHealing.length === 0 ? (
              <p className="text-rose-200 text-center py-8 font-semibold">All your StudyMons are healthy! 🎉</p>
            ) : (
              <div className="space-y-3">
                <p className="text-rose-200 font-semibold mb-4 text-center">
                  Select a StudyMon to heal by answering a question:
                </p>
                {needsHealing.map(pc => {
                  const maxHP = Math.floor(pc.creatures.base_hp + (pc.level * 2))
                  const currentHP = pc.current_hp ?? maxHP
                  const hpPercentage = (currentHP / maxHP) * 100

                  return (
                    <div
                      key={pc.id}
                      onClick={() => startHealing(pc)}
                      className="bg-gradient-to-r from-rose-900 to-pink-950 rounded-2xl p-4 border-3 border-rose-800 shadow-md cursor-pointer hover:shadow-lg transition-all hover:from-rose-800 hover:to-pink-900"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{pc.creatures.sprite}</div>
                        <div className="flex-1">
                          <p className="text-amber-100 font-bold text-lg">{pc.creatures.name}</p>
                          <p className="text-rose-200 text-sm">Lv. {pc.level}</p>
                          <div className="mt-2">
                            <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-2.5 border-2 border-rose-900 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full"
                                style={{ width: `${hpPercentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-amber-200 mt-1 font-semibold">
                              {currentHP}/{maxHP} HP
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          // Question Display
          <div>
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-6 mb-6 border-4 border-dashed border-rose-800 shadow-inner">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{selectedCreature.creatures.sprite}</div>
                <p className="text-amber-100 font-bold text-lg">{selectedCreature.creatures.name}</p>
              </div>

              {loading ? (
                <p className="text-amber-200 text-center py-4 font-semibold">Generating question...</p>
              ) : question ? (
                <div className="space-y-4">
                  <div className="bg-rose-950 rounded-2xl p-4 border-2 border-rose-800">
                    <p className="text-amber-50 font-semibold mb-2">Question:</p>
                    <p className="text-amber-100">{question.question}</p>
                  </div>

                  {!showResult && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full p-3 rounded-2xl bg-stone-900 border-3 border-rose-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-800 shadow-inner font-semibold"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                      />
                      
                      <div className="flex gap-3">
                        <button
                          onClick={checkAnswer}
                          disabled={!userAnswer.trim() || loading}
                          className="flex-1 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-3 rounded-full border-4 border-double border-green-950 shadow-lg transition-all relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                          <span className="relative">Submit Answer</span>
                        </button>
                        
                        <button
                          onClick={cancelHealing}
                          className="bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-amber-100 font-bold px-6 py-3 rounded-full border-4 border-double border-stone-950 shadow-lg transition-all relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-all"></div>
                          <span className="relative">Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {showResult && (
                    <div className={`rounded-2xl p-6 text-center border-4 ${
                      isCorrect 
                        ? 'bg-gradient-to-br from-green-800 to-green-950 border-green-700' 
                        : 'bg-gradient-to-br from-red-900 to-red-950 border-red-800'
                    }`}>
                      <p className="text-3xl mb-2">{isCorrect ? '✅' : '❌'}</p>
                      <p className="text-amber-50 font-bold text-xl mb-2">
                        {isCorrect ? 'Correct! Healing...' : 'Incorrect!'}
                      </p>
                      {!isCorrect && (
                        <div className="mt-4">
                          <p className="text-amber-200 text-sm mb-2">Correct answer:</p>
                          <p className="text-amber-100 font-bold">{question.answer}</p>
                          <button
                            onClick={() => {
                              setShowResult(false)
                              setUserAnswer('')
                            }}
                            className="mt-4 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-amber-50 font-bold px-6 py-2 rounded-full border-4 border-double border-blue-950 shadow-lg transition-all relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                            <span className="relative">Try Again</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HealingCenter

