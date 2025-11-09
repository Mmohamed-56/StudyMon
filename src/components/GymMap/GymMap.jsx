import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import mapIcon from '../../assets/icons/map.png'

function GymMap({ playerTeam, trainerInfo }) {
  const [gymLeaders, setGymLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGymLeaders()
  }, [])

  const loadGymLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from('gym_leaders')
        .select('*')
        .order('badge_order', { ascending: true })

      if (error) {
        console.error('Error loading gym leaders:', error)
      } else {
        setGymLeaders(data || [])
      }
    } catch (error) {
      console.error('Error loading gym leaders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if player has defeated this gym leader
  const hasDefeatedGym = (gymId) => {
    return trainerInfo?.badges?.includes(gymId) || false
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-cyan-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-teal-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,184,166,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={mapIcon} alt="Map" className="w-10 h-10" style={{ imageRendering: 'pixelated' }} />
            <h2 className="text-3xl font-bold text-amber-50 drop-shadow-lg">Gym Leader Challenge</h2>
          </div>
          <p className="text-teal-200 text-center font-semibold">
            Defeat all gym leaders to become a StudyMon Master!
          </p>
        </div>
      </div>

      {/* Gym Leaders Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-amber-200 text-xl font-bold">Loading gym leaders...</p>
        </div>
      ) : gymLeaders.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 rounded-3xl p-12 text-center shadow-2xl border-8 border-double border-slate-950">
          <p className="text-amber-200 font-bold text-xl mb-4">Gym Leaders Coming Soon!</p>
          <p className="text-slate-400">Prepare your team and study hard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gymLeaders.map((gym, index) => {
            const defeated = hasDefeatedGym(gym.id)
            const locked = index > 0 && !hasDefeatedGym(gymLeaders[index - 1].id)

            return (
              <div
                key={gym.id}
                className={`rounded-3xl p-6 shadow-2xl border-8 border-double relative overflow-hidden transition-all ${
                  defeated
                    ? 'bg-gradient-to-br from-yellow-700 to-amber-900 border-yellow-950'
                    : locked
                    ? 'bg-gradient-to-br from-stone-800 to-stone-950 border-stone-950 opacity-60'
                    : 'bg-gradient-to-br from-blue-700 to-indigo-900 border-blue-950 hover:shadow-2xl cursor-pointer hover:-translate-y-1'
                }`}
              >
                <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"></div>
                
                <div className="relative text-center">
                  {/* Badge Number */}
                  <div className="absolute top-0 right-0 bg-stone-950 rounded-full w-10 h-10 flex items-center justify-center border-3 border-amber-700">
                    <span className="text-amber-100 font-bold">#{gym.badge_order}</span>
                  </div>

                  {/* Gym Leader Sprite */}
                  <div className="text-7xl mb-4 drop-shadow-lg">
                    {gym.sprite || '👤'}
                  </div>

                  {/* Info */}
                  <h3 className="text-2xl font-bold text-amber-50 mb-2 drop-shadow-md">{gym.name}</h3>
                  <p className="text-sm font-semibold mb-4 capitalize">
                    <span className="bg-stone-900/70 px-3 py-1 rounded-full text-amber-200">
                      {gym.specialty_type} Specialist
                    </span>
                  </p>

                  {/* Status */}
                  {defeated ? (
                    <div className="bg-gradient-to-r from-yellow-900 to-amber-950 rounded-2xl p-3 border-3 border-yellow-700 shadow-inner">
                      <p className="text-yellow-200 font-bold">✓ Defeated!</p>
                      <p className="text-xs text-yellow-300 mt-1">Badge Earned</p>
                    </div>
                  ) : locked ? (
                    <div className="bg-stone-950 rounded-2xl p-3 border-3 border-stone-800 shadow-inner">
                      <p className="text-stone-500 font-bold">🔒 Locked</p>
                      <p className="text-xs text-stone-600 mt-1">Defeat previous gym first</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-950 to-indigo-950 rounded-2xl p-3 border-3 border-blue-800 shadow-inner">
                      <p className="text-blue-200 font-bold">Ready to Challenge!</p>
                      <p className="text-xs text-blue-300 mt-1">Click to battle</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GymMap

