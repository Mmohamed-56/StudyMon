// Development helper to clear session on dev server start
// This runs only in development mode
if (import.meta.env.DEV) {
  // Uncomment the line below to auto-logout on dev server restart
  // localStorage.clear()
}

export const clearDevSession = () => {
  if (import.meta.env.DEV) {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }
}

// Developer Mode System
// Enable with: localStorage.setItem('studymon_dev_mode', 'true')
// Or by having an email ending with @dev.com

export const isDevMode = () => {
  return localStorage.getItem('studymon_dev_mode') === 'true'
}

export const enableDevMode = () => {
  localStorage.setItem('studymon_dev_mode', 'true')
  console.log('🔧 Developer Mode Enabled!')
}

export const disableDevMode = () => {
  localStorage.removeItem('studymon_dev_mode')
  console.log('🔧 Developer Mode Disabled')
}

// Check if user email is a dev account
export const checkDevAccount = (email) => {
  if (!email) return false
  return email.endsWith('@dev.com') || email.endsWith('@studymon.dev')
}

// Developer Actions (require supabase client)
export const devActions = {
  // Add a creature to player's team
  async addCreature(supabase, creatureId, level = 5) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Get creature data
      const { data: creature, error: creatureError } = await supabase
        .from('creatures')
        .select('*')
        .eq('id', creatureId)
        .single()

      if (creatureError) throw creatureError

      // Calculate stats
      const maxHP = Math.floor(creature.base_hp + (level * 2))
      const maxSP = 50 + (level * 3)

      // Add creature
      const { error } = await supabase
        .from('user_creatures')
        .insert({
          user_id: user.id,
          creature_id: creatureId,
          level: level,
          current_hp: maxHP,
          current_sp: maxSP,
          xp: 0
        })

      if (error) throw error
      console.log(`✅ Added ${creature.name} (Lv.${level}) to team!`)
      return true
    } catch (error) {
      console.error('❌ Error adding creature:', error)
      return false
    }
  },

  // Level up a creature
  async levelUpCreature(supabase, userCreatureId, levels = 1) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Get current creature data
      const { data: userCreature, error: fetchError } = await supabase
        .from('user_creatures')
        .select('*, creatures(*)')
        .eq('id', userCreatureId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      const newLevel = userCreature.level + levels
      const maxHP = Math.floor(userCreature.creatures.base_hp + (newLevel * 2))
      const maxSP = 50 + (newLevel * 3)

      // Update level and stats
      const { error } = await supabase
        .from('user_creatures')
        .update({
          level: newLevel,
          current_hp: maxHP,
          current_sp: maxSP,
          xp: 0
        })
        .eq('id', userCreatureId)
        .eq('user_id', user.id)

      if (error) throw error
      console.log(`✅ Leveled up ${userCreature.creatures.name} to Lv.${newLevel}!`)
      return true
    } catch (error) {
      console.error('❌ Error leveling up:', error)
      return false
    }
  },

  // Heal all creatures
  async healAll(supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Get all user creatures
      const { data: creatures, error: fetchError } = await supabase
        .from('user_creatures')
        .select('*, creatures(*)')
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      // Heal each one
      for (const creature of creatures) {
        const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
        const maxSP = 50 + (creature.level * 3)

        await supabase
          .from('user_creatures')
          .update({
            current_hp: maxHP,
            current_sp: maxSP
          })
          .eq('id', creature.id)
          .eq('user_id', user.id)
      }

      console.log(`✅ Healed all ${creatures.length} creatures!`)
      return true
    } catch (error) {
      console.error('❌ Error healing:', error)
      return false
    }
  },

  // Add Study Points
  async addSP(supabase, amount = 100) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data: progress } = await supabase
        .from('user_progress')
        .select('study_points')
        .eq('user_id', user.id)
        .single()

      const currentSP = progress?.study_points || 0

      const { error } = await supabase
        .from('user_progress')
        .update({ study_points: currentSP + amount })
        .eq('user_id', user.id)

      if (error) throw error
      console.log(`✅ Added ${amount} Study Points! Total: ${currentSP + amount}`)
      return true
    } catch (error) {
      console.error('❌ Error adding SP:', error)
      return false
    }
  },

  // Unlock all badges
  async unlockAllBadges(supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Get all gym series
      const { data: series, error: seriesError } = await supabase
        .from('gym_series')
        .select('id')

      if (seriesError) throw seriesError

      // Complete all series
      for (const s of series) {
        await supabase
          .from('user_series_progress')
          .upsert({
            user_id: user.id,
            series_id: s.id,
            completed: true,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,series_id'
          })
      }

      console.log(`✅ Unlocked all ${series.length} badges!`)
      return true
    } catch (error) {
      console.error('❌ Error unlocking badges:', error)
      return false
    }
  },

  // Get all creatures list
  async listCreatures(supabase) {
    try {
      const { data: creatures, error } = await supabase
        .from('creatures')
        .select('id, name, type')
        .order('id')

      if (error) throw error
      console.table(creatures)
      return creatures
    } catch (error) {
      console.error('❌ Error listing creatures:', error)
      return []
    }
  },

  // Max out a creature (level 100, full stats)
  async maxCreature(supabase, userCreatureId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data: userCreature } = await supabase
        .from('user_creatures')
        .select('*, creatures(*)')
        .eq('id', userCreatureId)
        .single()

      const level = 100
      const maxHP = Math.floor(userCreature.creatures.base_hp + (level * 2))
      const maxSP = 50 + (level * 3)

      const { error } = await supabase
        .from('user_creatures')
        .update({
          level: level,
          current_hp: maxHP,
          current_sp: maxSP,
          xp: 0
        })
        .eq('id', userCreatureId)
        .eq('user_id', user.id)

      if (error) throw error
      console.log(`✅ Maxed out ${userCreature.creatures.name} to Lv.100!`)
      return true
    } catch (error) {
      console.error('❌ Error maxing creature:', error)
      return false
    }
  },

  // Clear all creatures
  async clearTeam(supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { error } = await supabase
        .from('user_creatures')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      console.log('✅ Cleared all creatures from team!')
      return true
    } catch (error) {
      console.error('❌ Error clearing team:', error)
      return false
    }
  }
}

// Make dev tools globally accessible in dev mode
if (import.meta.env.DEV) {
  window.devTools = {
    enable: enableDevMode,
    disable: disableDevMode,
    isEnabled: isDevMode,
    actions: devActions
  }
  console.log('🔧 Dev tools available: window.devTools')
}

