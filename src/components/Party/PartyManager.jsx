import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import XPBar from '../Shared/XPBar'

function PartyManager({ playerTeam, allUserCreatures, onUpdate }) {
  const [dragging, setDragging] = useState(null)
  const [saving, setSaving] = useState(false)

  // Party is creatures with party_position 1-4
  // Benched are creatures with party_position = null
  const party = allUserCreatures
    ?.filter(c => c.party_position !== null)
    .sort((a, b) => a.party_position - b.party_position) || []
  
  const benched = allUserCreatures
    ?.filter(c => c.party_position === null) || []

  const addToParty = async (creature) => {
    if (party.length >= 4) {
      alert('Party is full! (Max 4 creatures)')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find next available position
      const nextPosition = party.length + 1

      const { error } = await supabase
        .from('user_creatures')
        .update({ party_position: nextPosition })
        .eq('id', creature.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error adding to party:', error)
        alert('Failed to add to party')
      } else {
        onUpdate()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const removeFromParty = async (creature) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Remove from party
      const { error } = await supabase
        .from('user_creatures')
        .update({ party_position: null })
        .eq('id', creature.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing from party:', error)
        alert('Failed to remove from party')
      } else {
        // Reorder remaining party members
        await reorderParty()
        onUpdate()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const reorderParty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current party, sort by position
      const currentParty = allUserCreatures
        .filter(c => c.party_position !== null)
        .sort((a, b) => a.party_position - b.party_position)

      // Update positions to be sequential (1, 2, 3, 4)
      for (let i = 0; i < currentParty.length; i++) {
        await supabase
          .from('user_creatures')
          .update({ party_position: i + 1 })
          .eq('id', currentParty[i].id)
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error reordering party:', error)
    }
  }

  const swapPositions = async (creature1, creature2) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const pos1 = creature1.party_position
      const pos2 = creature2.party_position

      // Swap positions
      await supabase
        .from('user_creatures')
        .update({ party_position: pos2 })
        .eq('id', creature1.id)
        .eq('user_id', user.id)

      await supabase
        .from('user_creatures')
        .update({ party_position: pos1 })
        .eq('id', creature2.id)
        .eq('user_id', user.id)

      onUpdate()
    } catch (error) {
      console.error('Error swapping:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-purple-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative text-center">
          <h2 className="text-3xl font-bold text-amber-50 mb-2 drop-shadow-lg">Party Manager</h2>
          <p className="text-purple-200 font-semibold">
            Choose up to 4 creatures for your active party
          </p>
        </div>
      </div>

      {/* Active Party */}
      <div className="bg-gradient-to-br from-green-800 via-emerald-900 to-teal-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-green-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          <h3 className="text-2xl font-bold text-amber-50 mb-6 drop-shadow-md text-center">
            Active Party ({party.length}/4)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => {
              const creature = party[index]
              
              if (creature) {
                const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
                const currentHP = creature.current_hp ?? maxHP
                const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
                const maxSP = creature.max_sp || 50
                const currentSP = creature.current_sp || 0
                const spPercentage = Math.max(0, Math.min(100, (currentSP / maxSP) * 100))

                return (
                  <div
                    key={creature.id}
                    className="bg-gradient-to-b from-green-700 to-green-900 rounded-3xl p-4 text-center border-4 border-double border-green-950 shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
                    <div className="relative">
                      {/* Position Badge */}
                      <div className="absolute top-0 left-0 bg-amber-600 rounded-full w-7 h-7 flex items-center justify-center border-2 border-amber-900 shadow-lg">
                        <span className="text-amber-50 font-bold text-sm">{index + 1}</span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromParty(creature)}
                        disabled={saving}
                        className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 rounded-full w-7 h-7 flex items-center justify-center border-2 border-red-900 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <span className="text-white font-bold text-sm">✕</span>
                      </button>

                      <div className="text-5xl mb-2 drop-shadow-lg mt-4">{creature.creatures.sprite}</div>
                      <p className="text-amber-50 font-bold drop-shadow text-sm">{creature.creatures.name}</p>
                      <p className="text-green-200 text-xs font-semibold">Lv. {creature.level}</p>
                      
                      {/* HP Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-2 border border-stone-800 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-lime-400 to-green-500 h-full rounded-full shadow-lg"
                            style={{ width: `${hpPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-100 mt-1 font-semibold drop-shadow">
                          {currentHP}/{maxHP} HP
                        </p>
                      </div>

                      {/* SP Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-2 border border-stone-800 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full shadow-lg"
                            style={{ width: `${spPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-200 mt-1 font-semibold drop-shadow">
                          {currentSP}/{maxSP} SP
                        </p>
                      </div>

                      {/* XP Bar */}
                      <div className="mt-2">
                        <XPBar currentXP={creature.current_xp || 0} level={creature.level} />
                      </div>
                    </div>
                  </div>
                )
              }

              // Empty slot
              return (
                <div
                  key={`empty-${index}`}
                  className="bg-gradient-to-b from-stone-800 to-stone-950 rounded-3xl p-4 text-center border-4 border-dotted border-stone-700 shadow-inner relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(120,113,108,0.1)_1px,transparent_1px)] bg-[size:8px_8px] opacity-50"></div>
                  <div className="relative">
                    <div className="absolute top-0 left-0 bg-stone-700 rounded-full w-7 h-7 flex items-center justify-center border-2 border-stone-800 shadow-lg">
                      <span className="text-stone-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="text-5xl mb-2 opacity-30 mt-4">❓</div>
                    <p className="text-stone-500 font-semibold text-sm">Empty</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Benched Creatures */}
      {benched.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(148,163,184,0.1),transparent)]"></div>
          <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full opacity-40"></div>
          
          <div className="relative">
            <h3 className="text-2xl font-bold text-amber-50 mb-6 drop-shadow-md text-center">
              Available Creatures ({benched.length})
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {benched.map((creature) => {
                const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
                const currentHP = creature.current_hp ?? maxHP
                const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))

                return (
                  <div
                    key={creature.id}
                    onClick={() => !saving && addToParty(creature)}
                    className="bg-gradient-to-b from-slate-700 to-slate-900 rounded-3xl p-4 text-center border-4 border-double border-slate-950 shadow-xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent group-hover:from-white/10 rounded-3xl transition-all"></div>
                    <div className="relative">
                      <div className="text-5xl mb-2 drop-shadow-lg">{creature.creatures.sprite}</div>
                      <p className="text-amber-50 font-bold drop-shadow text-sm">{creature.creatures.name}</p>
                      <p className="text-slate-300 text-xs font-semibold">Lv. {creature.level}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-2 border border-stone-800 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-lime-400 to-green-500 h-full rounded-full shadow-lg"
                            style={{ width: `${hpPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-amber-100 font-semibold drop-shadow">
                          {currentHP}/{maxHP} HP
                        </p>
                        
                        <XPBar currentXP={creature.current_xp || 0} level={creature.level} />
                      </div>

                      <div className="mt-2 text-xs text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to add
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-stone-900 rounded-2xl p-6 border-4 border-amber-700 shadow-2xl">
            <p className="text-amber-50 font-bold text-xl">Updating party...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartyManager

