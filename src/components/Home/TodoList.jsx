import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading todos:', error)
      } else {
        setTodos(data || [])
      }
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_todos')
        .insert({
          user_id: user.id,
          task: newTodo.trim(),
          completed: false
        })
        .select()
        .single()

      if (error) throw error

      setTodos([...todos, data])
      setNewTodo('')
    } catch (error) {
      console.error('Error adding todo:', error)
      alert('Error adding task: ' + error.message)
    }
  }

  const toggleTodo = async (todoId, currentStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_todos')
        .update({ completed: !currentStatus })
        .eq('id', todoId)
        .eq('user_id', user.id)

      if (error) throw error

      setTodos(todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !currentStatus } : todo
      ))
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const deleteTodo = async (todoId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', user.id)

      if (error) throw error

      setTodos(todos.filter(todo => todo.id !== todoId))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-teal-800 via-emerald-900 to-green-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-teal-950">
        <p className="text-amber-200 text-center">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-teal-800 via-emerald-900 to-green-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-teal-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <h2 className="text-2xl font-bold text-amber-50 mb-6 text-center">📝 Weekly Tasks</h2>

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 p-3 rounded-2xl bg-stone-900 border-3 border-teal-700 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-800 shadow-inner font-semibold"
          />
          <button
            type="submit"
            className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold px-6 py-3 rounded-full border-4 border-double border-green-950 shadow-lg transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent group-hover:from-white/30 transition-all"></div>
            <span className="relative">Add</span>
          </button>
        </form>

        {/* Todo List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-teal-200 text-center py-8 font-semibold">No tasks yet! Add some to get started.</p>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-2xl p-4 border-3 border-teal-800 shadow-md flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="w-6 h-6 rounded accent-green-500 cursor-pointer"
                />
                <span className={`flex-1 text-amber-100 font-semibold ${todo.completed ? 'line-through opacity-60' : ''}`}>
                  {todo.task}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="bg-red-900 hover:bg-red-800 text-amber-100 font-bold px-3 py-1 rounded-full border-2 border-red-950 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TodoList

