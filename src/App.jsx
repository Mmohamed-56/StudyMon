import { useEffect, useState } from 'react'
import { supabase } from './utils/supabase'
import Auth from './components/Auth/Auth'
import TrainerSetup from './components/TrainerSetup/TrainerSetup'
import Dashboard from './components/Dashboard/Dashboard'
import { clearDevSession } from './utils/devHelper'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  // Optional: Add a dev logout button (press 'L' key)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'L' && e.shiftKey && import.meta.env.DEV) {
        clearDevSession()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkSetup(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkSetup(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSetup = async (userId) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('starter_chosen')
      .eq('user_id', userId)
      .maybeSingle()

    // If no record exists or starter not chosen, needs setup
    setNeedsSetup(!data || !data.starter_chosen)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-800 flex items-center justify-center">
        <p className="text-amber-200 text-xl font-bold">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (needsSetup) {
    return <TrainerSetup onComplete={() => setNeedsSetup(false)} />
  }

  return <Dashboard />
}

export default App