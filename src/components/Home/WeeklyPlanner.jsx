import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import calendarIcon from '../../assets/icons/calander.png'

function WeeklyPlanner() {
  const [tasks, setTasks] = useState({})
  const [selectedDay, setSelectedDay] = useState(null)
  const [newTask, setNewTask] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [loading, setLoading] = useState(true)

  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ]

  useEffect(() => {
    loadTasks()
    // Set current day as selected
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    setSelectedDay(today)
  }, [])

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('weekly_tasks')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading tasks:', error)
      } else {
        // Organize tasks by day
        const tasksByDay = {}
        data?.forEach(task => {
          if (!tasksByDay[task.day_of_week]) {
            tasksByDay[task.day_of_week] = []
          }
          tasksByDay[task.day_of_week].push(task)
        })
        setTasks(tasksByDay)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim() || !selectedDay) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('weekly_tasks')
        .insert({
          user_id: user.id,
          day_of_week: selectedDay,
          task_title: newTask.trim(),
          completed: false,
          subtasks: []
        })
        .select()
        .single()

      if (error) throw error

      setTasks({
        ...tasks,
        [selectedDay]: [...(tasks[selectedDay] || []), data]
      })
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const addSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtask.trim() || !selectedTask) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentSubtasks = selectedTask.subtasks || []
      const updatedSubtasks = [
        ...currentSubtasks,
        { id: Date.now(), text: newSubtask.trim(), completed: false }
      ]

      const { error } = await supabase
        .from('weekly_tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', selectedTask.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const updatedTasks = { ...tasks }
      updatedTasks[selectedDay] = updatedTasks[selectedDay].map(t =>
        t.id === selectedTask.id ? { ...t, subtasks: updatedSubtasks } : t
      )
      setTasks(updatedTasks)
      setSelectedTask({ ...selectedTask, subtasks: updatedSubtasks })
      setNewSubtask('')
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('weekly_tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const updatedTasks = { ...tasks }
      updatedTasks[selectedDay] = updatedTasks[selectedDay].map(t =>
        t.id === taskId ? { ...t, completed: !currentStatus } : t
      )
      setTasks(updatedTasks)
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const toggleSubtask = async (taskId, subtaskId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const task = tasks[selectedDay].find(t => t.id === taskId)
      const updatedSubtasks = task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )

      const { error } = await supabase
        .from('weekly_tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const updatedTasks = { ...tasks }
      updatedTasks[selectedDay] = updatedTasks[selectedDay].map(t =>
        t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t
      )
      setTasks(updatedTasks)
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...task, subtasks: updatedSubtasks })
      }
    } catch (error) {
      console.error('Error toggling subtask:', error)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('weekly_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      const updatedTasks = { ...tasks }
      updatedTasks[selectedDay] = updatedTasks[selectedDay].filter(t => t.id !== taskId)
      setTasks(updatedTasks)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-teal-800 via-emerald-900 to-green-950 rounded-3xl p-8 shadow-2xl border-8 border-double border-teal-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.15),transparent)]"></div>
      <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent rounded-full opacity-40"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={calendarIcon} alt="Calendar" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          <h2 className="text-2xl font-bold text-amber-50">Weekly Planner</h2>
        </div>

        {/* Days of Week Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {daysOfWeek.map(day => {
            const dayTasks = tasks[day.id] || []
            const completedCount = dayTasks.filter(t => t.completed).length
            const totalCount = dayTasks.length

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-1 min-w-[100px] p-4 rounded-2xl border-4 border-double transition-all shadow-lg relative overflow-hidden ${
                  selectedDay === day.id
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-950 text-amber-50'
                    : 'bg-gradient-to-b from-stone-800 to-stone-900 border-stone-950 text-stone-400 hover:from-stone-700 hover:to-stone-800'
                }`}
              >
                {selectedDay === day.id && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                )}
                <div className="relative">
                  <div className="text-sm font-bold mb-1">{day.label.slice(0, 3)}</div>
                  {totalCount > 0 && (
                    <div className="text-xs opacity-80">
                      {completedCount}/{totalCount}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Day Content */}
        {selectedDay && (
          <div className="space-y-4">
            {/* Add Task Form */}
            <form onSubmit={addTask} className="flex gap-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={`Add task for ${daysOfWeek.find(d => d.id === selectedDay)?.label}...`}
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

            {/* Tasks List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(!tasks[selectedDay] || tasks[selectedDay].length === 0) ? (
                <p className="text-teal-200 text-center py-8 font-semibold">
                  No tasks for {daysOfWeek.find(d => d.id === selectedDay)?.label} yet!
                </p>
              ) : (
                tasks[selectedDay].map(task => (
                  <div key={task.id} className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-2xl p-4 border-3 border-teal-800 shadow-md">
                    {/* Main Task */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-6 h-6 rounded accent-green-500 cursor-pointer"
                      />
                      <span 
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                        className={`flex-1 text-amber-100 font-bold cursor-pointer ${task.completed ? 'line-through opacity-60' : ''}`}
                      >
                        {task.task_title}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-red-900 hover:bg-red-800 text-amber-100 font-bold px-3 py-1 rounded-full border-2 border-red-950 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Subtasks */}
                    {selectedTask?.id === task.id && (
                      <div className="mt-3 ml-8 space-y-2">
                        {/* Add Subtask Form */}
                        <form onSubmit={addSubtask} className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Add subtask..."
                            className="flex-1 p-2 text-sm rounded-xl bg-stone-900 border-2 border-teal-700 text-amber-100 placeholder-stone-600 focus:outline-none focus:border-teal-600 shadow-inner"
                          />
                          <button
                            type="submit"
                            className="bg-green-700 hover:bg-green-600 text-amber-50 font-bold px-4 py-2 text-sm rounded-full border-2 border-green-950 transition-colors"
                          >
                            +
                          </button>
                        </form>

                        {/* Subtask List */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-1">
                            {task.subtasks.map(subtask => (
                              <div key={subtask.id} className="flex items-center gap-2 bg-stone-900/50 rounded-xl p-2">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => toggleSubtask(task.id, subtask.id)}
                                  className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                                />
                                <span className={`flex-1 text-teal-200 text-sm ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                                  {subtask.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyPlanner

