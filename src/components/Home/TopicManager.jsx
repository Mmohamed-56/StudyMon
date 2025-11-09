import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import notepadIcon from '../../assets/icons/notepad.png'

const QUESTION_SOURCES = {
  GENERAL: 'general',
  PDF: 'pdf'
}

function TopicManager({ currentTopic, topics, onTopicChange, onTopicsUpdate }) {
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [questionSource, setQuestionSource] = useState(currentTopic?.question_source || QUESTION_SOURCES.GENERAL)
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
          description: newTopicDescription.trim() || null,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setNewTopicName('')
      setNewTopicDescription('')
      setShowNewTopic(false)
      onTopicsUpdate()
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Error creating topic: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e, topicId) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|docx|md)$/i)) {
      alert('Please upload a PDF, TXT, DOCX, or MD file')
      return
    }

    setUploadingFile(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upload file to Supabase Storage
      const fileName = `${user.id}/${topicId}/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName)

      // Save file reference to topic
      const { data: topic } = await supabase
        .from('user_topics')
        .select('documents')
        .eq('id', topicId)
        .single()

      const documents = topic?.documents || []
      documents.push({
        id: Date.now(),
        name: file.name,
        url: publicUrl,
        type: file.type,
        uploaded_at: new Date().toISOString()
      })

      await supabase
        .from('user_topics')
        .update({ documents })
        .eq('id', topicId)
        .eq('user_id', user.id)

      onTopicsUpdate()
      alert('Document uploaded successfully!')
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file: ' + error.message)
    } finally {
      setUploadingFile(false)
    }
  }

  const deleteTopic = async (topicId) => {
    if (!confirm('Delete this topic and all its materials?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_topics')
        .delete()
        .eq('id', topicId)
        .eq('user_id', user.id)

      if (error) throw error

      if (currentTopic?.id === topicId) {
        onTopicChange(null)
      }
      onTopicsUpdate()
    } catch (error) {
      console.error('Error deleting topic:', error)
    }
  }

  const handleChangeQuestionSource = async (source) => {
    if (!currentTopic) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_topics')
        .update({ question_source: source })
        .eq('id', currentTopic.id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating question source:', error)
        alert('Failed to update question source')
      } else {
        onTopicsUpdate()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-800 via-purple-900 to-violet-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={notepadIcon} alt="Topics" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          <h2 className="text-2xl font-bold text-amber-50">Study Topics & Materials</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Existing Topics */}
          {topics.map(topic => (
            <div
              key={topic.id}
              onClick={() => onTopicChange(topic)}
              className={`rounded-2xl p-5 cursor-pointer transition-all border-4 border-double shadow-lg relative overflow-hidden ${
                currentTopic?.id === topic.id
                  ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-950'
                  : 'bg-gradient-to-b from-purple-800 to-purple-950 border-purple-950 hover:from-purple-700 hover:to-purple-900'
              }`}
            >
              {currentTopic?.id === topic.id && (
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              )}
              <div className="relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-amber-50">{topic.topic_name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTopic(topic.id)
                    }}
                    className="text-red-300 hover:text-red-100 text-xl"
                  >
                    ✕
                  </button>
                </div>
                {topic.description && (
                  <p className="text-sm text-purple-200 mb-3">{topic.description}</p>
                )}
                
                {/* Document Count */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-200">
                    📄 {topic.documents?.length || 0} documents
                  </span>
                  
                  {/* Upload Button */}
                  <label className="bg-purple-700 hover:bg-purple-600 text-amber-100 font-bold px-3 py-1 rounded-full cursor-pointer border-2 border-purple-950 transition-colors">
                    + Upload
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.md"
                      onChange={(e) => handleFileUpload(e, topic.id)}
                      className="hidden"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </div>

                {/* Documents List */}
                {topic.documents && topic.documents.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {topic.documents.slice(0, 3).map(doc => (
                      <div key={doc.id} className="text-xs text-purple-100 bg-purple-950/50 rounded px-2 py-1 truncate">
                        📎 {doc.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Topic Card */}
          <button
            onClick={() => setShowNewTopic(!showNewTopic)}
            className="rounded-2xl p-8 border-4 border-dashed border-purple-700 hover:border-purple-600 bg-gradient-to-b from-purple-900/50 to-purple-950/50 hover:from-purple-800/50 hover:to-purple-900/50 transition-all shadow-lg text-center"
          >
            <div className="text-5xl mb-2 opacity-60">+</div>
            <p className="text-purple-200 font-bold">New Topic</p>
          </button>
        </div>

        {/* New Topic Form Modal */}
        {showNewTopic && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-950 rounded-3xl p-8 max-w-lg w-full border-8 border-double border-purple-950 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent)]"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-amber-50 mb-6 text-center">Create New Topic</h3>
                
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div>
                    <label className="block text-amber-100 font-semibold mb-2">Topic Name</label>
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="e.g., Biology, Calculus, History"
                      className="w-full p-3 rounded-2xl bg-stone-900 border-3 border-purple-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-800 shadow-inner font-semibold"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-amber-100 font-semibold mb-2">Description (Optional)</label>
                    <textarea
                      value={newTopicDescription}
                      onChange={(e) => setNewTopicDescription(e.target.value)}
                      placeholder="e.g., AP Biology Unit 3 - Cell Structure"
                      rows={3}
                      className="w-full p-3 rounded-2xl bg-stone-900 border-3 border-purple-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-800 shadow-inner font-semibold resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 disabled:from-stone-700 disabled:to-stone-900 text-amber-50 font-bold py-3 rounded-full border-4 border-double border-green-950 shadow-lg transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
                      <span className="relative">{loading ? 'Creating...' : 'Create Topic'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTopic(false)
                        setNewTopicName('')
                        setNewTopicDescription('')
                      }}
                      className="bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-amber-100 font-bold px-6 py-3 rounded-full border-4 border-double border-stone-950 shadow-lg transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent group-hover:from-white/20 transition-all"></div>
                      <span className="relative">Cancel</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Current Topic Info */}
        {currentTopic && (
          <div className="mt-6 bg-gradient-to-r from-purple-950 to-indigo-950 rounded-2xl p-5 border-4 border-purple-800 shadow-inner">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-purple-200 text-sm font-semibold mb-1">Active Topic:</p>
                <p className="text-amber-100 font-bold text-lg">{currentTopic.topic_name}</p>
                {currentTopic.description && (
                  <p className="text-purple-300 text-sm mt-1">{currentTopic.description}</p>
                )}
              </div>
              {currentTopic.documents && currentTopic.documents.length > 0 && (
                <div className="text-right">
                  <p className="text-purple-200 text-xs mb-1">Study Materials</p>
                  <p className="text-amber-100 font-bold text-2xl">{currentTopic.documents.length}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicManager

