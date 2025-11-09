import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import trophy from '../../assets/icons/trophy.png'

function GymSeriesDetail({ series, onBack, onStartGym }) {
  const [gyms, setGyms] = useState([])
  const [userProgress, setUserProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGyms()
  }, [series])

  const loadGyms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load all gyms in this series
      const { data: gymsData } = await supabase
        .from('gym_series_gyms')
        .select('*')
        .eq('series_id', series.id)
        .order('gym_number', { ascending: true })

      setGyms(gymsData || [])

      // Load user's progress for this series
      const { data: progress } = await supabase
        .from('user_gym_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('series_id', series.id)

      // Map progress by gym number
      const progressMap = {}
      progress?.forEach(p => {
        progressMap[p.gym_number] = p
      })

      setUserProgress(progressMap)
    } catch (error) {
      console.error('Error loading gyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccessGym = (gymNumber) => {
    if (gymNumber === 1) return true
    const previousGym = userProgress[gymNumber - 1]
    return previousGym?.defeated || false
  }

  const getBadgeCount = () => {
    return Object.values(userProgress).filter(p => p.defeated).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-amber-50 text-xl font-bold">Loading gyms...</p>
      </div>
    )
  }

  const badgeCount = getBadgeCount()

  return (
    <div className="space-y-6">
      {/* Series Header */}
      <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          <button
            onClick={onBack}
            className="absolute top-0 left-0 bg-stone-700 hover:bg-stone-600 px-4 py-2 rounded-xl font-bold text-amber-200 border-2 border-stone-900 transition-all"
          >
            ← Back
          </button>

          <div className="text-center pt-8">
            <h1 className="text-4xl font-bold text-amber-50 mb-2 drop-shadow-lg">{series.series_name}</h1>
            {series.subtopic && (
              <p className="text-purple-300 text-lg font-semibold mb-2">📍 {series.subtopic}</p>
            )}
            <p className="text-purple-200 mb-4">{series.description}</p>
            
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="bg-gradient-to-br from-amber-700 to-orange-800 rounded-2xl px-6 py-3 border-4 border-double border-amber-950 shadow-xl">
                <p className="text-amber-100 text-sm mb-1">Your Badges</p>
                <div className="flex items-center gap-2 justify-center">
                  <img src={trophy} alt="Trophy" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                  <p className="text-amber-50 font-bold text-2xl">{badgeCount}/8</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl px-6 py-3 border-4 border-double border-stone-950 shadow-xl">
                <p className="text-stone-300 text-sm mb-1">Difficulty</p>
                <div className="flex gap-1 justify-center text-lg">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < series.difficulty_rating ? 'text-amber-400' : 'text-stone-700'}>★</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {gyms.map(gym => {
          const isDefeated = userProgress[gym.gym_number]?.defeated || false
          const isUnlocked = canAccessGym(gym.gym_number)
          const attempts = userProgress[gym.gym_number]?.attempts || 0

          return (
            <div
              key={gym.id}
              onClick={() => isUnlocked && onStartGym(series, gym)}
              className={`rounded-3xl p-6 text-center border-8 border-double shadow-xl transition-all relative overflow-hidden ${
                isDefeated
                  ? 'bg-gradient-to-br from-amber-700 to-orange-800 border-amber-950 cursor-pointer hover:shadow-2xl hover:-translate-y-1'
                  : isUnlocked
                  ? 'bg-gradient-to-br from-blue-800 to-indigo-900 border-blue-950 cursor-pointer hover:shadow-2xl hover:-translate-y-1'
                  : 'bg-gradient-to-br from-stone-800 to-stone-900 border-stone-950 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
              
              <div className="relative">
                {/* Gym Number Badge */}
                <div className="absolute top-0 left-0 bg-stone-950 rounded-full w-10 h-10 flex items-center justify-center border-3 border-stone-700 shadow-lg">
                  <span className="text-amber-50 font-bold">{gym.gym_number}</span>
                </div>

                {/* Status Icon */}
                <div className="text-5xl mb-3">
                  {isDefeated ? '🏆' : isUnlocked ? '🔓' : '🔒'}
                </div>

                {/* Badge Emoji */}
                <div className="text-4xl mb-2">{gym.badge_emoji}</div>

                {/* Gym Info */}
                <p className="text-amber-50 font-bold text-lg mb-1">{gym.gym_leader_name}</p>
                <p className="text-sm text-amber-200 mb-2">{gym.badge_name}</p>

                {/* Difficulty Tier */}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${
                  gym.difficulty_tier === 'easy' ? 'bg-green-800 border-green-950 text-green-200' :
                  gym.difficulty_tier === 'medium' ? 'bg-yellow-800 border-yellow-950 text-yellow-200' :
                  gym.difficulty_tier === 'hard' ? 'bg-orange-800 border-orange-950 text-orange-200' :
                  'bg-red-800 border-red-950 text-red-200'
                }`}>
                  {gym.difficulty_tier.toUpperCase()}
                </div>

                {/* Status Text */}
                {isDefeated ? (
                  <p className="text-xs text-amber-200 mt-2 font-bold">✓ Defeated</p>
                ) : isUnlocked ? (
                  <p className="text-xs text-blue-200 mt-2 font-bold">Click to Challenge</p>
                ) : (
                  <p className="text-xs text-stone-500 mt-2 font-bold">Beat Gym {gym.gym_number - 1} First</p>
                )}

                {attempts > 0 && !isDefeated && (
                  <p className="text-xs text-stone-400 mt-1">{attempts} attempt{attempts > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Summary */}
      {badgeCount === 8 && (
        <div className="bg-gradient-to-br from-yellow-700 via-amber-800 to-orange-900 rounded-3xl p-8 text-center shadow-2xl border-8 border-double border-yellow-950">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-amber-50 mb-2">Series Complete!</h2>
          <p className="text-amber-200 text-lg">You've mastered all 8 {series.series_name} gyms!</p>
        </div>
      )}
    </div>
  )
}

export default GymSeriesDetail

