import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import thinking from '../../assets/icons/thinking.png'

function GymSeriesCreator({ onBack, onCreated }) {
  const [seriesName, setSeriesName] = useState('')
  const [category, setCategory] = useState('Science')
  const [subtopic, setSubtopic] = useState('')
  const [description, setDescription] = useState('')
  const [difficultyRating, setDifficultyRating] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')

  const categories = ['Science', 'Math', 'Video Games', 'History', 'Languages', 'Programming', 'Other']

  const handleGenerate = async () => {
    if (!seriesName.trim()) {
      alert('Please enter a series name!')
      return
    }

    setGenerating(true)
    setProgress('Generating gym themes...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Call backend to generate gyms with Claude
      setProgress('Calling AI to design your gym series...')
      
      const response = await fetch('/.netlify/functions/generate-gym-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesName,
          category,
          subtopic: subtopic || null,
          description: description || null
        })
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const { gyms } = await response.json()
      
      if (!gyms || gyms.length !== 8) {
        throw new Error('Invalid gym data received')
      }

      setProgress('Creating gym series in database...')

      // Create gym series
      const { data: newSeries, error: seriesError } = await supabase
        .from('gym_series')
        .insert({
          created_by: user.id,
          series_name: seriesName,
          category,
          subtopic: subtopic || null,
          description: description || null,
          difficulty_rating: difficultyRating,
          is_public: true
        })
        .select()
        .single()

      if (seriesError) {
        console.error('Error creating series:', seriesError)
        alert('Failed to create gym series')
        return
      }

      setProgress('Saving gyms and questions...')

      // Insert all 8 gyms
      const gymInserts = gyms.map((gym, index) => ({
        series_id: newSeries.id,
        gym_number: index + 1,
        gym_leader_name: gym.leaderName,
        badge_name: gym.badgeName,
        badge_emoji: gym.badgeEmoji,
        difficulty_tier: gym.difficultyTier,
        focus_area: gym.focusArea,
        voice_id: gym.voiceId || 'pNInz6obpgDQGcFmaJgB', // ElevenLabs voice ID
        intro_line: gym.introLine || `Welcome to my gym!`,
        victory_line: gym.victoryLine || `You defeated me!`,
        defeat_line: gym.defeatLine || `Better luck next time!`,
        questions: gym.questions || [],
        gym_creatures: gym.creatures || []
      }))

      const { error: gymsError } = await supabase
        .from('gym_series_gyms')
        .insert(gymInserts)

      if (gymsError) {
        console.error('Error creating gyms:', gymsError)
        alert('Failed to save gyms')
        return
      }

      setProgress('Complete! 🎉')
      setTimeout(() => {
        onCreated(newSeries)
      }, 1000)

    } catch (error) {
      console.error('Error generating gym series:', error)
      alert('Failed to generate gym series. Please try again.')
      setGenerating(false)
      setProgress('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-800 via-emerald-900 to-teal-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-green-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative text-center">
          <h2 className="text-3xl font-bold text-amber-50 mb-2 drop-shadow-lg">Create Gym Series</h2>
          <p className="text-green-200 font-semibold">Design 8 challenging gyms for the community!</p>
        </div>
      </div>

      {generating ? (
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-12 text-center border-8 border-double border-stone-950 shadow-2xl">
          <img 
            src={thinking} 
            alt="Generating" 
            className="w-24 h-24 mx-auto mb-6 animate-bounce" 
            style={{ imageRendering: 'pixelated' }} 
          />
            <p className="text-amber-50 text-2xl font-bold mb-4">Generating Your Gym Series...</p>
            <p className="text-amber-200 text-lg mb-2">{progress}</p>
            <p className="text-stone-400 text-sm">This should take ~10-15 seconds...</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-8 border-8 border-double border-stone-950 shadow-2xl space-y-6">
          {/* Series Name */}
          <div>
            <label className="block text-amber-50 font-bold mb-2">Series Name *</label>
            <input
              type="text"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              placeholder="e.g., Physics Fundamentals"
              className="w-full bg-stone-900 text-amber-50 border-4 border-stone-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-amber-50 font-bold mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-stone-900 text-amber-50 border-4 border-stone-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-600 transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subtopic */}
          <div>
            <label className="block text-amber-50 font-bold mb-2">Subtopic (Optional)</label>
            <input
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g., Mechanics, Valorant, World War II"
              className="w-full bg-stone-900 text-amber-50 border-4 border-stone-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-600 transition-colors"
            />
            <p className="text-stone-400 text-sm mt-1">Helps AI generate more focused questions</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-amber-50 font-bold mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this gym series covers..."
              rows={3}
              className="w-full bg-stone-900 text-amber-50 border-4 border-stone-700 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          {/* Difficulty Rating */}
          <div>
            <label className="block text-amber-50 font-bold mb-2">Difficulty Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setDifficultyRating(rating)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border-4 ${
                    difficultyRating === rating
                      ? 'bg-gradient-to-b from-amber-600 to-orange-700 text-amber-50 border-amber-900'
                      : 'bg-gradient-to-b from-stone-700 to-stone-800 text-stone-400 border-stone-900 hover:from-stone-600 hover:to-stone-700'
                  }`}
                >
                  {'★'.repeat(rating)}
                </button>
              ))}
            </div>
            <p className="text-stone-400 text-sm mt-1">How hard are the questions?</p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 border-4 border-blue-950">
            <p className="text-blue-200 text-sm font-semibold mb-2">ℹ️ What happens next:</p>
            <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
              <li>AI generates 8 themed gym leaders (~10 seconds)</li>
              <li>Questions generated when gyms are first entered</li>
              <li>Gyms 1-2: Easy | 3-4: Medium | 5-6: Hard | 7-8: Expert</li>
              <li>Series becomes public for all players!</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-stone-300 font-bold py-4 rounded-2xl border-4 border-double border-stone-950 shadow-lg transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-4 rounded-2xl border-4 border-double border-green-950 shadow-xl transition-all"
            >
              Generate Gym Series
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GymSeriesCreator

