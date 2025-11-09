#### Activation Methods:
1. **Manual Toggle**: Go to Settings → Account → Enable Developer Mode
2. **Auto-Enabled**: Accounts ending in `@dev.com` or `@studymon.dev`
3. **Console**: `window.devTools.enable()`

#### Developer Panel Features:

**Add Creatures**
- Select any creature from database
- Choose level (1-100)
- Instantly adds to team

**Quick Actions**
- **Heal All**: Restore all creatures to full HP/SP
- **Unlock All Badges**: Complete all gym series

**Add Study Points**
- Add any amount of SP
- Configurable amount

**Danger Zone**
- Clear all creatures from team (with confirmation)

#### Console Commands (Available in Dev Mode):

```javascript
// List all creatures
window.devTools.actions.listCreatures(supabase)

// Add creature (id, level)
window.devTools.actions.addCreature(supabase, 85, 50)

// Level up creature (userCreatureId, levels)
window.devTools.actions.levelUpCreature(supabase, 123, 10)

// Max out a creature to level 100
window.devTools.actions.maxCreature(supabase, 123)

// Heal all creatures
window.devTools.actions.healAll(supabase)

// Add study points
window.devTools.actions.addSP(supabase, 500)

// Unlock all badges
window.devTools.actions.unlockAllBadges(supabase)

// Clear team (dangerous!)
window.devTools.actions.clearTeam(supabase)

// Enable/disable dev mode
window.devTools.enable()
window.devTools.disable()
window.devTools.isEnabled()
```
