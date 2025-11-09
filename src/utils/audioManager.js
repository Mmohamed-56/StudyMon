// Audio Manager for StudyMon
// Handles voice lines, sound effects, and music

class AudioManager {
  constructor() {
    this.currentMusic = null
    this.soundEffectsEnabled = true
    this.musicEnabled = true
    this.voiceEnabled = true
    this.volume = 0.7
    this.currentMusicType = null // 'background' or 'battle'
    this.currentTrackIndex = 0
    
    // Background music playlist (will cycle through these)
    this.backgroundMusicTracks = [
      'background_music_1.mp3',
      'background_music_2.mp3',
      'background_music_3.mp3',
      'background_music_4.mp3',
      'background_music_5.mp3'
    ]
    
    // Battle music playlists
    this.battleMusicTracks = {
      wild: [
        'battle_music_wild_1.mp3',
        'battle_music_wild_2.mp3',
        'battle_music_wild_3.mp3'
      ],
      gym: [
        'battle_music_gym_1.mp3',
        'battle_music_gym_2.mp3',
        'battle_music_gym_3.mp3'
      ]
    }
    
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

  // Play background music (normal gameplay) - cycles through multiple tracks
  async playBackgroundMusic(shuffle = true) {
    if (!this.musicEnabled) return

    try {
      this.stopMusic()
      this.currentMusicType = 'background'

      // Select track (random or sequential)
      if (shuffle) {
        this.currentTrackIndex = Math.floor(Math.random() * this.backgroundMusicTracks.length)
      }

      const playTrack = async (trackIndex) => {
        const trackName = this.backgroundMusicTracks[trackIndex]
        const musicPath = `/sounds/${trackName}`
        
        this.currentMusic = new Audio(musicPath)
        this.currentMusic.volume = this.volume * 0.3 // Quiet for studying
        
        // When track ends, play next track
        this.currentMusic.onended = () => {
          if (this.currentMusicType === 'background' && this.musicEnabled) {
            // Move to next track (or random)
            if (shuffle) {
              this.currentTrackIndex = Math.floor(Math.random() * this.backgroundMusicTracks.length)
            } else {
              this.currentTrackIndex = (this.currentTrackIndex + 1) % this.backgroundMusicTracks.length
            }
            playTrack(this.currentTrackIndex)
          }
        }

        // Handle errors (file not found) - try next track
        this.currentMusic.onerror = () => {
          console.log(`Track not found: ${trackName}, trying next...`)
          if (this.currentMusicType === 'background' && this.musicEnabled) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.backgroundMusicTracks.length
            playTrack(this.currentTrackIndex)
          }
        }

        await this.currentMusic.play().catch(e => {
          console.log('Background music play blocked:', e)
        })
        
        console.log(`🎵 Playing background music: ${trackName}`)
      }

      await playTrack(this.currentTrackIndex)
    } catch (error) {
      console.error('Error playing background music:', error)
    }
  }

  // Play battle music from shared pool or local fallback - cycles through tracks
  async playBattleMusic(battleType = 'wild', shuffle = true) {
    if (!this.musicEnabled) return

    try {
      this.stopMusic()
      this.currentMusicType = 'battle'
      
      const useLocal = window.location.hostname === 'localhost'
      
      // Try database first (production)
      if (!useLocal) {
        try {
          const response = await fetch('/.netlify/functions/get-battle-music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ battleType })
          })

          if (response.ok) {
            const { musicUrl } = await response.json()

            if (musicUrl) {
              this.currentMusic = new Audio(musicUrl)
              this.currentMusic.loop = true
              this.currentMusic.volume = this.volume * 0.4
              await this.currentMusic.play().catch(e => {
                console.log('Database music failed to play:', e)
                throw e // Trigger local fallback
              })
              console.log('🎵 Playing battle music from database')
              return
            }
          }
        } catch (dbError) {
          console.log('Database music unavailable, using local files')
        }
      }

      // Use local playlist
      const playlist = this.battleMusicTracks[battleType] || this.battleMusicTracks.wild
      
      // Select track (random or sequential)
      if (shuffle) {
        this.currentTrackIndex = Math.floor(Math.random() * playlist.length)
      } else {
        this.currentTrackIndex = 0
      }

      const playTrack = async (trackIndex) => {
        const trackName = playlist[trackIndex]
        const musicPath = `/sounds/${trackName}`
        
        this.currentMusic = new Audio(musicPath)
        this.currentMusic.volume = this.volume * 0.4
        
        // When track ends, play next track in playlist
        this.currentMusic.onended = () => {
          if (this.currentMusicType === 'battle' && this.musicEnabled) {
            if (shuffle) {
              this.currentTrackIndex = Math.floor(Math.random() * playlist.length)
            } else {
              this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length
            }
            playTrack(this.currentTrackIndex)
          }
        }

        // Handle errors - try next track
        this.currentMusic.onerror = () => {
          console.log(`Battle track not found: ${trackName}, trying next...`)
          if (this.currentMusicType === 'battle' && this.musicEnabled) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length
            playTrack(this.currentTrackIndex)
          }
        }

        await this.currentMusic.play().catch(e => {
          console.log('Battle music play blocked:', e)
        })
        
        console.log(`🎵 Playing battle music (${battleType}): ${trackName}`)
      }

      await playTrack(this.currentTrackIndex)
      
    } catch (error) {
      console.error('Error playing music:', error)
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic.onended = null // Clear event handlers
      this.currentMusic.onerror = null
      this.currentMusic = null
    }
    this.currentMusicType = null
  }

  // Music player controls
  skipToNextTrack() {
    if (!this.currentMusicType) return

    if (this.currentMusicType === 'background') {
      this.playBackgroundMusic(true) // Shuffle mode
    } else if (this.currentMusicType === 'battle') {
      // Extract battle type from current setup
      this.playBattleMusic('wild', true)
    }
  }

  skipToPreviousTrack() {
    // For now, just replay current or go to random track
    this.skipToNextTrack()
  }

  getCurrentTrackInfo() {
    if (!this.currentMusicType || !this.currentMusic) {
      return { name: 'No music playing', type: null, index: 0, total: 0 }
    }

    let trackName = 'Unknown'
    let total = 0
    
    if (this.currentMusicType === 'background') {
      trackName = this.backgroundMusicTracks[this.currentTrackIndex] || 'Unknown'
      total = this.backgroundMusicTracks.length
    } else if (this.currentMusicType === 'battle') {
      const playlist = this.battleMusicTracks.wild // Default to wild
      trackName = playlist[this.currentTrackIndex] || 'Unknown'
      total = playlist.length
    }

    // Clean up the filename for display
    const displayName = trackName
      .replace('.mp3', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    return {
      name: displayName,
      type: this.currentMusicType,
      index: this.currentTrackIndex + 1,
      total: total
    }
  }

  isPlayingMusic() {
    return this.currentMusic && !this.currentMusic.paused
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

