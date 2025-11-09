import { useState, useEffect } from 'react'
import { audioManager } from '../../utils/audioManager'

function AudioControls() {
  const [isOpen, setIsOpen] = useState(false)
  const [soundEffects, setSoundEffects] = useState(audioManager.soundEffectsEnabled)
  const [music, setMusic] = useState(audioManager.musicEnabled)
  const [voice, setVoice] = useState(audioManager.voiceEnabled)
  const [volume, setVolume] = useState(audioManager.volume)

  const handleToggleSoundEffects = () => {
    audioManager.toggleSoundEffects()
    setSoundEffects(audioManager.soundEffectsEnabled)
  }

  const handleToggleMusic = () => {
    audioManager.toggleMusic()
    setMusic(audioManager.musicEnabled)
  }

  const handleToggleVoice = () => {
    audioManager.toggleVoice()
    setVoice(audioManager.voiceEnabled)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    audioManager.setVolume(newVolume)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 rounded-full w-14 h-14 flex items-center justify-center border-4 border-purple-950 shadow-2xl transition-all hover:scale-110 z-40"
        title="Audio Settings"
      >
        <span className="text-3xl">{music || voice || soundEffects ? '🔊' : '🔇'}</span>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Control Panel */}
          <div className="fixed bottom-24 right-6 bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-6 shadow-2xl border-8 border-double border-stone-950 z-50 w-80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent)] rounded-3xl"></div>
            <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
            
            <div className="relative space-y-4">
              {/* Header */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-amber-50 drop-shadow-lg">Audio Settings</h3>
              </div>

              {/* Voice Toggle */}
              <div className="flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-3 border-3 border-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎤</span>
                  <span className="text-amber-100 font-semibold">Voice Lines</span>
                </div>
                <button
                  onClick={handleToggleVoice}
                  className={`relative w-14 h-7 rounded-full transition-all border-2 ${
                    voice 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-800' 
                      : 'bg-gradient-to-r from-stone-600 to-stone-700 border-stone-800'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${
                    voice ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Music Toggle */}
              <div className="flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-3 border-3 border-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎵</span>
                  <span className="text-amber-100 font-semibold">Music</span>
                </div>
                <button
                  onClick={handleToggleMusic}
                  className={`relative w-14 h-7 rounded-full transition-all border-2 ${
                    music 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-800' 
                      : 'bg-gradient-to-r from-stone-600 to-stone-700 border-stone-800'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${
                    music ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-3 border-3 border-stone-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  <span className="text-amber-100 font-semibold">Sound Effects</span>
                </div>
                <button
                  onClick={handleToggleSoundEffects}
                  className={`relative w-14 h-7 rounded-full transition-all border-2 ${
                    soundEffects 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 border-amber-800' 
                      : 'bg-gradient-to-r from-stone-600 to-stone-700 border-stone-800'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${
                    soundEffects ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-4 border-3 border-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-100 font-semibold">Volume</span>
                  <span className="text-amber-200 text-sm font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-3 bg-stone-700 rounded-full appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(251, 191, 36) 0%, rgb(251, 191, 36) ${volume * 100}%, rgb(68, 64, 60) ${volume * 100}%, rgb(68, 64, 60) 100%)`
                  }}
                />
              </div>

              {/* Quick Mute All */}
              <button
                onClick={() => {
                  const allOff = !music && !voice && !soundEffects
                  if (allOff) {
                    // Turn all on
                    if (!music) handleToggleMusic()
                    if (!voice) handleToggleVoice()
                    if (!soundEffects) handleToggleSoundEffects()
                  } else {
                    // Turn all off
                    if (music) handleToggleMusic()
                    if (voice) handleToggleVoice()
                    if (soundEffects) handleToggleSoundEffects()
                  }
                }}
                className="w-full bg-gradient-to-b from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 py-3 rounded-2xl font-bold text-amber-50 border-4 border-double border-red-950 shadow-xl transition-all"
              >
                {(music || voice || soundEffects) ? '🔇 Mute All' : '🔊 Unmute All'}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-2 rounded-xl font-bold text-stone-300 border-3 border-stone-900 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Custom slider styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11));
          cursor: pointer;
          border: 3px solid rgb(120, 53, 15);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11));
          cursor: pointer;
          border: 3px solid rgb(120, 53, 15);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
      `}</style>
    </>
  )
}

export default AudioControls

