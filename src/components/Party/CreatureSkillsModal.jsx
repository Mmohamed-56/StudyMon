import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import CreatureSprite from '../Shared/CreatureSprite'
import star from '../../assets/icons/star.png'

function CreatureSkillsModal({ creature, onClose, onUpdate }) {
  const [learnedSkills, setLearnedSkills] = useState([])
  const [equippedSkills, setEquippedSkills] = useState([null, null, null, null]) // 4 slots
  const [availableSkills, setAvailableSkills] = useState([])
  const [futureSkills, setFutureSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    loadSkillData()
  }, [creature])

  const loadSkillData = async () => {
    try {
      // Get creature type
      const { data: creatureData } = await supabase
        .from('creatures')
        .select('type')
        .eq('id', creature.creatures.id)
        .single()

      if (!creatureData) return

      // Get type_id
      const { data: typeData } = await supabase
        .from('creature_types')
        .select('id')
        .ilike('name', creatureData.type)
        .single()

      if (!typeData) return

      // Get all skills for this type
      const { data: allSkills } = await supabase
        .from('skills')
        .select('*')
        .eq('type_id', typeData.id)
        .order('skill_level', { ascending: true })

      // Get learned skills
      const { data: learned } = await supabase
        .from('user_creature_skills')
        .select('skill_id, skills(*)')
        .eq('user_creature_id', creature.id)

      const learnedSkillIds = learned?.map(s => s.skill_id) || []
      const learnedSkillsData = learned?.map(s => s.skills) || []

      // Calculate available skills based on level
      const skillSlotsAtLevel = {
        1: Math.floor(creature.level / 2),
        2: Math.floor(creature.level / 5),
        3: Math.floor(creature.level / 10),
        4: Math.floor(creature.level / 15)
      }

      const available = []
      const future = []

      allSkills?.forEach(skill => {
        if (learnedSkillIds.includes(skill.id)) {
          // Already learned - skip
          return
        }

        const slotsForLevel = skillSlotsAtLevel[skill.skill_level] || 0
        const learnedAtLevel = learnedSkillsData.filter(s => s.skill_level === skill.skill_level).length

        if (learnedAtLevel < slotsForLevel) {
          available.push(skill)
        } else {
          future.push(skill)
        }
      })

      setLearnedSkills(learnedSkillsData)
      setAvailableSkills(available)
      setFutureSkills(future)

      // Set equipped skills (first 4 learned skills)
      const equipped = [null, null, null, null]
      learnedSkillsData.slice(0, 4).forEach((skill, index) => {
        equipped[index] = skill
      })
      setEquippedSkills(equipped)

    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLearnSkill = async (skill) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_creature_skills')
        .insert({
          user_creature_id: creature.id,
          skill_id: skill.id,
          learned_at_level: creature.level
        })

      if (error) {
        console.error('Error learning skill:', error)
        alert('Failed to learn skill')
      } else {
        await loadSkillData()
        onUpdate()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEquipSkill = (skill, slotIndex) => {
    const newEquipped = [...equippedSkills]
    newEquipped[slotIndex] = skill
    setEquippedSkills(newEquipped)
    setSelectedSlot(null)
  }

  const handleUnequipSkill = (slotIndex) => {
    const newEquipped = [...equippedSkills]
    newEquipped[slotIndex] = null
    setEquippedSkills(newEquipped)
  }

  if (!creature) return null

  const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
  const currentHP = creature.current_hp ?? maxHP

  // Radial positions for 4 skills (spread further from center)
  const positions = [
    { top: '5%', left: '50%', transform: 'translateX(-50%)' }, // Top
    { top: '50%', right: '5%', transform: 'translateY(-50%)' }, // Right
    { bottom: '5%', left: '50%', transform: 'translateX(-50%)' }, // Bottom
    { top: '50%', left: '5%', transform: 'translateY(-50%)' } // Left
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 rounded-3xl p-8 max-w-4xl w-full shadow-2xl border-8 border-double border-indigo-950 relative my-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CreatureSprite 
                creatureName={creature.creatures.name}
                emoji={creature.creatures.sprite}
                className="text-6xl"
                size="w-24 h-24"
              />
            </div>
            <h2 className="text-3xl font-bold text-amber-50 mb-2 drop-shadow-lg">
              {creature.creatures.name}
            </h2>
            <p className="text-purple-200 font-semibold">Level {creature.level} • {currentHP}/{maxHP} HP</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-amber-50 text-xl font-bold">Loading skills...</p>
            </div>
          ) : (
            <>
              {/* Radial Skill Wheel */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-amber-50 mb-6 text-center drop-shadow-lg">
                  Active Skills ({equippedSkills.filter(s => s).length}/4)
                </h3>
                <div className="relative h-96 bg-gradient-to-br from-stone-900 to-stone-950 rounded-3xl border-8 border-double border-purple-950 shadow-inner overflow-visible">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent)]"></div>
                  
                  {/* Center Creature Icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-gradient-to-br from-purple-700 to-indigo-800 rounded-full p-4 border-4 border-purple-950 shadow-2xl">
                      <CreatureSprite 
                        creatureName={creature.creatures.name}
                        emoji={creature.creatures.sprite}
                        className="text-4xl"
                        size="w-12 h-12"
                      />
                    </div>
                  </div>

                  {/* 4 Skill Slots in Radial Layout */}
                  {positions.map((pos, index) => {
                    const skill = equippedSkills[index]
                    
                    return (
                      <div
                        key={index}
                        className="absolute"
                        style={pos}
                      >
                        {skill ? (
                          <button
                            onClick={() => handleUnequipSkill(index)}
                            className="bg-gradient-to-br from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 rounded-2xl p-4 border-4 border-double border-blue-950 shadow-xl transition-all w-44 group"
                          >
                            <p className="text-amber-50 font-bold text-base mb-1">{skill.name}</p>
                            <p className="text-xs text-blue-200">Power: {skill.base_power}</p>
                            <p className="text-xs text-yellow-200">SP: {skill.sp_cost}</p>
                            <p className="text-xs text-red-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to unequip</p>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedSlot(index)}
                            className="bg-gradient-to-br from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 rounded-2xl p-4 border-4 border-dashed border-stone-600 shadow-xl transition-all w-44"
                          >
                            <p className="text-stone-400 font-bold text-lg">Empty</p>
                            <p className="text-xs text-stone-500 mt-1">Click to equip</p>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Skill Selection Menu (when slot selected) */}
              {selectedSlot !== null && (
                <div className="mb-8 bg-gradient-to-br from-amber-800 to-orange-900 rounded-3xl p-6 border-4 border-amber-950 shadow-xl">
                  <h4 className="text-xl font-bold text-amber-50 mb-4 text-center">
                    Select a skill for slot {selectedSlot + 1}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {learnedSkills.filter(s => !equippedSkills.includes(s)).map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => handleEquipSkill(skill, selectedSlot)}
                        className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 rounded-2xl p-3 border-3 border-green-950 shadow-lg transition-all text-left"
                      >
                        <p className="text-amber-50 font-bold text-sm">{skill.name}</p>
                        <p className="text-xs text-green-200">Power: {skill.base_power} | SP: {skill.sp_cost}</p>
                        <p className="text-xs text-amber-200 mt-1">{skill.description}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="w-full bg-gradient-to-b from-stone-600 to-stone-700 hover:from-stone-500 hover:to-stone-600 py-2 rounded-xl font-bold text-amber-200 border-3 border-stone-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Available Skills to Learn */}
              {availableSkills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-amber-50 mb-4 text-center drop-shadow-lg flex items-center justify-center gap-2">
                    <img src={star} alt="Star" className="w-6 h-6" style={{ imageRendering: 'pixelated' }} />
                    Available to Learn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSkills.map(skill => (
                      <div
                        key={skill.id}
                        className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 border-4 border-double border-emerald-950 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-amber-50 font-bold">{skill.name}</p>
                          <div className="flex gap-1">
                            {[...Array(skill.skill_level)].map((_, i) => (
                              <img key={i} src={star} alt="Star" className="w-4 h-4" style={{ imageRendering: 'pixelated' }} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-emerald-200 mb-2">{skill.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-emerald-100">
                            <span>Power: {skill.base_power}</span> • <span>SP: {skill.sp_cost}</span>
                          </div>
                          <button
                            onClick={() => handleLearnSkill(skill)}
                            className="bg-gradient-to-b from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 px-4 py-2 rounded-xl font-bold text-amber-50 text-sm border-2 border-amber-900 shadow-lg transition-all"
                          >
                            Learn
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Future Skills (Locked) */}
              {futureSkills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-stone-400 mb-4 text-center drop-shadow-lg">
                    🔒 Future Skills
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {futureSkills.slice(0, 6).map(skill => {
                      const requiredLevel = skill.skill_level === 1 ? 2 : skill.skill_level === 2 ? 5 : skill.skill_level === 3 ? 10 : 15
                      return (
                        <div
                          key={skill.id}
                          className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-2xl p-4 border-4 border-stone-950 shadow-xl opacity-60"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-stone-300 font-bold">{skill.name}</p>
                            <p className="text-xs text-stone-500 font-bold">Lv. {requiredLevel}+</p>
                          </div>
                          <p className="text-sm text-stone-400 mb-2">{skill.description}</p>
                          <div className="text-xs text-stone-500">
                            <span>Power: {skill.base_power}</span> • <span>SP: {skill.sp_cost}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-b from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 py-4 rounded-2xl font-bold text-amber-50 text-xl border-4 border-double border-purple-950 shadow-xl transition-all"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreatureSkillsModal

