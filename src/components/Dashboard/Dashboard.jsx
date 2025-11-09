import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import Battle from '../Battle/Battle'
import Collection from '../Collection/Collection'
import Settings from '../Settings/Settings'
import Home from '../Home/Home'
import GymMap from '../GymMap/GymMap'
import PartyManager from '../Party/PartyManager'
import TutorialModal from '../Shared/TutorialModal'
import maleTrainer from '../../assets/trainers/male.gif'
import femaleTrainer from '../../assets/trainers/female.gif'
import nonbinaryTrainer from '../../assets/trainers/nonbinary.gif'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const [trainerInfo, setTrainerInfo] = useState(null)
  const [playerTeam, setPlayerTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    loadTrainerData()
    
    // Listen for tab change events from Home component
    const handleTabChange = (e) => {
      setActiveTab(e.detail)
    }
    window.addEventListener('changeTab', handleTabChange)
    
    // Check if first time user (show tutorial)
    const hasSeenTutorial = localStorage.getItem('studymon_tutorial_seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
    
    return () => window.removeEventListener('changeTab', handleTabChange)
  }, [])

  const [currentTopic, setCurrentTopic] = useState(null)

  const loadTrainerData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }

      // Get trainer info
      const { data: trainer, error: trainerError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (trainerError) {
        console.error('Error loading trainer info:', trainerError)
      }

      // Get player's creatures with full creature data
      const { data: team, error: teamError } = await supabase
        .from('user_creatures')
        .select(`
          *,
          creatures (*)
        `)
        .eq('user_id', user.id)
        .order('id', { ascending: true })

      if (teamError) {
        console.error('Error loading team:', teamError)
      } else {
        console.log('Loaded team data:', team)
        // Log HP values for debugging
        team?.forEach(pc => {
          console.log(`${pc.creatures?.name}: current_hp=${pc.current_hp}, level=${pc.level}`)
        })
      }

      setTrainerInfo(trainer)
      setPlayerTeam(team || [])

      // Fetch active topic
      const { data: topic } = await supabase
        .from('user_topics')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      setCurrentTopic(topic)
      setLoading(false)
    } catch (error) {
      console.error('Error loading trainer data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce mb-4">
            <img 
              src="https://cdn.discordapp.com/attachments/648370607624421377/1436819472592670732/content.png?ex=6910fde9&is=690fac69&hm=604c22efa767de07f191337d4a4d5c96dda507c97b504461cb014cb4fec7550f&" 
              alt="StudyMon Logo" 
              className="h-24 w-auto object-contain mx-auto"
            />
          </div>
          <p className="text-amber-200 text-xl font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-800">
      
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-b from-amber-900 to-amber-950 border-b-8 border-double border-yellow-900 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-900/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img 
                src="https://cdn.discordapp.com/attachments/648370607624421377/1436819472592670732/content.png?ex=6910fde9&is=690fac69&hm=604c22efa767de07f191337d4a4d5c96dda507c97b504461cb014cb4fec7550f&" 
                alt="StudyMon Logo" 
                className="h-24 w-auto object-contain drop-shadow-2xl cursor-pointer"
                onClick={() => setShowTutorial(true)}
                title="Click to view tutorial"
              />
            </div>
            <div className="flex gap-3">
              {['home', 'battle', 'map', 'party', 'collection', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 capitalize transition-all font-bold shadow-lg relative ${
                    activeTab === tab 
                      ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 border-4 border-double border-amber-950 rounded-full shadow-inner' 
                      : 'bg-gradient-to-b from-stone-800 to-stone-900 text-stone-400 hover:from-stone-700 hover:to-stone-800 border-4 border-double border-stone-950 rounded-2xl'
                  }`}
                  style={{
                    clipPath: activeTab === tab ? 'none' : 'polygon(8% 0%, 92% 0%, 100% 15%, 100% 85%, 92% 100%, 8% 100%, 0% 85%, 0% 15%)'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <Home 
            playerTeam={playerTeam}
            trainerInfo={trainerInfo}
            onUpdate={loadTrainerData}
          />
        )}

        {/* BATTLE TAB */}
        {activeTab === 'battle' && (
          <Battle 
            playerTeam={playerTeam}
            currentTopic={currentTopic}
            onExit={async () => {
              // Reload trainer data to reflect battle results
              await loadTrainerData()
              setActiveTab('home')
            }} 
          />
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <GymMap playerTeam={playerTeam} trainerInfo={trainerInfo} />
        )}

        {/* PARTY TAB */}
        {activeTab === 'party' && (
          <PartyManager 
            playerTeam={playerTeam} 
            allUserCreatures={playerTeam}
            onUpdate={loadTrainerData}
          />
        )}

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <Collection playerTeam={playerTeam} />
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <Settings 
            trainerInfo={trainerInfo} 
            onUpdate={loadTrainerData}
          />
        )}

      </div>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => {
          setShowTutorial(false)
          localStorage.setItem('studymon_tutorial_seen', 'true')
        }}
      />
    </div>
  )
}

export default Dashboard