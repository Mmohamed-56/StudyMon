// Audio Manager for StudyMon
// Handles voice lines, sound effects, and music

class AudioManager {
  constructor() {
    this.currentMusic = null
    this.soundEffectsEnabled = true
    this.musicEnabled = true
    this.voiceEnabled = true
    this.volume = 0.7
    
    // Load preferences from localStorage
    this.loadPreferences()
  }

  loadPreferences() {
    const prefs = localStorage.getItem('studymon_audio_prefs')
    if (prefs) {
      const parsed = JSON.parse(prefs)
      this.soundEffectsEnabled = parsed.soundEffects ?? true
      this.musicEnabled = parsed.music ?? true
      this.voiceEnabled = parsed.voice ?? true
      this.volume = parsed.volume ?? 0.7
    }
  }

  savePreferences() {
    localStorage.setItem('studymon_audio_prefs', JSON.stringify({
      soundEffects: this.soundEffectsEnabled,
      music: this.musicEnabled,
      voice: this.voiceEnabled,
      volume: this.volume
    }))
  }

  // Play voice line using ElevenLabs
  async playVoice(text, voiceId = 'pNInz6obpgDQGcFmaJgB') {
    console.log('🎤 playVoice called:', { text, voiceId, enabled: this.voiceEnabled })
    
    if (!this.voiceEnabled) {
      console.log('Voice disabled in settings')
      return
    }

    if (!text) {
      console.warn('No text provided for voice')
      return
    }

    try {
      // Check if we're on localhost (skip in dev)
      if (window.location.hostname === 'localhost') {
        console.log('🎤 Voice (dev mode - skipping ElevenLabs):', text)
        return
      }

      console.log('🎤 Calling ElevenLabs API...')

      const response = await fetch('/.netlify/functions/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Voice API error:', errorText)
        throw new Error(`Voice generation failed: ${response.status}`)
      }

      const { audio, mimeType } = await response.json()
      console.log('🎤 Audio received, playing...')

      // Convert base64 to audio and play
      const audioBlob = this.base64ToBlob(audio, mimeType)
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioElement = new Audio(audioUrl)
      audioElement.volume = this.volume

      await audioElement.play()
      console.log('🎤 Voice playing!')
      
      // Clean up after playing
      audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl)
        console.log('🎤 Voice finished')
      }

      return audioElement
    } catch (error) {
      console.error('❌ Error playing voice:', error)
    }
  }

  // Sound effect cache
  soundCache = {}

  // Play sound effect (from static MP3 files)
  playSound(soundName) {
    if (!this.soundEffectsEnabled) return

    try {
      // Play from static files
      const soundPath = `/sounds/${soundName}.mp3`
      const audio = new Audio(soundPath)
      audio.volume = this.volume
      audio.play().catch(e => {
        console.log('Sound play blocked or file not found:', soundName, e)
      })
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  // Play background music from shared pool
  async playBattleMusic(battleType = 'wild') {
    if (!this.musicEnabled) return

    try {
      this.stopMusic()

      // Check if we're on localhost
      if (window.location.hostname === 'localhost') {
        console.log('🎵 Music (dev mode):', battleType)
        return
      }

      // Fetch random music from pool or generate new one
      const response = await fetch('/.netlify/functions/get-battle-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleType })
      })

      if (!response.ok) {
        throw new Error(`Music fetch failed: ${response.status}`)
      }

      const { musicUrl } = await response.json()

      if (musicUrl) {
        this.currentMusic = new Audio(musicUrl)
        this.currentMusic.loop = true
        this.currentMusic.volume = this.volume * 0.4 // Music quieter for studying
        this.currentMusic.play().catch(e => console.log('Music play blocked:', e))
        console.log('🎵 Playing battle music')
      }
    } catch (error) {
      console.error('Error playing music:', error)
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic = null
    }
  }

  // Helper: Convert base64 to blob
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Cache management
  clearSoundCache(soundName = null) {
    if (soundName) {
      // Clear specific sound
      if (this.soundCache[soundName]) {
        URL.revokeObjectURL(this.soundCache[soundName])
        delete this.soundCache[soundName]
        console.log(`🗑️ Cleared cache for: ${soundName}`)
      }
    } else {
      // Clear all sounds
      Object.keys(this.soundCache).forEach(key => {
        URL.revokeObjectURL(this.soundCache[key])
      })
      this.soundCache = {}
      console.log('🗑️ Cleared all sound cache')
    }
  }

  // Get list of cached sounds
  getCachedSounds() {
    return Object.keys(this.soundCache)
  }

  // Toggle functions
  toggleSoundEffects() {
    this.soundEffectsEnabled = !this.soundEffectsEnabled
    this.savePreferences()
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled
    if (!this.musicEnabled) {
      this.stopMusic()
    }
    this.savePreferences()
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled
    this.savePreferences()
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.currentMusic) {
      this.currentMusic.volume = this.volume * 0.6
    }
    this.savePreferences()
  }
}

// Global singleton instance
export const audioManager = new AudioManager()

