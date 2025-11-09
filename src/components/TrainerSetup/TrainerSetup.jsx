import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import maleTrainer from '../../assets/trainers/male.gif'
import femaleTrainer from '../../assets/trainers/female.gif'
import nonbinaryTrainer from '../../assets/trainers/nonbinary.gif'
import CreatureSprite from '../Shared/CreatureSprite'

function TrainerSetup({ onComplete }) {
  const [step, setStep] = useState(1) // 1=gender, 2=name, 3=starter
  const [gender, setGender] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const starters = [
    { id: 85, name: 'Flameling', type: 'fire', sprite: '🔥' },
    { id: 86, name: 'Aquatot', type: 'water', sprite: '💧' },
    { id: 87, name: 'Leaflet', type: 'grass', sprite: '🌱' }
  ]

  const handleSelectStarter = async (starter) => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('You must be logged in to select a starter')
      }

      // Save trainer info with animated sprite
      const trainerSprite = gender === 'male' 
        ? maleTrainer
        : gender === 'female' 
        ? femaleTrainer 
        : nonbinaryTrainer

      // Use upsert to avoid duplicate key errors
      const { error: progressError } = await supabase.from('user_progress').upsert({
        user_id: user.id,
        trainer_name: name,
        trainer_gender: gender,
        trainer_sprite: trainerSprite,
        starter_chosen: true
      }, {
        onConflict: 'user_id'
      })

      if (progressError) {
        throw progressError
      }

      // Get creature data to calculate correct HP
      const { data: creatureData, error: creatureError } = await supabase
        .from('creatures')
        .select('base_hp')
        .eq('id', starter.id)
        .single()

      if (creatureError) {
        throw creatureError
      }

      // Calculate max HP: base_hp + (level * 2)
      const level = 5
      const maxHP = Math.floor(creatureData.base_hp + (level * 2))

      // Give player their starter creature with full HP
      const { error: creatureInsertError } = await supabase.from('user_creatures').insert({
        user_id: user.id,
        creature_id: starter.id,
        level: level,
        current_hp: maxHP
      })

      if (creatureInsertError) {
        throw creatureInsertError
      }

      onComplete()
    } catch (error) {
      console.error('Error setting up trainer:', error)
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-800 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-amber-800 via-orange-900 to-yellow-950 rounded-3xl p-10 max-w-2xl w-full shadow-2xl border-8 border-double border-amber-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent)]"></div>
        <div className="absolute top-3 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-40"></div>
        <div className="relative">
        
        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-amber-50 mb-10 drop-shadow-lg">Choose Your Trainer</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { id: 'male', label: 'Male', sprite: maleTrainer },
                { id: 'female', label: 'Female', sprite: femaleTrainer },
                { id: 'non-binary', label: 'Non-Binary', sprite: nonbinaryTrainer }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    setGender(g.id)
                    setStep(2)
                  }}
                  className="bg-gradient-to-b from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-amber-50 p-6 rounded-3xl text-lg border-4 border-double border-green-950 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group flex flex-col items-center justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                  <div className="relative flex flex-col items-center">
                    {/* Trainer sprite preview with shadow */}
                    <div className="mb-4 relative">
                      {/* Shadow base */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-gradient-to-b from-stone-700/60 to-stone-950/80 rounded-full blur-sm"></div>
                      
                      <img 
                        src={g.sprite} 
                        alt={g.label}
                        className="w-24 h-24 object-contain relative z-10"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="font-bold whitespace-nowrap">{g.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-amber-50 mb-10 drop-shadow-lg">What's Your Name, Trainer?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your trainer name"
              className="w-full p-5 rounded-2xl text-xl text-center mb-8 bg-stone-900 border-4 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner font-bold"
              maxLength={12}
              autoFocus
            />
            <div className="flex gap-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-amber-100 py-4 rounded-full font-bold shadow-lg border-4 border-double border-stone-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-all"></div>
                <span className="relative drop-shadow">← Back</span>
              </button>
              <button
                onClick={() => name.trim() && setStep(3)}
                disabled={!name.trim()}
                className="flex-1 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 py-4 rounded-full font-bold shadow-lg border-4 border-double border-blue-950 disabled:border-stone-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative drop-shadow">Next →</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Starter */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-amber-50 mb-4 drop-shadow-lg">Choose Your Starter!</h2>
            <p className="text-amber-200 mb-10 font-semibold text-lg">This will be your first StudyMon companion.</p>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {starters.map(starter => (
                <button
                  key={starter.id}
                  onClick={() => handleSelectStarter(starter)}
                  disabled={loading}
                  className="bg-gradient-to-b from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 p-6 rounded-3xl border-4 border-double border-emerald-950 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                  <div className="relative">
                    <div className="flex justify-center mb-3">
                      <CreatureSprite 
                        creatureName={starter.name}
                        emoji={starter.sprite}
                        size="w-24 h-24"
                        className="text-7xl"
                      />
                    </div>
                    <p className="font-bold text-xl drop-shadow">{starter.name}</p>
                    <p className="text-sm text-emerald-200 capitalize font-semibold">{starter.type}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-amber-100 py-3 px-8 rounded-full font-bold shadow-lg border-4 border-double border-stone-950 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-all"></div>
              <span className="relative drop-shadow">← Back</span>
            </button>
          </div>
        )}

        </div>
      </div>
    </div>
  )
}

export default TrainerSetup