import { useState } from 'react'

function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to StudyMon!",
      content: "Study smarter by catching and training StudyMons through answering questions!",
      icon: "🎮"
    },
    {
      title: "Step 1: Set Up Your Party",
      content: "Go to the Party tab and add your StudyMons to your active party (up to 4). Your starter is already in your collection!",
      icon: "🎒"
    },
    {
      title: "Step 2: Choose Your Study Topic",
      content: "In the Home tab, set your active study topic. Questions in battles and healing will be based on this topic!",
      icon: "📚"
    },
    {
      title: "Step 3: Battle & Learn",
      content: "Enter battles to train your StudyMons! Answer questions to gain SP (Skill Points), then use skills to attack!",
      icon: "⚔️"
    },
    {
      title: "Gain SP by Answering",
      content: "Click 'Gain SP' and choose a difficulty. Correct answers give you 5 (Easy), 10 (Medium), or 15 (Hard) SP!",
      icon: "📝"
    },
    {
      title: "Use Skills to Attack",
      content: "Spend SP to use your StudyMon's skills! Stronger skills cost more SP but deal more damage.",
      icon: "💥"
    },
    {
      title: "Catch New StudyMons",
      content: "When a wild StudyMon's HP drops below 30%, you can attempt to catch it by answering a question!",
      icon: "⚡"
    },
    {
      title: "Heal Your Team",
      content: "Visit the Healing Center in the Home tab to restore your StudyMons' HP by answering questions!",
      icon: "❤️"
    },
    {
      title: "Ready to Study!",
      content: "Use the Study Timer, manage weekly tasks, and track your progress. Good luck, Trainer!",
      icon: "🌟"
    }
  ]

  if (!isOpen) return null

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-8 border-double border-yellow-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        <div className="absolute top-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-yellow-700 to-transparent rounded-full"></div>
        
        <div className="relative">
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-8 bg-yellow-400' 
                    : index < currentStep 
                    ? 'w-2 bg-yellow-600' 
                    : 'w-2 bg-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">{step.icon}</div>
            <h2 className="text-3xl font-bold text-amber-50 mb-4 drop-shadow-lg">
              {step.title}
            </h2>
            <p className="text-amber-100 text-lg leading-relaxed font-semibold">
              {step.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirst}
              className="bg-gradient-to-b from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 disabled:from-stone-800 disabled:to-stone-900 text-amber-200 disabled:text-stone-600 font-bold py-3 px-8 rounded-2xl border-4 border-double border-stone-950 transition-all shadow-lg"
            >
              ← Back
            </button>
            
            {isLast ? (
              <button
                onClick={onClose}
                className="bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-amber-50 font-bold py-3 px-8 rounded-2xl border-4 border-double border-green-950 transition-all shadow-xl"
              >
                Start Playing! →
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-amber-50 font-bold py-3 px-8 rounded-2xl border-4 border-double border-blue-950 transition-all shadow-lg"
              >
                Next →
              </button>
            )}
          </div>

          {/* Skip */}
          <button
            onClick={onClose}
            className="mt-4 w-full text-amber-300 hover:text-amber-100 font-semibold text-sm transition-colors"
          >
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  )
}

export default TutorialModal

