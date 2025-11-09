import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import trophy from '../../assets/icons/trophy.png'
import mapIcon from '../../assets/icons/map.png'

function GymBrowser({ onSelectSeries, onCreateNew }) {
  const [gymSeries, setGymSeries] = useState([])
  const [userProgress, setUserProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'Science', 'Math', 'Video Games', 'History', 'Languages', 'Other']

  useEffect(() => {
    loadGymSeries()
  }, [selectedCategory])

  const loadGymSeries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load all public gym series
      let query = supabase
        .from('gym_series')
        .select('*')
        .eq('is_public', true)
        .order('total_attempts', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data: series, error } = await query

      if (error) {
        console.error('Error loading gym series:', error)
        return
      }

      setGymSeries(series || [])

      // Load user's progress for each series
      const { data: progress } = await supabase
        .from('user_gym_progress')
        .select('series_id, defeated')
        .eq('user_id', user.id)
        .eq('defeated', true)

      // Group progress by series_id
      const progressMap = {}
      progress?.forEach(p => {
        progressMap[p.series_id] = (progressMap[p.series_id] || 0) + 1
      })

      setUserProgress(progressMap)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-amber-50 text-xl font-bold">Loading gym series...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-orange-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-amber-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative text-center">
          <img src={mapIcon} alt="Map" className="w-20 h-20 mx-auto mb-4" style={{ imageRendering: 'pixelated' }} />
          <h1 className="text-4xl font-bold text-amber-50 mb-2 drop-shadow-lg">Gym Series</h1>
          <p className="text-amber-200 font-semibold">Choose a series to challenge and earn badges!</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-4 border-4 border-stone-950 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold transition-all border-2 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-b from-amber-600 to-orange-700 text-amber-50 border-amber-900'
                  : 'bg-gradient-to-b from-stone-700 to-stone-800 text-stone-300 border-stone-900 hover:from-stone-600 hover:to-stone-700'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Series List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gymSeries.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-stone-400 text-xl mb-4">No gym series found in this category.</p>
            <button
              onClick={onCreateNew}
              className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-3 px-8 rounded-2xl border-4 border-double border-green-950 shadow-xl transition-all"
            >
              Create the First One!
            </button>
          </div>
        ) : (
          gymSeries.map(series => {
            const badgeCount = userProgress[series.id] || 0
            const completionPercent = (badgeCount / 8) * 100

            return (
              <div
                key={series.id}
                className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 rounded-3xl p-6 border-8 border-double border-indigo-950 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
                onClick={() => onSelectSeries(series)}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent)]"></div>
                <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
                
                <div className="relative">
                  {/* Verified Badge */}
                  {series.is_verified && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full px-3 py-1 text-xs font-bold text-amber-50 border-2 border-blue-950 shadow-lg">
                      ✓ Verified
                    </div>
                  )}

                  {/* Series Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{series.category === 'Science' ? '🔬' : series.category === 'Math' ? '📐' : series.category === 'Video Games' ? '🎮' : series.category === 'History' ? '📜' : series.category === 'Languages' ? '🗣️' : '📚'}</span>
                      <h2 className="text-2xl font-bold text-amber-50 drop-shadow-lg">{series.series_name}</h2>
                    </div>
                    
                    {series.subtopic && (
                      <p className="text-purple-300 text-sm font-semibold mb-2">📍 {series.subtopic}</p>
                    )}
                    
                    <p className="text-purple-200 text-sm mb-3">{series.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-4 mb-4 border-4 border-dashed border-purple-800 shadow-inner">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-purple-300 mb-1">Your Progress</p>
                        <div className="flex items-center gap-2">
                          <img src={trophy} alt="Trophy" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
                          <p className="text-amber-50 font-bold text-lg">{badgeCount}/8</p>
                        </div>
                        <div className="w-full bg-stone-950 rounded-full h-2 mt-2 border border-stone-800">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-purple-300 mb-1">Difficulty</p>
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < series.difficulty_rating ? 'text-amber-400' : 'text-stone-700'}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-purple-200 mt-2">{series.total_attempts} attempts</p>
                        <p className="text-xs text-green-300">{series.total_completions} completed</p>
                      </div>
                    </div>
                  </div>

                  {/* Enter Button */}
                  <button
                    className="w-full bg-gradient-to-b from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-amber-50 font-bold py-3 rounded-2xl border-4 border-double border-amber-950 shadow-xl transition-all"
                  >
                    Enter Series →
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create New Button */}
      <div className="text-center">
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-4 px-12 rounded-2xl border-4 border-double border-green-950 shadow-xl transition-all text-xl"
        >
          + Create New Gym Series
        </button>
      </div>
    </div>
  )
}

export default GymBrowser

