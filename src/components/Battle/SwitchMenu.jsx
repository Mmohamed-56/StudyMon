import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import CreatureSprite from '../Shared/CreatureSprite'

function SwitchMenu({ playerTeam, activeCreatureId, onSwitch, onCancel }) {
  const [freshParty, setFreshParty] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFreshPartyData()
  }, [])

  const loadFreshPartyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get fresh party data with current HP
      const { data } = await supabase
        .from('user_creatures')
        .select('*, creatures(*)')
        .eq('user_id', user.id)
        .not('party_position', 'is', null)
        .order('party_position', { ascending: true })

      setFreshParty(data || [])
    } catch (error) {
      console.error('Error loading party:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableCreatures = freshParty.filter(creature => {
    const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
    const currentHP = creature.current_hp ?? maxHP
    const isActive = creature.id === activeCreatureId
    const isFainted = currentHP <= 0

    return !isActive && !isFainted
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-8 border-double border-purple-950">
        <h3 className="text-2xl font-bold mb-6 text-center text-amber-50 drop-shadow-lg">Switch Creature</h3>
        
        {loading ? (
          <div className="text-center py-6">
            <p className="text-amber-50 font-bold">Loading party...</p>
          </div>
        ) : availableCreatures.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-red-300 font-bold mb-4">No creatures available to switch!</p>
            <button
              onClick={onCancel}
              className="bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-3 px-6 rounded-2xl font-bold text-amber-200 border-4 border-double border-stone-950 shadow-lg"
            >
              Back
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {availableCreatures.map(creature => {
                const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
                const currentHP = creature.current_hp ?? maxHP

                return (
                  <button
                    key={creature.id}
                    onClick={() => onSwitch(creature)}
                    className="w-full bg-gradient-to-r from-green-800 to-teal-900 hover:from-green-700 hover:to-teal-800 p-4 rounded-2xl flex items-center gap-4 border-4 border-double border-green-950 shadow-lg transition-all"
                  >
                    <CreatureSprite 
                      creatureName={creature.creatures.name}
                      emoji={creature.creatures.sprite}
                      className="text-4xl drop-shadow-lg"
                      size="w-16 h-16"
                    />
                    <div className="text-left flex-1">
                      <p className="font-bold text-amber-50">{creature.creatures.name}</p>
                      <p className="text-sm text-green-200">Lv. {creature.level} | HP: {currentHP}/{maxHP}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={onCancel}
              className="w-full bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-3 rounded-2xl font-bold text-amber-200 border-4 border-double border-stone-950 shadow-lg"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SwitchMenu

