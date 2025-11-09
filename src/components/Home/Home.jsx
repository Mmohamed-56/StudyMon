import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import StudyTimer from './StudyTimer'
import WeeklyPlanner from './WeeklyPlanner'
import TopicManager from './TopicManager'
import HealingCenter from './HealingCenter'
import XPBar from '../Shared/XPBar'
import CreatureSprite from '../Shared/CreatureSprite'
import maleTrainer from '../../assets/trainers/male.gif'
import femaleTrainer from '../../assets/trainers/female.gif'
import nonbinaryTrainer from '../../assets/trainers/nonbinary.gif'

function Home({ playerTeam, trainerInfo, onUpdate }) {
  const [currentTopic, setCurrentTopic] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's topics
      const { data: topicsData, error } = await supabase
        .from('user_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading topics:', error)
      } else {
        setTopics(topicsData || [])
        // Set the most recent or active topic as current
        const activeTopic = topicsData?.find(t => t.is_active) || topicsData?.[0]
        setCurrentTopic(activeTopic)
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopicChange = async (topic) => {
    setCurrentTopic(topic)
    
    // Update active topic in database
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Set all topics to inactive
    await supabase
      .from('user_topics')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Set selected topic to active
    if (topic) {
      await supabase
        .from('user_topics')
        .update({ is_active: true })
        .eq('id', topic.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-amber-200 text-xl font-bold">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Top Section - Trainer + Team + Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trainer Profile */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 rounded-3xl p-8 text-center shadow-2xl border-8 border-double border-yellow-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
            <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-transparent via-yellow-700 to-transparent rounded-full"></div>
            <div className="absolute bottom-2 left-2 right-2 h-1 bg-gradient-to-r from-transparent via-yellow-900 to-transparent rounded-full"></div>
            <div className="relative">
              {/* Trainer Sprite with Base */}
              <div className="relative inline-block mb-4">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gradient-to-b from-stone-700/60 to-stone-950/80 rounded-full blur-sm"></div>
                
                {trainerInfo.trainer_sprite && trainerInfo.trainer_sprite.includes('.gif') ? (
                  <img 
                    src={trainerInfo.trainer_sprite} 
                    alt={trainerInfo.trainer_name}
                    className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <img 
                    src={
                      trainerInfo.trainer_gender === 'male' ? maleTrainer :
                      trainerInfo.trainer_gender === 'female' ? femaleTrainer :
                      nonbinaryTrainer
                    } 
                    alt={trainerInfo.trainer_name}
                    className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
              </div>
              <h2 className="text-2xl font-bold text-amber-50 mb-2 drop-shadow-md">{trainerInfo.trainer_name}</h2>
              <p className="text-amber-300 capitalize mb-4 font-semibold">{trainerInfo.trainer_gender} Trainer</p>
              <div className="space-y-2 text-left bg-gradient-to-br from-stone-900 to-stone-950 rounded-2xl p-4 border-4 border-dashed border-stone-700 shadow-inner">
                <div className="flex justify-between text-amber-100">
                  <span className="font-semibold">Badges:</span>
                  <span className="font-bold text-yellow-400 bg-yellow-950 px-3 py-1 rounded-full text-sm">{trainerInfo.badges?.length || 0}</span>
                </div>
                <div className="flex justify-between text-amber-100">
                  <span className="font-semibold">Battles Won:</span>
                  <span className="font-bold text-green-300 bg-green-950 px-3 py-1 rounded-full text-sm">{trainerInfo.battles_won || 0}</span>
                </div>
                <div className="flex justify-between text-amber-100">
                  <span className="font-semibold">Study Time:</span>
                  <span className="font-bold text-blue-300 bg-blue-950 px-3 py-1 rounded-full text-sm">{trainerInfo.study_time || 0} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Team + Action Buttons */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-green-900 via-emerald-900 to-teal-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-green-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,197,94,0.1),transparent)]"></div>
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-green-600 to-transparent opacity-30"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-amber-50 mb-6 drop-shadow-md text-center">Your Team</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {playerTeam.map((pc, index) => {
                  const maxHP = Math.floor(pc.creatures.base_hp + (pc.level * 2))
                  const currentHP = pc.current_hp ?? maxHP
                  const hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100))
                  
                  return (
                    <div key={pc.id} className="bg-gradient-to-b from-green-700 to-green-900 rounded-3xl p-4 text-center border-4 border-double border-green-950 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl"></div>
                      <div className="relative">
                        <div className="flex justify-center mb-2">
                          <CreatureSprite 
                            creatureName={pc.creatures.name}
                            emoji={pc.creatures.sprite}
                            className="text-5xl drop-shadow-lg"
                            size="w-20 h-20"
                          />
                        </div>
                        <p className="text-amber-50 font-bold drop-shadow">{pc.creatures.name}</p>
                        <p className="text-green-200 text-sm font-semibold">Lv. {pc.level}</p>
                        <div className="mt-3 space-y-2">
                          <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-3 border-2 border-stone-800 shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-lime-400 to-green-500 h-full rounded-full shadow-lg"
                              style={{ width: `${hpPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-amber-100 font-semibold drop-shadow">
                            {currentHP}/{maxHP} HP
                          </p>
                          
                          <XPBar currentXP={pc.current_xp || 0} level={pc.level} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {/* Empty slots */}
                {[...Array(4 - playerTeam.length)].map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gradient-to-b from-stone-800 to-stone-950 rounded-3xl p-4 text-center border-4 border-dotted border-stone-700 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(120,113,108,0.1)_1px,transparent_1px)] bg-[size:8px_8px] opacity-50"></div>
                    <div className="relative">
                      <div className="text-5xl mb-2 opacity-30">❓</div>
                      <p className="text-stone-500 font-semibold">Empty</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                <button 
                  onClick={() => {
                    // Check if any party member has HP > 0
                    const hasAliveCreature = playerTeam.some(pc => {
                      const maxHP = Math.floor(pc.creatures.base_hp + (pc.level * 2))
                      const currentHP = pc.current_hp ?? maxHP
                      return currentHP > 0 && pc.party_position !== null
                    })
                    
                    if (!hasAliveCreature) {
                      alert('All your party creatures have fainted! Heal them first.')
                      return
                    }
                    
                    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'battle' }))
                  }}
                  className="bg-gradient-to-b from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:via-red-600 hover:to-red-800 text-amber-50 font-bold py-8 text-xl shadow-2xl border-6 border-double border-red-950 transition-all relative overflow-hidden group"
                  style={{
                    borderRadius: '2rem 2rem 3rem 3rem',
                    transform: 'perspective(1000px) rotateX(2deg)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
                  <span className="relative drop-shadow-lg">Wild Battle</span>
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'map' }))}
                  className="bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 hover:from-blue-500 hover:via-blue-600 hover:to-blue-800 text-amber-50 font-bold py-8 text-xl shadow-2xl border-6 border-double border-blue-950 transition-all relative overflow-hidden group"
                  style={{
                    borderRadius: '2rem 2rem 3rem 3rem',
                    transform: 'perspective(1000px) rotateX(2deg)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-blue-950 to-transparent"></div>
                  <span className="relative drop-shadow-lg">Gym Map</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Timer */}
        <StudyTimer trainerInfo={trainerInfo} />
        
        {/* Healing Center */}
        <HealingCenter 
          playerTeam={playerTeam}
          currentTopic={currentTopic}
          onHealComplete={onUpdate}
        />
      </div>

      {/* Topic Manager */}
      <TopicManager 
        currentTopic={currentTopic}
        topics={topics}
        onTopicChange={handleTopicChange}
        onTopicsUpdate={loadTopics}
      />

      {/* Weekly Planner - Full Width */}
      <WeeklyPlanner />

    </div>
  )
}

export default Home

