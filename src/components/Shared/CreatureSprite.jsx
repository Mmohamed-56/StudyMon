// Import all StudyMon sprites
import aquatot from '../../assets/studymons/aquatot.png'
import boulder from '../../assets/studymons/boulder.png'
import dragling from '../../assets/studymons/dragling.png'
import flameling from '../../assets/studymons/flameling.png'
import frostbite from '../../assets/studymons/frostbite.png'
import ironclad from '../../assets/studymons/ironclad.png'
import leaflet from '../../assets/studymons/leaflet.png'
import phantom from '../../assets/studymons/phantom.png'
import psycat from '../../assets/studymons/psycat.png'
import shadowpup from '../../assets/studymons/shadowpup.png'
import sparkwing from '../../assets/studymons/sparkwing.png'
import zapling from '../../assets/studymons/zapling.png'

// Map creature names to their sprites
const spriteMap = {
  aquatot,
  boulder,
  dragling,
  flameling,
  frostbite,
  ironclad,
  leaflet,
  phantom,
  psycat,
  shadowpup,
  sparkwing,
  zapling
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

