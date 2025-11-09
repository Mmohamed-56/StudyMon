import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import CreatureSprite from '../Shared/CreatureSprite'
import trophyIcon from '../../assets/icons/trophy.png'

function Collection({ playerTeam }) {
  const [allCreatures, setAllCreatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCreature, setSelectedCreature] = useState(null)

  useEffect(() => {
    loadAllCreatures()
  }, [])

  const loadAllCreatures = async () => {
    try {
      const { data: creatures, error } = await supabase
        .from('creatures')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error loading creatures:', error)
      } else {
        setAllCreatures(creatures || [])
      }
    } catch (error) {
      console.error('Error loading creatures:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get set of owned creature IDs for quick lookup
  const ownedCreatureIds = new Set(
    playerTeam?.map(pc => pc.creatures?.id).filter(Boolean) || []
  )

  // Check if a creature is owned
  const isOwned = (creatureId) => {
    return ownedCreatureIds.has(creatureId)
  }

  // Get owned creature data (for level, HP, etc.)
  const getOwnedCreatureData = (creatureId) => {
    return playerTeam?.find(pc => pc.creatures?.id === creatureId)
  }

  // Get type color for styling
  const getTypeColor = (type) => {
    const colors = {
      fire: 'from-red-500 to-orange-500',
      water: 'from-blue-500 to-cyan-500',
      grass: 'from-green-500 to-emerald-500',
      electric: 'from-yellow-500 to-amber-500',
      psychic: 'from-purple-500 to-pink-500',
      ice: 'from-cyan-400 to-blue-400',
      dragon: 'from-indigo-600 to-purple-600',
      dark: 'from-gray-800 to-gray-900',
      fairy: 'from-pink-400 to-rose-400',
      steel: 'from-gray-400 to-gray-500',
      rock: 'from-yellow-700 to-yellow-800',
      ghost: 'from-purple-800 to-indigo-800'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-amber-200 text-xl font-bold">Loading collection...</p>
      </div>
    )
  }

  const ownedCount = ownedCreatureIds.size
  const totalCount = allCreatures.length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjc21hbGxHcmlkKSIgLz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full opacity-40"></div>
        <div className="relative">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={trophyIcon} alt="Collection" className="w-10 h-10" style={{ imageRendering: 'pixelated' }} />
                <h2 className="text-3xl font-bold text-amber-50 drop-shadow-lg">StudyMon Dex</h2>
              </div>
              <p className="text-purple-200 font-semibold">
                Collected: {ownedCount} / {totalCount}
              </p>
            </div>
            <div className="text-right bg-purple-950 rounded-full p-4 border-4 border-double border-purple-800 shadow-inner">
              <div className="text-3xl font-bold text-amber-100">
                {Math.round((ownedCount / totalCount) * 100)}%
              </div>
              <p className="text-purple-300 text-sm font-semibold">Complete</p>
            </div>
          </div>
          <div className="mt-6 w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-4 border-3 border-purple-950 shadow-inner p-1">
            <div
              className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${(ownedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Your Collection Section */}
      <div className="bg-gradient-to-br from-orange-800 via-amber-900 to-yellow-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-orange-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(251,191,36,0.1),transparent)]"></div>
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-30"></div>
        <div className="relative">
          <h3 className="text-2xl font-bold text-amber-50 mb-6 drop-shadow-md text-center">Your Collection</h3>
          {playerTeam && playerTeam.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playerTeam.map((pc) => {
                const creature = pc.creatures
                const maxHP = Math.floor(creature.base_hp + (pc.level * 2))
                const currentHP = pc.current_hp ?? maxHP
                
                return (
                  <div
                    key={pc.id}
                    onClick={() => setSelectedCreature({ ...creature, owned: true, userData: pc })}
                    className="bg-gradient-to-b from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 rounded-3xl p-5 cursor-pointer transition-all border-4 border-double border-orange-950 shadow-xl hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl"></div>
                    <div className="text-center relative">
                      <div className="flex justify-center mb-2">
                        <CreatureSprite 
                          creatureName={creature.name}
                          emoji={creature.sprite}
                          className="text-6xl drop-shadow-lg"
                          size="w-24 h-24"
                        />
                      </div>
                      <p className="text-amber-50 font-bold text-lg drop-shadow">{creature.name}</p>
                      <p className="text-orange-200 text-sm capitalize mb-2 font-semibold">{creature.type}</p>
                      <div className="space-y-1">
                        <p className="text-orange-100 text-xs font-bold">Lv. {pc.level}</p>
                        <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-2 border-2 border-orange-950 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-lime-400 to-green-500 h-full rounded-full shadow"
                            style={{ width: `${Math.max(0, Math.min(100, (currentHP / maxHP) * 100))}%` }}
                          />
                        </div>
                        <p className="text-amber-100 text-xs font-semibold">
                          {currentHP}/{maxHP} HP
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-orange-200 text-center py-8 font-semibold text-lg">No creatures in your collection yet!</p>
          )}
        </div>
      </div>

      {/* All Creatures Section (Pokedex) */}
      <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(148,163,184,0.1),transparent)]"></div>
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-30"></div>
        <div className="relative">
          <h3 className="text-2xl font-bold text-amber-50 mb-6 drop-shadow-md text-center">All StudyMons</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allCreatures.map((creature) => {
              const owned = isOwned(creature.id)
              const ownedData = getOwnedCreatureData(creature.id)
              
              return (
                <div
                  key={creature.id}
                  onClick={() => setSelectedCreature({ ...creature, owned, userData: ownedData })}
                  className={`rounded-3xl p-4 cursor-pointer transition-all border-4 border-double shadow-lg hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
                    owned
                      ? 'bg-gradient-to-b from-slate-600 to-slate-800 border-slate-950'
                      : 'bg-gradient-to-b from-stone-900 to-stone-950 border-stone-950 opacity-50 hover:opacity-60'
                  }`}
                >
                  <div className={owned ? "absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl" : ""}></div>
                  <div className="text-center relative">
                    {/* Creature Number */}
                    <p className="text-amber-200 text-xs mb-2 font-bold bg-stone-950 inline-block px-2 py-0.5 rounded-full">#{String(creature.id).padStart(3, '0')}</p>
                    
                    {/* Sprite or Question Mark */}
                    {owned ? (
                      <div className="flex justify-center mb-2">
                        <CreatureSprite 
                          creatureName={creature.name}
                          emoji={creature.sprite}
                          className="text-6xl drop-shadow-lg"
                          size="w-24 h-24"
                        />
                      </div>
                    ) : (
                      <div className="text-6xl mb-2 opacity-30 filter grayscale">❓</div>
                    )}
                    
                    {/* Name */}
                    <p className={`font-bold text-base mb-2 drop-shadow ${owned ? 'text-amber-50' : 'text-stone-500'}`}>
                      {owned ? creature.name : '???'}
                    </p>
                    
                    {/* Type */}
                    {owned ? (
                      <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-bold border-2 border-double bg-gradient-to-r ${getTypeColor(creature.type)} shadow-md`}>
                        {creature.type.toUpperCase()}
                      </div>
                    ) : (
                      <div className="inline-block px-3 py-1 rounded-full text-xs text-stone-600 font-bold bg-stone-900 border-2 border-stone-800">
                        ???
                      </div>
                    )}
                  
                    {/* Owned indicator */}
                    {owned && ownedData && (() => {
                      const maxHP = Math.floor(creature.base_hp + (ownedData.level * 2))
                      return (
                        <div className="mt-2 space-y-1">
                          <p className="text-slate-200 text-xs font-bold">Lv. {ownedData.level}</p>
                          <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-1.5 border border-slate-800 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-green-400 to-lime-500 h-full rounded-full shadow"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((ownedData.current_hp ?? maxHP) / maxHP) * 100
                                  )
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Creature Detail Modal */}
      {selectedCreature && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCreature(null)}
        >
          <div
            className="bg-gradient-to-br from-rose-800 via-rose-900 to-rose-950 rounded-3xl p-8 max-w-md w-full border-8 border-double border-rose-950 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.15),transparent)]"></div>
            <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent rounded-full opacity-40"></div>
            <div className="relative">
              <div className="text-center">
                <div className="text-8xl mb-4 drop-shadow-2xl">
                  {selectedCreature.owned ? selectedCreature.sprite : '❓'}
                </div>
                <h3 className="text-3xl font-bold text-amber-50 mb-2 drop-shadow-lg">
                  {selectedCreature.owned ? selectedCreature.name : '???'}
                </h3>
                <p className="text-rose-200 mb-6 font-semibold bg-rose-950 inline-block px-4 py-1 rounded-full">
                  #{String(selectedCreature.id).padStart(3, '0')}
                </p>
                
                {selectedCreature.owned ? (
                  <>
                    <div className={`inline-block px-5 py-2 rounded-full text-white font-bold bg-gradient-to-r ${getTypeColor(selectedCreature.type)} mb-6 border-3 border-double border-rose-950 shadow-lg`}>
                      {selectedCreature.type.toUpperCase()}
                    </div>
                    
                    {selectedCreature.userData && (() => {
                      const maxHP = Math.floor(selectedCreature.base_hp + (selectedCreature.userData.level * 2))
                      return (
                        <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-5 mt-6 space-y-3 border-4 border-dashed border-stone-700 shadow-inner">
                          <div className="flex justify-between text-amber-100">
                            <span className="font-semibold">Level:</span>
                            <span className="font-bold text-amber-50 bg-stone-800 px-3 py-1 rounded-full">{selectedCreature.userData.level}</span>
                          </div>
                          <div className="flex justify-between text-amber-100">
                            <span className="font-semibold">HP:</span>
                            <span className="font-bold text-green-300 bg-stone-800 px-3 py-1 rounded-full">
                              {selectedCreature.userData.current_hp ?? maxHP} / {maxHP}
                            </span>
                          </div>
                          <div className="flex justify-between text-amber-100">
                            <span className="font-semibold">XP:</span>
                            <span className="font-bold text-blue-300 bg-stone-800 px-3 py-1 rounded-full">{selectedCreature.userData.current_xp || 0}</span>
                          </div>
                        </div>
                      )
                    })()}
                    
                    <div className="mt-6 text-left bg-gradient-to-r from-rose-950 to-pink-950 rounded-2xl p-5 border-3 border-rose-900 shadow-md">
                      <p className="text-rose-200 text-sm mb-2">
                        <strong className="text-amber-100">Base HP:</strong> {selectedCreature.base_hp}
                      </p>
                      <p className="text-rose-200 text-sm">
                        <strong className="text-amber-100">Base Attack:</strong> {selectedCreature.base_attack}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-6 mt-6 border-4 border-dashed border-stone-700 shadow-inner">
                    <p className="text-amber-200 font-semibold">
                      This StudyMon has not been discovered yet!
                    </p>
                    <p className="text-stone-400 text-sm mt-3">
                      Battle wild creatures to discover and catch new StudyMons!
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedCreature(null)}
                  className="mt-8 w-full bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-50 font-bold py-3 rounded-full transition-all shadow-lg border-4 border-double border-amber-950 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                  <span className="relative drop-shadow">Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Collection

