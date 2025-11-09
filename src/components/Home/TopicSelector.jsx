import { useState } from 'react'
import { supabase } from '../../utils/supabase'

function TopicSelector({ currentTopic, topics, onTopicChange, onTopicsUpdate }) {
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateTopic = async (e) => {
    e.preventDefault()
    if (!newTopicName.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create new topic
      const { data: newTopic, error } = await supabase
        .from('user_topics')
        .insert({
          user_id: user.id,
          topic_name: newTopicName.trim(),
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setNewTopicName('')
      setShowNewTopic(false)
      onTopicsUpdate()
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Error creating topic: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-800 via-purple-900 to-violet-950 rounded-3xl p-6 shadow-2xl border-8 border-double border-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <h2 className="text-2xl font-bold text-amber-50 mb-4 text-center">📚 Study Topic</h2>
        
        <div className="flex gap-3 items-center">
          {/* Topic Dropdown */}
          <select
            value={currentTopic?.id || ''}
            onChange={(e) => {
              const selected = topics.find(t => t.id === parseInt(e.target.value))
              onTopicChange(selected)
            }}
            className="flex-1 p-3 rounded-2xl bg-stone-900 border-3 border-purple-800 text-amber-100 font-semibold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-800 shadow-inner"
          >
            <option value="">Select a topic...</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.topic_name}
              </option>
            ))}
          </select>

          {/* Add Topic Button */}
          <button
            onClick={() => setShowNewTopic(!showNewTopic)}
            className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold px-6 py-3 rounded-full border-4 border-double border-green-950 shadow-lg transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
            <span className="relative">+ New</span>
          </button>
        </div>

        {/* New Topic Form */}
        {showNewTopic && (
          <form onSubmit={handleCreateTopic} className="mt-4 flex gap-3">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Enter topic name (e.g., Biology, Math, History)"
              className="flex-1 p-3 rounded-2xl bg-stone-900 border-3 border-purple-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-800 shadow-inner font-semibold"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !newTopicName.trim()}
              className="bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold px-6 py-3 rounded-full border-4 border-double border-blue-950 shadow-lg transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
              <span className="relative">{loading ? '...' : 'Create'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewTopic(false)
                setNewTopicName('')
              }}
              className="bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-amber-100 font-bold px-6 py-3 rounded-full border-4 border-double border-stone-950 shadow-lg transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-all"></div>
              <span className="relative">Cancel</span>
            </button>
          </form>
        )}

        {/* Current Topic Display */}
        {currentTopic && (
          <div className="mt-4 bg-gradient-to-r from-purple-950 to-indigo-950 rounded-2xl p-4 border-3 border-purple-800 shadow-inner">
            <p className="text-purple-200 text-sm font-semibold">
              Current Topic: <span className="text-amber-100 font-bold">{currentTopic.topic_name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicSelector

