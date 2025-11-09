import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { getTypeEffectiveness } from '../../utils/typechart'
import QuestionModal from './QuestionModal'
import XPBar from '../Shared/XPBar'
import LevelUpModal from '../Shared/LevelUpModal'
import femaleRunning from '../../assets/runningTrainers/female-running.gif'
import maleRunning from '../../assets/runningTrainers/male-running.gif'
import nonbinaryRunning from '../../assets/runningTrainers/nonbinary-running.gif'

function Battle({ playerTeam, trainerInfo, onExit, currentTopic }) {
  // Battle state
  const [activePlayerCreature, setActivePlayerCreature] = useState(null)
  const [wildCreature, setWildCreature] = useState(null)
  const [playerHP, setPlayerHP] = useState(0)
  const [playerSP, setPlayerSP] = useState(0)
  const [wildHP, setWildHP] = useState(0)
  const [battleLog, setBattleLog] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // Skills
  const [playerSkills, setPlayerSkills] = useState([])
  const [wildSkills, setWildSkills] = useState([])
  const [wildSkillUses, setWildSkillUses] = useState({}) // Track limited uses
  
  // UI state
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [pendingSkill, setPendingSkill] = useState(null)
  const [showSwitchMenu, setShowSwitchMenu] = useState(false)
  const [showCatchButton, setShowCatchButton] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [leveledUpCreature, setLeveledUpCreature] = useState(null)
  const [newLevel, setNewLevel] = useState(0)
  
  // Add current_xp to creature state
  useEffect(() => {
    if (activePlayerCreature) {
      // Ensure current_xp is set
      const xp = activePlayerCreature.current_xp || 0
      if (activePlayerCreature.current_xp === undefined) {
        activePlayerCreature.current_xp = xp
      }
    }
  }, [activePlayerCreature])

  useEffect(() => {
    loadBattle()
  }, [playerTeam])

  useEffect(() => {
    // Show catch button when wild HP < 30%
    if (wildCreature && wildHP > 0) {
      const hpPercent = (wildHP / wildCreature.maxHP) * 100
      setShowCatchButton(hpPercent < 30)
    }
  }, [wildHP, wildCreature])

  const loadBattle = async () => {
    if (!playerTeam || playerTeam.length === 0) {
      setBattleLog(['You need at least one creature in your party!'])
      setLoading(false)
      return
    }

    // Get party members (sorted by party_position)
    const party = playerTeam
      .filter(c => c.party_position !== null)
      .sort((a, b) => a.party_position - b.party_position)

    if (party.length === 0) {
      setBattleLog(['You need to set up your party first! Go to Party tab.'])
      setLoading(false)
      return
    }

    // Active creature is first in party
    const activeCreature = party[0]
    
    // Load player's skills
    await loadPlayerSkills(activeCreature)
    
    // Get all creatures for wild encounter
    const { data: creatures } = await supabase
      .from('creatures')
      .select('*')

    if (creatures && creatures.length > 0) {
      // Calculate player stats
      const player = calculateStats({
        ...activeCreature.creatures,
        level: activeCreature.level,
        userCreatureId: activeCreature.id,
        current_xp: activeCreature.current_xp || 0
      })
      
      const maxHP = Math.floor(activeCreature.creatures.base_hp + (activeCreature.level * 2))
      let currentHP = activeCreature.current_hp ?? maxHP
      const maxSP = activeCreature.max_sp || 50
      const currentSP = activeCreature.current_sp || 0
      
      // Initialize HP if needed
      if (activeCreature.current_hp == null) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('user_creatures')
            .update({ current_hp: maxHP })
            .eq('id', activeCreature.id)
            .eq('user_id', user.id)
          currentHP = maxHP
        }
      }
      
      // Wild creature (random, exclude player's)
      const availableWild = creatures.filter(
        c => !playerTeam.some(pt => pt.creatures.id === c.id)
      )
      const wildData = availableWild.length > 0
        ? availableWild[Math.floor(Math.random() * availableWild.length)]
        : creatures[Math.floor(Math.random() * creatures.length)]
      
      const wild = calculateStats({
        ...wildData,
        level: Math.floor(Math.random() * 3) + 3
      })

      // Load wild creature skills
      await loadWildSkills(wild.type)

      setActivePlayerCreature(player)
      setWildCreature(wild)
      setPlayerHP(Math.max(1, currentHP))
      setPlayerSP(currentSP)
      setWildHP(wild.maxHP)
      setBattleLog([`A wild ${wild.name} appeared!`])
      setLoading(false)
    }
  }

  const loadPlayerSkills = async (creature) => {
    try {
      // Get learned skills for this creature
      const { data, error } = await supabase
        .from('user_creature_skills')
        .select(`
          skill_id,
          skills (*)
        `)
        .eq('user_creature_id', creature.id)

      if (error) {
        console.error('Error loading player skills:', error)
        return
      }

      if (data && data.length > 0) {
        const skills = data.map(d => d.skills).filter(Boolean)
        setPlayerSkills(skills)
      } else {
        // No skills learned yet - assign default level 1 skill
        await assignDefaultSkill(creature)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const assignDefaultSkill = async (creature) => {
    try {
      // Find creature's type
      const { data: creatureData } = await supabase
        .from('creatures')
        .select('type')
        .eq('id', creature.creatures.id)
        .single()

      if (!creatureData) return

      // Get type_id first (case-insensitive)
      const { data: typeData } = await supabase
        .from('creature_types')
        .select('id')
        .ilike('name', creatureData.type)
        .single()

      if (!typeData) return

      // Get a level 1 skill of matching type
      const { data: skillData } = await supabase
        .from('skills')
        .select('*')
        .eq('type_id', typeData.id)
        .eq('skill_level', 1)
        .limit(1)
        .single()

      if (skillData) {
        // Assign it
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('user_creature_skills')
            .insert({
              user_creature_id: creature.id,
              skill_id: skillData.id,
              learned_at_level: creature.level
            })
          
          setPlayerSkills([skillData])
        }
      }
    } catch (error) {
      console.error('Error assigning default skill:', error)
    }
  }

  const loadWildSkills = async (creatureType) => {
    try {
      // First, get the type_id from creature_types (case-insensitive)
      const { data: typeData } = await supabase
        .from('creature_types')
        .select('id')
        .ilike('name', creatureType)
        .single()

      if (!typeData) {
        console.error('Could not find type:', creatureType)
        return
      }

      // Get 1 skill of each level for this type_id
      const skills = []
      const uses = {}

      for (let level = 1; level <= 4; level++) {
        const { data } = await supabase
          .from('skills')
          .select('*')
          .eq('type_id', typeData.id)
          .eq('skill_level', level)
          .limit(1)

        if (data && data.length > 0) {
          skills.push(data[0])
          // Set usage limits: Level 3 = 2 uses, Level 4 = 1 use
          uses[data[0].id] = level === 3 ? 2 : level === 4 ? 1 : Infinity
        }
      }

      setWildSkills(skills)
      setWildSkillUses(uses)
    } catch (error) {
      console.error('Error loading wild skills:', error)
    }
  }

  const calculateStats = (creature) => {
    const level = creature.level || 5
    const maxHP = Math.floor(creature.base_hp + (level * 2))
    return {
      ...creature,
      maxHP,
      hp: maxHP,
      attack: Math.floor(creature.base_attack + (level * 1.5))
    }
  }

  const calculateSkillDamage = (attacker, defender, skill) => {
    const baseDamage = Math.floor(attacker.attack * (skill.base_power / 100))
    const variance = Math.floor(Math.random() * 5) - 2
    const effectiveness = getTypeEffectiveness(attacker.type, defender.type)
    return Math.max(1, Math.floor((baseDamage + variance) * effectiveness))
  }

  const [showSkillMenu, setShowSkillMenu] = useState(false)

  const handleGainSP = () => {
    if (!isPlayerTurn) return
    setShowQuestionModal(true)
  }

  const handleQuestionAnswer = async (spGained, difficulty) => {
    // Just add SP (no skill execution)
    const newSP = Math.min(playerSP + spGained, activePlayerCreature.max_sp || 50)
    setPlayerSP(newSP)
    setBattleLog(prev => [...prev, `Answered ${difficulty} question! +${spGained} SP (Total: ${newSP})`])
  }

  const handleSkillClick = async (skill) => {
    if (!isPlayerTurn) return
    if (playerSP < skill.sp_cost) {
      setBattleLog(prev => [...prev, `Not enough SP! Need ${skill.sp_cost}, have ${playerSP}`])
      return
    }

    setShowSkillMenu(false)
    await executeSkill(activePlayerCreature, wildCreature, skill, true)
  }

  const executeSkill = async (attacker, defender, skill, isPlayer) => {
    // Spend SP (player only)
    if (isPlayer) {
      setPlayerSP(prev => Math.max(0, prev - skill.sp_cost))
    }

    // Calculate damage
    const damage = calculateSkillDamage(attacker, defender, skill)
    
    if (isPlayer) {
      const newWildHP = Math.max(0, wildHP - damage)
      setWildHP(newWildHP)
      setBattleLog(prev => [...prev, `${attacker.name} used ${skill.name}! Dealt ${damage} damage!`])

      if (newWildHP <= 0) {
        setBattleLog(prev => [...prev, `${wildCreature.name} fainted! You win!`])
        await saveBattleResults(true)
        return
      }
    } else {
      const newPlayerHP = Math.max(0, playerHP - damage)
      setPlayerHP(newPlayerHP)
      setBattleLog(prev => [...prev, `${attacker.name} used ${skill.name}! Dealt ${damage} damage!`])

      if (newPlayerHP <= 0) {
        setBattleLog(prev => [...prev, `${activePlayerCreature.name} fainted!`])
        await handlePlayerFaint()
        return
      }
    }

    // Enemy turn
    if (isPlayer) {
      setIsPlayerTurn(false)
      setTimeout(() => {
        wildTurn()
      }, 1500)
    } else {
      setIsPlayerTurn(true)
    }
  }

  const wildTurn = () => {
    // Wild creature picks random usable skill
    const usableSkills = wildSkills.filter(s => 
      (wildSkillUses[s.id] === Infinity || wildSkillUses[s.id] > 0)
    )

    if (usableSkills.length === 0) {
      setBattleLog(prev => [...prev, `${wildCreature.name} has no moves left!`])
      setIsPlayerTurn(true)
      return
    }

    const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)]
    
    // Decrement uses if limited
    if (wildSkillUses[skill.id] !== Infinity) {
      setWildSkillUses(prev => ({
        ...prev,
        [skill.id]: prev[skill.id] - 1
      }))
    }

    executeSkill(wildCreature, activePlayerCreature, skill, false)
  }

  const handlePlayerFaint = async () => {
    // Check if player has more creatures
    const aliveParty = playerTeam.filter(c => 
      c.party_position !== null && 
      c.id !== activePlayerCreature.userCreatureId &&
      (c.current_hp ?? Math.floor(c.creatures.base_hp + (c.level * 2))) > 0
    )

    if (aliveParty.length > 0) {
      setBattleLog(prev => [...prev, 'Choose another creature to continue!'])
      setShowSwitchMenu(true)
    } else {
      setBattleLog(prev => [...prev, 'All your creatures fainted! You lost!'])
      await saveBattleResults(false)
    }
  }

  const handleSwitch = async (newCreature) => {
    setShowSwitchMenu(false)
    
    // Save current creature's HP/SP first
    await saveBattleResults(false, true) // Don't exit, just save
    
    setLoading(true)

    // Load new creature's skills
    await loadPlayerSkills(newCreature)

    const player = calculateStats({
      ...newCreature.creatures,
      level: newCreature.level,
      userCreatureId: newCreature.id
    })
    
    // Add max_sp to player object
    player.max_sp = newCreature.max_sp || 50

    const maxHP = Math.floor(newCreature.creatures.base_hp + (newCreature.level * 2))
    const currentHP = newCreature.current_hp ?? maxHP
    const maxSP = newCreature.max_sp || 50
    const currentSP = newCreature.current_sp || 0

    setActivePlayerCreature(player)
    setPlayerHP(currentHP)
    setPlayerSP(currentSP)
    setBattleLog(prev => [...prev, `Go, ${player.name}!`])
    setLoading(false)
    
    // Wild creature gets a turn after switch
    setIsPlayerTurn(false)
    setTimeout(() => {
      wildTurn()
    }, 1000)
  }

  const handleCatch = () => {
    setPendingSkill({ name: 'Catch', sp_cost: 0 })
    setShowQuestionModal(true)
  }

  const handleCatchSuccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Add wild creature to user's collection
      const { error } = await supabase
        .from('user_creatures')
        .insert({
          user_id: user.id,
          creature_id: wildCreature.id,
          level: wildCreature.level,
          current_hp: wildHP,
          current_sp: 0,
          caught_method: 'caught',
          caught_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error catching creature:', error)
        setBattleLog(prev => [...prev, 'Catch failed! Try again later.'])
      } else {
        setBattleLog(prev => [...prev, `You caught ${wildCreature.name}!`])
        setTimeout(() => {
          onExit()
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const saveBattleResults = async (won, justSave = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('Saving battle results:', { 
        creatureId: activePlayerCreature.userCreatureId,
        hp: playerHP, 
        sp: playerSP,
        won, 
        justSave 
      })

      // Save HP and SP
      const maxHP = Math.floor(activePlayerCreature.base_hp + (activePlayerCreature.level * 2))
      const hpToSave = Math.max(0, Math.min(playerHP, maxHP))

      // Calculate XP gain if won
      let xpGain = 0
      if (won && !justSave) {
        // XP = opponent level * 10
        xpGain = wildCreature.level * 10
        setBattleLog(prev => [...prev, `${activePlayerCreature.name} gained ${xpGain} XP!`])
      }

      const { data, error } = await supabase
        .from('user_creatures')
        .update({ 
          current_hp: hpToSave,
          current_sp: playerSP,
          current_xp: activePlayerCreature.current_xp + xpGain
        })
        .eq('id', activePlayerCreature.userCreatureId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('Error saving HP/SP/XP:', error)
      } else {
        console.log('Saved successfully:', data)
        
        // Check for level up
        if (won && xpGain > 0 && data && data.length > 0) {
          await checkLevelUp(data[0])
        }
      }

      // If won, increment battles_won
      if (won && !justSave) {
        await supabase.rpc('increment_battles_won', { user_id: user.id })
      }
    } catch (error) {
      console.error('Error saving battle results:', error)
    }
  }

  const checkLevelUp = async (creatureData) => {
    const currentLevel = creatureData.level
    const currentXP = creatureData.current_xp
    const xpNeeded = currentLevel * 50

    if (currentXP >= xpNeeded) {
      // Level up!
      const newLevelValue = currentLevel + 1
      const remainingXP = currentXP - xpNeeded

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('user_creatures')
          .update({ 
            level: newLevelValue,
            current_xp: remainingXP
          })
          .eq('id', creatureData.id)
          .eq('user_id', user.id)

        if (!error) {
          setBattleLog(prev => [...prev, `🎉 ${activePlayerCreature.name} leveled up to ${newLevelValue}!`])
          
          // Update active creature level and XP
          setActivePlayerCreature(prev => ({
            ...prev,
            level: newLevelValue,
            current_xp: remainingXP
          }))

          // Check if this level allows learning a new skill
          const canLearnSkill = 
            (newLevelValue % 2 === 0) ||  // Level 1 skills every 2 levels
            (newLevelValue % 5 === 0) ||  // Level 2 skills every 5 levels
            (newLevelValue % 10 === 0) || // Level 3 skills every 10 levels
            (newLevelValue % 15 === 0)    // Level 4 skills every 15 levels

          if (canLearnSkill) {
            // Show level up modal
            setLeveledUpCreature({
              ...creatureData,
              id: activePlayerCreature.userCreatureId,
              creatures: {
                id: activePlayerCreature.id,
                name: activePlayerCreature.name,
                type: activePlayerCreature.type,
                sprite: activePlayerCreature.sprite
              }
            })
            setNewLevel(newLevelValue)
            setShowLevelUpModal(true)
          }
        }
      } catch (error) {
        console.error('Error leveling up:', error)
      }
    }
  }

  const handleSkillLearned = async () => {
    // Reload player skills after learning a new one
    if (activePlayerCreature) {
      const party = playerTeam
        .filter(c => c.party_position !== null)
        .sort((a, b) => a.party_position - b.party_position)
      
      const activeCreature = party[0]
      await loadPlayerSkills(activeCreature)
    }
  }

  const handleFlee = async () => {
    await saveBattleResults(false)
    onExit()
  }

  if (loading) {
    // Select trainer sprite based on gender
    const runningSprite = 
      trainerInfo?.trainer_gender === 'female' ? femaleRunning :
      trainerInfo?.trainer_gender === 'male' ? maleRunning :
      nonbinaryRunning

    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-800 via-stone-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <img 
            src={runningSprite} 
            alt="Trainer running"
            className="w-32 h-32 mx-auto mb-4"
            style={{ imageRendering: 'pixelated' }}
          />
          <p className="text-amber-50 text-2xl font-bold">Loading battle...</p>
        </div>
      </div>
    )
  }

  if (!activePlayerCreature || !wildCreature) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-800 via-stone-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-stone-700 to-stone-800 rounded-3xl p-8 text-center shadow-2xl border-8 border-double border-stone-950">
          <p className="text-xl mb-6 text-amber-50 font-bold">{battleLog[0] || 'Unable to start battle'}</p>
          <button
            onClick={onExit}
            className="bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-amber-50 font-bold py-3 px-8 rounded-2xl border-4 border-double border-blue-950 shadow-xl"
          >
            Back to Hub
          </button>
        </div>
      </div>
    )
  }

  const party = playerTeam.filter(c => c.party_position !== null).sort((a, b) => a.party_position - b.party_position)
  const canSwitch = party.length > 1 && party.some(c => 
    c.id !== activePlayerCreature.userCreatureId && 
    (c.current_hp ?? Math.floor(c.creatures.base_hp + (c.level * 2))) > 0
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-800 via-stone-900 to-zinc-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Wild Creature */}
        <div className="mb-8 flex justify-end">
          <div className="inline-block bg-gradient-to-br from-stone-700 to-stone-800 rounded-2xl p-6 shadow-2xl border-4 border-stone-900">
            <p className="text-sm text-amber-200 mb-2 font-bold">{wildCreature.name} Lv.{wildCreature.level}</p>
            <div className="flex items-center gap-4">
              <div>
                <div className="w-48 bg-stone-950 rounded-full h-4 border-2 border-stone-900 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(wildHP / wildCreature.maxHP) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-amber-100 mt-2 font-semibold">{wildHP}/{wildCreature.maxHP} HP</p>
              </div>
              <span className="text-6xl drop-shadow-lg">{wildCreature.sprite}</span>
            </div>
          </div>
        </div>

        {/* Player Creature */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-6 shadow-2xl border-4 border-green-950">
            <p className="text-sm text-amber-200 mb-2 font-bold">{activePlayerCreature.name} Lv.{activePlayerCreature.level}</p>
            <div className="flex items-center gap-4">
              <span className="text-6xl drop-shadow-lg">{activePlayerCreature.sprite}</span>
              <div>
                {/* HP Bar */}
                <div className="w-48 bg-stone-950 rounded-full h-4 mb-2 border-2 border-stone-900 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-lime-500 to-green-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(playerHP / activePlayerCreature.maxHP) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-amber-100 mb-3 font-semibold">{playerHP}/{activePlayerCreature.maxHP} HP</p>
                
                {/* SP Bar */}
                <div className="w-48 bg-stone-950 rounded-full h-3 mb-2 border-2 border-stone-900 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(playerSP / (activePlayerCreature.max_sp || 50)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 mb-3 font-semibold">{playerSP}/{activePlayerCreature.max_sp || 50} SP</p>
                
                {/* XP Bar */}
                <XPBar 
                  currentXP={activePlayerCreature.current_xp || 0} 
                  level={activePlayerCreature.level} 
                  className="w-48"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-4 mb-6 h-32 overflow-y-auto border-4 border-stone-950 shadow-inner">
          {battleLog.map((log, i) => (
            <p key={i} className="text-sm mb-1 text-amber-100 font-semibold">{log}</p>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Gain SP Button */}
          <button
            onClick={handleGainSP}
            disabled={!isPlayerTurn || playerHP <= 0 || wildHP <= 0}
            className="bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 px-4 rounded-2xl border-4 border-double border-amber-950 disabled:border-stone-950 transition-all shadow-xl"
          >
            <div className="text-lg">📚 Gain SP</div>
            <div className="text-xs mt-1">Answer Question</div>
          </button>

          {/* Use Skills Button */}
          <button
            onClick={() => setShowSkillMenu(true)}
            disabled={!isPlayerTurn || playerHP <= 0 || wildHP <= 0 || playerSkills.length === 0}
            className="bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 px-4 rounded-2xl border-4 border-double border-blue-950 disabled:border-stone-950 transition-all shadow-xl"
          >
            <div className="text-lg">⚔️ Use Skill</div>
            <div className="text-xs mt-1">{playerSkills.length} Available</div>
          </button>

          {/* Switch */}
          {canSwitch && (
            <button
              onClick={() => setShowSwitchMenu(true)}
              disabled={!isPlayerTurn || playerHP <= 0}
              className="bg-gradient-to-b from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 px-4 rounded-2xl border-4 border-double border-purple-950 disabled:border-stone-950 transition-all shadow-xl"
            >
              <div className="text-lg">🔄 Switch</div>
              <div className="text-xs mt-1">Change Creature</div>
            </button>
          )}

          {/* Catch */}
          {showCatchButton && (
            <button
              onClick={handleCatch}
              disabled={!isPlayerTurn || playerHP <= 0}
              className="bg-gradient-to-b from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 px-4 rounded-2xl border-4 border-double border-emerald-950 disabled:border-stone-950 transition-all shadow-xl"
            >
              <div className="text-lg">⚡ Catch!</div>
              <div className="text-xs mt-1">HP &lt; 30%</div>
            </button>
          )}

          {/* Flee */}
          <button
            onClick={handleFlee}
            disabled={!isPlayerTurn || playerHP <= 0}
            className="bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 px-4 rounded-2xl border-4 border-double border-red-950 disabled:border-stone-950 transition-all shadow-xl"
          >
            <div className="text-lg">🏃 Flee</div>
            <div className="text-xs mt-1">Escape Battle</div>
          </button>
        </div>

        {/* Battle End */}
        {(playerHP <= 0 || wildHP <= 0) && !showSwitchMenu && (
          <div className="mt-6 text-center">
            <button
              onClick={onExit}
              className="bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-amber-50 font-bold py-4 px-10 rounded-2xl border-4 border-double border-blue-950 shadow-xl transition-all"
            >
              Back to Hub
            </button>
          </div>
        )}
      </div>

      {/* Skill Selection Menu */}
      {showSkillMenu && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-8 border-double border-stone-950">
            <h3 className="text-2xl font-bold mb-6 text-center text-amber-50 drop-shadow-lg">Choose a Skill</h3>
            <div className="space-y-3">
              {playerSkills.map(skill => {
                const canUse = playerSP >= skill.sp_cost
                return (
                  <button
                    key={skill.id}
                    onClick={() => canUse && handleSkillClick(skill)}
                    disabled={!canUse}
                    className={`w-full p-4 rounded-2xl border-4 border-double transition-all shadow-lg ${
                      canUse
                        ? 'bg-gradient-to-r from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800 border-blue-950'
                        : 'bg-gradient-to-r from-stone-700 to-stone-800 border-stone-900 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <p className="font-bold text-lg text-amber-50 drop-shadow">{skill.name}</p>
                        <p className="text-sm text-amber-200">{skill.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-300">Power: {skill.base_power}</p>
                        <p className={`text-sm font-bold ${canUse ? 'text-green-300' : 'text-red-300'}`}>
                          Cost: {skill.sp_cost} SP
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowSkillMenu(false)}
              className="mt-6 w-full bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-3 rounded-2xl font-bold text-amber-200 border-4 border-double border-stone-950 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Question Modal */}
      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false)
          setPendingSkill(null)
        }}
        onCorrectAnswer={(spGained, difficulty) => {
          if (pendingSkill?.name === 'Catch') {
            handleCatchSuccess()
          } else {
            handleQuestionAnswer(spGained, difficulty)
          }
        }}
        currentTopic={currentTopic}
        actionType={pendingSkill?.name === 'Catch' ? 'catch' : 'sp'}
      />

      {/* Switch Menu */}
      {showSwitchMenu && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-8 border-double border-purple-950">
            <h3 className="text-2xl font-bold mb-6 text-center text-amber-50 drop-shadow-lg">Switch Creature</h3>
            <div className="space-y-2">
              {party.map(creature => {
                const maxHP = Math.floor(creature.creatures.base_hp + (creature.level * 2))
                const currentHP = creature.current_hp ?? maxHP
                const isActive = creature.id === activePlayerCreature.userCreatureId
                const isFainted = currentHP <= 0

                if (isActive || isFainted) return null

                return (
                  <button
                    key={creature.id}
                    onClick={() => handleSwitch(creature)}
                    className="w-full bg-gradient-to-r from-green-800 to-teal-900 hover:from-green-700 hover:to-teal-800 p-4 rounded-2xl flex items-center gap-4 border-4 border-double border-green-950 shadow-lg transition-all"
                  >
                    <span className="text-4xl drop-shadow-lg">{creature.creatures.sprite}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-amber-50">{creature.creatures.name}</p>
                      <p className="text-sm text-green-200">Lv. {creature.level} | HP: {currentHP}/{maxHP}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowSwitchMenu(false)}
              className="mt-6 w-full bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 py-3 rounded-2xl font-bold text-amber-200 border-4 border-double border-stone-950 shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      {showLevelUpModal && leveledUpCreature && (
        <LevelUpModal
          creature={leveledUpCreature}
          newLevel={newLevel}
          onClose={() => setShowLevelUpModal(false)}
          onSkillLearned={handleSkillLearned}
        />
      )}
    </div>
  )
}

export default Battle

