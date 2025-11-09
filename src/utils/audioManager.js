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
    if (!this.voiceEnabled) return

    try {
      // Check if we're on localhost (skip in dev)
      if (window.location.hostname === 'localhost') {
        console.log('Voice (dev mode):', text)
        return
      }

      const response = await fetch('/.netlify/functions/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      })

      if (!response.ok) {
        throw new Error(`Voice generation failed: ${response.status}`)
      }

      const { audio, mimeType } = await response.json()

      // Convert base64 to audio and play
      const audioBlob = this.base64ToBlob(audio, mimeType)
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioElement = new Audio(audioUrl)
      audioElement.volume = this.volume

      await audioElement.play()
      
      // Clean up after playing
      audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl)
      }

      return audioElement
    } catch (error) {
      console.error('Error playing voice:', error)
    }
  }

  // Play sound effect
  playSound(soundName) {
    if (!this.soundEffectsEnabled) return

    // Sound effects will be added later
    console.log('Sound effect:', soundName)
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

