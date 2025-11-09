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

  // Play sound effect
  async playSound(soundName, description) {
    if (!this.soundEffectsEnabled) return

    try {
      // Check cache first
      if (this.soundCache[soundName]) {
        const audio = new Audio(this.soundCache[soundName])
        audio.volume = this.volume
        audio.play().catch(e => console.log('Sound play blocked:', e))
        return
      }

      // For localhost, just log
      if (window.location.hostname === 'localhost') {
        console.log('🔔 Sound effect (dev mode):', soundName)
        return
      }

      // Generate sound with ElevenLabs
      console.log('🔔 Generating sound:', soundName)
      const response = await fetch('/.netlify/functions/generate-sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: description,
          duration: 1.0
        })
      })

      if (!response.ok) {
        throw new Error(`Sound generation failed: ${response.status}`)
      }

      const { audio, mimeType } = await response.json()

      // Convert and cache
      const audioBlob = this.base64ToBlob(audio, mimeType)
      const audioUrl = URL.createObjectURL(audioBlob)
      this.soundCache[soundName] = audioUrl

      // Play
      const audioElement = new Audio(audioUrl)
      audioElement.volume = this.volume
      audioElement.play().catch(e => console.log('Sound play blocked:', e))

    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  // Play background music
  playMusic(musicUrl) {
    if (!this.musicEnabled) return

    this.stopMusic()

    this.currentMusic = new Audio(musicUrl)
    this.currentMusic.loop = true
    this.currentMusic.volume = this.volume * 0.6 // Music is quieter
    this.currentMusic.play().catch(e => console.error('Music play error:', e))
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

