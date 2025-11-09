import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import stopwatchIcon from '../../assets/icons/stopwatch.png'

function StudyTimer({ trainerInfo }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // Default 25 minutes
  const [isRunning, setIsRunning] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(25)
  const audioRef = useRef(null)

  // Load saved timer state
  useEffect(() => {
    loadTimerState()
  }, [])

  // Timer countdown
  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          const newTime = time - 1
          // Save to database every 10 seconds
          if (newTime % 10 === 0) {
            saveTimerState(newTime, true)
          }
          // Increment study time every 60 seconds (1 minute)
          if (newTime % 60 === 0 && newTime > 0) {
            incrementStudyTime(1)
          }
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      playChime()
      saveTimerState(0, false)
      // Final increment for any remaining time
      const remainingMinutes = Math.ceil((selectedDuration * 60 - timeLeft) / 60)
      if (remainingMinutes > 0) {
        incrementStudyTime(remainingMinutes)
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, selectedDuration])

  const loadTimerState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('timer_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setTimeLeft(data.time_left || 25 * 60)
        setIsRunning(data.is_running || false)
        setSelectedDuration(Math.ceil((data.time_left || 25 * 60) / 60))
      }
    } catch (error) {
      console.error('Error loading timer state:', error)
    }
  }

  const saveTimerState = async (time, running) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('timer_state')
        .upsert({
          user_id: user.id,
          time_left: time,
          is_running: running
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
      console.error('Error saving timer state:', error)
    }
  }

  const incrementStudyTime = async (minutes) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.rpc('increment_study_time', { 
        user_id: user.id, 
        minutes: minutes 
      }).catch(async () => {
        // Fallback if RPC doesn't exist
        const { data: progress } = await supabase
          .from('user_progress')
          .select('study_time')
          .eq('user_id', user.id)
          .single()

        if (progress) {
          await supabase
            .from('user_progress')
            .update({ study_time: (progress.study_time || 0) + minutes })
            .eq('user_id', user.id)
        }
      })
    } catch (error) {
      console.error('Error incrementing study time:', error)
    }
  }

  const playChime = () => {
    // Create a simple chime sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 1)

    // Play notification
    if (Notification.permission === 'granted') {
      new Notification('Study Timer Complete!', {
        body: `Great job! You studied for ${selectedDuration} minutes.`,
        icon: '/src/assets/trainers/male.gif'
      })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    saveTimerState(timeLeft, true)
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    saveTimerState(timeLeft, false)
  }

  const handleReset = () => {
    setIsRunning(false)
    const newTime = selectedDuration * 60
    setTimeLeft(newTime)
    saveTimerState(newTime, false)
  }

  const handleDurationChange = (minutes) => {
    setSelectedDuration(minutes)
    if (!isRunning) {
      setTimeLeft(minutes * 60)
    }
  }

  const durations = [5, 10, 15, 25, 30, 45, 60]

  return (
    <div className="bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={stopwatchIcon} alt="Timer" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          <h2 className="text-2xl font-bold text-amber-50">Study Timer</h2>
        </div>
        
        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-7xl font-bold text-amber-50 mb-4 drop-shadow-lg font-mono">
            {formatTime(timeLeft)}
          </div>
          
          {/* Duration Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {durations.map(duration => (
              <button
                key={duration}
                onClick={() => handleDurationChange(duration)}
                disabled={isRunning}
                className={`px-4 py-2 rounded-full font-bold text-sm border-3 border-double transition-all ${
                  selectedDuration === duration
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 border-amber-950'
                    : 'bg-gradient-to-b from-stone-800 to-stone-900 text-stone-400 border-stone-950 hover:from-stone-700 hover:to-stone-800'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {duration}m
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold px-8 py-3 rounded-full border-4 border-double border-green-950 shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative">▶ Start</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-amber-50 font-bold px-8 py-3 rounded-full border-4 border-double border-yellow-950 shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative">⏸ Pause</span>
              </button>
            )}
            
            <button
              onClick={handleReset}
              className="bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-amber-50 font-bold px-8 py-3 rounded-full border-4 border-double border-red-950 shadow-lg transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
              <span className="relative">↻ Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full h-3 border-3 border-blue-950 shadow-inner p-0.5">
            <div
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyTimer

