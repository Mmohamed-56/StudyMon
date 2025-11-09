function XPBar({ currentXP, level, className = "" }) {
  const xpNeeded = level * 50
  const xpProgress = Math.min((currentXP / xpNeeded) * 100, 100)

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs font-bold">
        <span className="text-cyan-300">XP</span>
        <span className="text-cyan-200">{currentXP} / {xpNeeded}</span>
      </div>
      <div className="relative h-2 bg-stone-900 rounded-full border-2 border-stone-700 overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${xpProgress}%` }}
        />
      </div>
    </div>
  )
}

export default XPBar

