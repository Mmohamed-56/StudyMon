import { useState } from 'react'
import { supabase } from '../../utils/supabase'

function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-800 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-yellow-950 rounded-3xl p-10 max-w-md w-full shadow-2xl border-8 border-double border-amber-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.1),transparent)]"></div>
        <div className="absolute top-3 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-3 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent rounded-full opacity-40"></div>
        
        <div className="relative">
          <div className="text-center mb-8">
            <img 
              src="https://cdn.discordapp.com/attachments/648370607624421377/1436819472592670732/content.png?ex=6910fde9&is=690fac69&hm=604c22efa767de07f191337d4a4d5c96dda507c97b504461cb014cb4fec7550f&" 
              alt="StudyMon Logo" 
              className="h-20 w-auto object-contain mx-auto mb-2 drop-shadow-2xl"
            />
            <p className="text-amber-100 text-sm font-semibold">Begin Your Adventure</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-stone-900 border-4 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner font-semibold"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-stone-900 border-4 border-stone-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-800 shadow-inner font-semibold"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-green-600 to-green-900 hover:from-green-500 hover:to-green-800 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-xl border-4 border-double border-green-950 disabled:border-stone-950 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
              <span className="relative drop-shadow-lg text-lg">
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
              </span>
            </button>
          </form>
          
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-6 text-amber-300 hover:text-amber-100 font-semibold transition-colors"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth