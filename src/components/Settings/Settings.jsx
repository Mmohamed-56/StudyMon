import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import maleTrainer from '../../assets/trainers/male.gif'
import femaleTrainer from '../../assets/trainers/female.gif'
import nonbinaryTrainer from '../../assets/trainers/nonbinary.gif'
import gearIcon from '../../assets/icons/gear.png'
import { isDevMode, enableDevMode, disableDevMode, devActions, checkDevAccount } from '../../utils/devHelper'

function Settings({ trainerInfo, onUpdate }) {
  const [activeSection, setActiveSection] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [userEmail, setUserEmail] = useState('')
  const [userCreatedAt, setUserCreatedAt] = useState('')

  // Profile state
  const [trainerName, setTrainerName] = useState('')
  const [trainerGender, setTrainerGender] = useState('')

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Email state
  const [newEmail, setNewEmail] = useState('')

  // Appearance state (placeholder)
  const [selectedGlasses, setSelectedGlasses] = useState('none')
  const [selectedHat, setSelectedHat] = useState('none')

  // Developer mode state
  const [devModeEnabled, setDevModeEnabled] = useState(false)
  const [availableCreatures, setAvailableCreatures] = useState([])
  const [selectedCreatureId, setSelectedCreatureId] = useState('')
  const [creatureLevel, setCreatureLevel] = useState(5)
  const [spAmount, setSPAmount] = useState(100)

  // Load user email and initialize form values
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        setUserCreatedAt(user.created_at || '')
        
        // Check if dev account
        if (checkDevAccount(user.email)) {
          enableDevMode()
        }
        
        // Update dev mode state
        setDevModeEnabled(isDevMode())
      }
    }

    loadUserData()

    // Load creatures list for dev panel
    const loadCreatures = async () => {
      const creatures = await devActions.listCreatures(supabase)
      setAvailableCreatures(creatures || [])
    }

    if (isDevMode()) {
      loadCreatures()
    }
  }, [])

  // Initialize form values when trainerInfo changes
  useEffect(() => {
    if (trainerInfo) {
      setTrainerName(trainerInfo.trainer_name || '')
      setTrainerGender(trainerInfo.trainer_gender || '')
    }
  }, [trainerInfo])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // Update trainer profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showMessage('error', 'You must be logged in to update your profile')
        setLoading(false)
        return
      }

      // Determine animated sprite based on gender
      const trainerSprite = trainerGender === 'male' 
        ? maleTrainer
        : trainerGender === 'female' 
        ? femaleTrainer 
        : nonbinaryTrainer

      const { error } = await supabase
        .from('user_progress')
        .update({
          trainer_name: trainerName.trim(),
          trainer_gender: trainerGender,
          trainer_sprite: trainerSprite
        })
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      showMessage('success', 'Profile updated successfully!')
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showMessage('error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Update password (Supabase handles re-authentication automatically)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      showMessage('success', 'Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      showMessage('error', error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // Change email
  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      showMessage('error', 'Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      // Check if email is already in use
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser.email === newEmail) {
        showMessage('error', 'This is already your current email address')
        setLoading(false)
        return
      }

      // Update email (Supabase will send a confirmation email)
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        // Check if email is already in use
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          showMessage('error', 'This email is already in use by another account')
        } else {
          throw error
        }
      } else {
        showMessage('success', 'Email update request sent! Please check your new email for confirmation.')
        setNewEmail('')
      }
    } catch (error) {
      console.error('Error changing email:', error)
      showMessage('error', error.message || 'Failed to change email')
    } finally {
      setLoading(false)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Developer mode actions
  const toggleDevMode = () => {
    if (devModeEnabled) {
      disableDevMode()
      setDevModeEnabled(false)
      showMessage('success', 'Developer mode disabled')
    } else {
      enableDevMode()
      setDevModeEnabled(true)
      showMessage('success', 'Developer mode enabled!')
      // Load creatures list
      devActions.listCreatures(supabase).then(creatures => {
        setAvailableCreatures(creatures || [])
      })
    }
  }

  const handleAddCreature = async () => {
    if (!selectedCreatureId) {
      showMessage('error', 'Please select a creature')
      return
    }

    setLoading(true)
    const success = await devActions.addCreature(supabase, parseInt(selectedCreatureId), creatureLevel)
    setLoading(false)
    
    if (success) {
      showMessage('success', `Added creature at level ${creatureLevel}!`)
      if (onUpdate) onUpdate()
    } else {
      showMessage('error', 'Failed to add creature')
    }
  }

  const handleHealAll = async () => {
    setLoading(true)
    const success = await devActions.healAll(supabase)
    setLoading(false)
    
    if (success) {
      showMessage('success', 'Healed all creatures!')
      if (onUpdate) onUpdate()
    } else {
      showMessage('error', 'Failed to heal creatures')
    }
  }

  const handleAddSP = async () => {
    setLoading(true)
    const success = await devActions.addSP(supabase, spAmount)
    setLoading(false)
    
    if (success) {
      showMessage('success', `Added ${spAmount} Study Points!`)
      if (onUpdate) onUpdate()
    } else {
      showMessage('error', 'Failed to add SP')
    }
  }

  const handleUnlockAllBadges = async () => {
    setLoading(true)
    const success = await devActions.unlockAllBadges(supabase)
    setLoading(false)
    
    if (success) {
      showMessage('success', 'Unlocked all badges!')
      if (onUpdate) onUpdate()
    } else {
      showMessage('error', 'Failed to unlock badges')
    }
  }

  const handleClearTeam = async () => {
    if (!confirm('Are you sure you want to delete all creatures? This cannot be undone!')) {
      return
    }

    setLoading(true)
    const success = await devActions.clearTeam(supabase)
    setLoading(false)
    
    if (success) {
      showMessage('success', 'Cleared all creatures!')
      if (onUpdate) onUpdate()
    } else {
      showMessage('error', 'Failed to clear team')
    }
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-200'
              : 'bg-red-500/20 border border-red-500 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(100,116,139,0.1),transparent)]"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full opacity-30"></div>
        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={gearIcon} alt="Settings" className="w-10 h-10" style={{ imageRendering: 'pixelated' }} />
            <h2 className="text-3xl font-bold text-amber-50 drop-shadow-lg">Settings</h2>
          </div>

          {/* Settings Navigation */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'password', label: 'Password' },
              { id: 'email', label: 'Email' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'account', label: 'Account' },
              ...(devModeEnabled ? [{ id: 'developer', label: '🔧 Developer' }] : [])
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-5 py-2 rounded-full transition-all font-bold border-4 border-double shadow-lg ${
                  activeSection === section.id
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 border-amber-950'
                    : 'bg-gradient-to-b from-stone-800 to-stone-900 text-stone-400 hover:from-stone-700 hover:to-stone-800 border-stone-950'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Trainer Profile</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-white mb-2">Trainer Name</label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  maxLength={20}
                  className="w-full p-3 rounded-lg bg-stone-900 border-3 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner"
                  placeholder="Enter your trainer name"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'male', label: 'Male', sprite: maleTrainer },
                    { id: 'female', label: 'Female', sprite: femaleTrainer },
                    { id: 'non-binary', label: 'Non-Binary', sprite: nonbinaryTrainer }
                  ].map((gender) => (
                    <button
                      key={gender.id}
                      type="button"
                      onClick={() => setTrainerGender(gender.id)}
                      className={`p-5 rounded-2xl border-4 border-double transition-all shadow-lg relative overflow-hidden ${
                        trainerGender === gender.id
                          ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-950 text-amber-50'
                          : 'bg-gradient-to-b from-stone-800 to-stone-900 border-stone-950 text-stone-400 hover:from-stone-700 hover:to-stone-800'
                      }`}
                    >
                      {trainerGender === gender.id && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      )}
                      <div className="relative">
                        {/* Shadow base */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-gradient-to-b from-stone-700/60 to-stone-950/80 rounded-full blur-sm"></div>
                        
                        {/* Trainer sprite */}
                        <div className="mb-2">
                          <img 
                            src={gender.sprite} 
                            alt={gender.label}
                            className="w-16 h-16 object-contain mx-auto relative z-10"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <div className="capitalize text-sm font-bold">{gender.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl border-4 border-double border-blue-950 disabled:border-stone-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative drop-shadow"
                  >{loading ? 'Updating...' : 'Update Profile'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Password Section */}
        {activeSection === 'password' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-white mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-stone-900 border-3 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-white mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-stone-900 border-3 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl border-4 border-double border-blue-950 disabled:border-stone-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative drop-shadow"
                  >{loading ? 'Changing Password...' : 'Change Password'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Email Section */}
        {activeSection === 'email' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Change Email</h3>
            <div className="bg-stone-900 rounded-2xl p-4 mb-4 border-3 border-stone-700 shadow-inner">
              <p className="text-amber-200 text-sm font-semibold">
                Current Email: <span className="text-amber-100 font-bold">{userEmail || 'Loading...'}</span>
              </p>
            </div>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="block text-white mb-2">New Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-stone-900 border-3 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner"
                  placeholder="Enter new email address"
                  required
                />
              </div>

            <div className="bg-gradient-to-r from-yellow-900 to-orange-900 border-3 border-yellow-700 rounded-2xl p-4 shadow-md">
              <p className="text-yellow-200 text-sm font-semibold">
                ⚠️ A confirmation email will be sent to your new email address. You'll need to confirm the change before it takes effect.
              </p>
            </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl border-4 border-double border-blue-950 disabled:border-stone-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative drop-shadow"
                  >{loading ? 'Sending Request...' : 'Change Email'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Appearance Section (Placeholder) */}
        {activeSection === 'appearance' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Trainer Appearance</h3>
            <div className="bg-gradient-to-br from-teal-800 to-cyan-950 rounded-3xl p-6 mb-4 border-4 border-double border-teal-950 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.1),transparent)]"></div>
              <div className="relative text-center mb-6">
                <div className="relative inline-block mb-4">
                  {/* Accessories overlay */}
                  {selectedHat !== 'none' && (
                    <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl z-20">
                      {selectedHat === 'cap' ? '🧢' : selectedHat === 'beanie' ? '🎩' : '👒'}
                    </span>
                  )}
                  
                  {/* Shadow base platform */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gradient-to-b from-stone-700/60 to-stone-950/80 rounded-full blur-sm"></div>
                  
                  {/* Trainer animated sprite - fallback based on gender */}
                  <img 
                    src={
                      trainerInfo?.trainer_sprite && trainerInfo.trainer_sprite.includes('.gif')
                        ? trainerInfo.trainer_sprite
                        : trainerInfo?.trainer_gender === 'male' 
                        ? maleTrainer
                        : trainerInfo?.trainer_gender === 'female'
                        ? femaleTrainer
                        : nonbinaryTrainer
                    } 
                    alt="Trainer Preview"
                    className="w-32 h-32 object-contain relative z-10"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  {selectedGlasses !== 'none' && (
                    <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-3xl z-20">
                      {selectedGlasses === 'sunglasses' ? '🕶️' : '👓'}
                    </span>
                  )}
                </div>
                <p className="text-teal-200 font-semibold">Preview</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white mb-3">Glasses</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'none', label: 'None', emoji: '🚫' },
                    { id: 'glasses', label: 'Glasses', emoji: '👓' },
                    { id: 'sunglasses', label: 'Sunglasses', emoji: '🕶️' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedGlasses(item.id)}
                      className={`p-4 rounded-2xl border-4 border-double transition-all shadow-lg relative overflow-hidden ${
                        selectedGlasses === item.id
                          ? 'bg-gradient-to-b from-cyan-600 to-cyan-800 border-cyan-950 text-amber-50'
                          : 'bg-gradient-to-b from-stone-800 to-stone-900 border-stone-950 text-stone-400 hover:from-stone-700 hover:to-stone-800'
                      }`}
                    >
                      {selectedGlasses === item.id && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      )}
                      <div className="relative">
                        <div className="text-3xl mb-2">{item.emoji}</div>
                        <div className="text-sm font-bold">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-3">Hat</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'none', label: 'None', emoji: '🚫' },
                    { id: 'cap', label: 'Cap', emoji: '🧢' },
                    { id: 'beanie', label: 'Beanie', emoji: '🎩' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedHat(item.id)}
                      className={`p-4 rounded-2xl border-4 border-double transition-all shadow-lg relative overflow-hidden ${
                        selectedHat === item.id
                          ? 'bg-gradient-to-b from-cyan-600 to-cyan-800 border-cyan-950 text-amber-50'
                          : 'bg-gradient-to-b from-stone-800 to-stone-900 border-stone-950 text-stone-400 hover:from-stone-700 hover:to-stone-800'
                      }`}
                    >
                      {selectedHat === item.id && (
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      )}
                      <div className="relative">
                        <div className="text-3xl mb-2">{item.emoji}</div>
                        <div className="text-sm font-bold">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            <div className="bg-gradient-to-r from-blue-900 to-cyan-950 border-3 border-blue-800 rounded-2xl p-4 shadow-md">
              <p className="text-cyan-200 text-sm font-semibold">
                💡 This feature is coming soon! Appearance customization will be saved to your trainer profile.
              </p>
            </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
            
            <div className="bg-stone-900 rounded-2xl p-5 space-y-3 border-3 border-stone-700 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-amber-200 font-semibold">Email</span>
                <span className="text-amber-100 font-bold">{userEmail || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-200 font-semibold">Account Created</span>
                <span className="text-amber-100 font-bold">
                  {userCreatedAt 
                    ? new Date(userCreatedAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-200 font-semibold">Developer Mode</span>
                <button
                  onClick={toggleDevMode}
                  className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${
                    devModeEnabled
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-stone-700 text-stone-400 hover:bg-stone-600'
                  }`}
                >
                  {devModeEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            <div className="border-t-4 border-double border-stone-800 pt-6 mt-6">
              <button
                onClick={handleSignOut}
                className="w-full bg-gradient-to-b from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-amber-50 font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl border-4 border-double border-red-950 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                <span className="relative drop-shadow">Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Developer Section */}
        {activeSection === 'developer' && devModeEnabled && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-purple-300 mb-4">🔧 Developer Tools</h3>
            
            <div className="bg-gradient-to-r from-purple-900 to-pink-900 border-3 border-purple-700 rounded-2xl p-4 mb-4">
              <p className="text-purple-200 text-sm font-semibold">
                ⚠️ Warning: These tools are for development and testing only. Use with caution!
              </p>
            </div>

            {/* Add Creature */}
            <div className="bg-stone-900 rounded-2xl p-5 border-3 border-stone-700 shadow-inner space-y-3">
              <h4 className="text-white font-bold">Add Creature</h4>
              <div className="space-y-2">
                <label className="block text-white text-sm">Select Creature</label>
                <select
                  value={selectedCreatureId}
                  onChange={(e) => setSelectedCreatureId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-stone-800 border-2 border-stone-600 text-amber-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Choose a creature...</option>
                  {availableCreatures.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id} - {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-white text-sm">Level (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={creatureLevel}
                  onChange={(e) => setCreatureLevel(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-lg bg-stone-800 border-2 border-stone-600 text-amber-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleAddCreature}
                disabled={loading || !selectedCreatureId}
                className="w-full bg-gradient-to-b from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 disabled:from-stone-700 disabled:to-stone-900 text-white font-bold py-3 rounded-full shadow-lg transition-all border-4 border-double border-purple-950"
              >
                {loading ? 'Adding...' : 'Add Creature'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-stone-900 rounded-2xl p-5 border-3 border-stone-700 shadow-inner space-y-3">
              <h4 className="text-white font-bold">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleHealAll}
                  disabled={loading}
                  className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all border-2 border-green-950"
                >
                  Heal All
                </button>
                <button
                  onClick={handleUnlockAllBadges}
                  disabled={loading}
                  className="bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all border-2 border-yellow-950"
                >
                  All Badges
                </button>
              </div>
            </div>

            {/* Add SP */}
            <div className="bg-stone-900 rounded-2xl p-5 border-3 border-stone-700 shadow-inner space-y-3">
              <h4 className="text-white font-bold">Add Study Points</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={spAmount}
                  onChange={(e) => setSPAmount(parseInt(e.target.value) || 100)}
                  className="flex-1 p-2 rounded-lg bg-stone-800 border-2 border-stone-600 text-amber-100 focus:outline-none focus:border-purple-500"
                  placeholder="Amount"
                />
                <button
                  onClick={handleAddSP}
                  disabled={loading}
                  className="bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all border-2 border-blue-950"
                >
                  Add SP
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-5 border-4 border-double border-red-800 shadow-lg space-y-3">
              <h4 className="text-red-200 font-bold">⚠️ Danger Zone</h4>
              <button
                onClick={handleClearTeam}
                disabled={loading}
                className="w-full bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 rounded-full shadow-lg transition-all border-4 border-double border-red-950"
              >
                Clear All Creatures
              </button>
            </div>

            {/* Console Tips */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-950 border-3 border-indigo-700 rounded-2xl p-4">
              <p className="text-indigo-200 text-sm font-semibold mb-2">
                💡 Console Commands:
              </p>
              <code className="text-xs text-indigo-300 block">
                window.devTools.actions.listCreatures(supabase)<br/>
                window.devTools.actions.levelUpCreature(supabase, id, levels)<br/>
                window.devTools.actions.maxCreature(supabase, id)
              </code>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default Settings

