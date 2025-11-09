// Import all StudyMon sprites
import flameling from '../../assets/studymons/flameling.png'
import leaflet from '../../assets/studymons/leaflet.png'
import zapling from '../../assets/studymons/zapling.png'
import frostbite from '../../assets/studymons/frostbite.png'
import boulder from '../../assets/studymons/boulder.png'
import psycat from '../../assets/studymons/psycat.png'
import phantom from '../../assets/studymons/phantom.png'

// Map creature names to their sprites
const spriteMap = {
  flameling,
  leaflet,
  zapling,
  frostbite,
  boulder,
  psycat,
  phantom
}

function CreatureSprite({ creatureName, emoji, className = "text-6xl", size = null }) {
  const normalizedName = creatureName?.toLowerCase().trim()
  const sprite = spriteMap[normalizedName]

  if (sprite) {
    // Use PNG sprite if available
    return (
      <img 
        src={sprite} 
        alt={creatureName}
        className={size || "w-20 h-20"}
        style={{ imageRendering: 'pixelated' }}
      />
    )
  }

  // Fall back to emoji
  return <span className={className}>{emoji}</span>
}

export default CreatureSprite

