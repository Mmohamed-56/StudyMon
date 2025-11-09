import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

function LevelUpModal({ creature, newLevel, onClose, onSkillLearned }) {
  const [availableSkills, setAvailableSkills] = useState([])
  const [learnedSkills, setLearnedSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (creature) {
      loadAvailableSkills()
    }
  }, [creature, newLevel])

  const loadAvailableSkills = async () => {
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

      // Get already learned skills
      const { data: learned } = await supabase
        .from('user_creature_skills')
        .select('skill_id')
        .eq('user_creature_id', creature.id)

      const learnedSkillIds = learned?.map(s => s.skill_id) || []
      setLearnedSkills(learnedSkillIds)

      // Determine which skill level can be learned based on new level
      let skillLevelToLearn = 1 // Default to level 1

      if (newLevel % 15 === 0 && newLevel >= 15) {
        skillLevelToLearn = 4
      } else if (newLevel % 10 === 0 && newLevel >= 10) {
        skillLevelToLearn = 3
      } else if (newLevel % 5 === 0 && newLevel >= 5) {
        skillLevelToLearn = 2
      } else if (newLevel % 2 === 0) {
        skillLevelToLearn = 1
      }

      // Get available skills of that level
      const { data: skills } = await supabase
        .from('skills')
        .select('*')
        .eq('type_id', typeData.id)
        .eq('skill_level', skillLevelToLearn)

      setAvailableSkills(skills || [])
    } catch (error) {
      console.error('Error loading available skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLearnSkill = async () => {
    if (!selectedSkill) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_creature_skills')
        .insert({
          user_creature_id: creature.id,
          skill_id: selectedSkill.id,
          learned_at_level: newLevel
        })

      if (error) {
        console.error('Error learning skill:', error)
        alert('Failed to learn skill')
      } else {
        onSkillLearned()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (!creature) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-700 via-amber-800 to-orange-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-8 border-double border-yellow-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.3),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
        
        <div className="relative">
          {/* Celebration Header */}
          <div className="text-center mb-6">
            <div className="text-7xl mb-4 animate-bounce">{creature.creatures.sprite}</div>
            <h2 className="text-4xl font-bold text-amber-50 mb-2 drop-shadow-lg">
              Level Up!
            </h2>
            <p className="text-yellow-200 text-2xl font-bold">
              {creature.creatures.name} reached Level {newLevel}!
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-amber-100 font-bold">Loading available skills...</p>
            </div>
          ) : availableSkills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-amber-100 font-bold mb-4">
                No new skills available at this level!
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-3 px-8 rounded-2xl border-4 border-double border-green-950 shadow-xl"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-6 mb-6 border-4 border-dashed border-yellow-800 shadow-inner">
                <h3 className="text-amber-50 font-bold text-xl mb-4 text-center">
                  Choose a Skill to Learn
                </h3>
                <div className="space-y-3">
                  {availableSkills.map(skill => {
                    const isLearned = learnedSkills.includes(skill.id)
                    const isSelected = selectedSkill?.id === skill.id

                    return (
                      <button
                        key={skill.id}
                        onClick={() => !isLearned && setSelectedSkill(skill)}
                        disabled={isLearned}
                        className={`w-full p-4 rounded-2xl border-4 border-double transition-all text-left ${
                          isLearned
                            ? 'bg-gradient-to-r from-stone-700 to-stone-800 border-stone-900 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-r from-amber-700 to-yellow-800 border-amber-950 shadow-xl'
                            : 'bg-gradient-to-r from-blue-800 to-indigo-900 border-blue-950 hover:from-blue-700 hover:to-indigo-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {isLearned && <span className="text-green-400">✓</span>}
                              <p className="font-bold text-lg text-amber-50">{skill.name}</p>
                            </div>
                            <p className="text-sm text-amber-200 mt-1">{skill.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-300">Power: {skill.base_power}</p>
                            <p className="text-sm font-bold text-yellow-300">SP: {skill.sp_cost}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleLearnSkill}
                  disabled={!selectedSkill}
                  className="flex-1 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 rounded-2xl border-4 border-double border-green-950 shadow-xl transition-all"
                >
                  {selectedSkill ? `Learn ${selectedSkill.name}` : 'Select a Skill'}
                </button>
                <button
                  onClick={onClose}
                  className="bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-amber-200 font-bold px-6 py-4 rounded-2xl border-4 border-double border-stone-950 shadow-lg"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LevelUpModal

