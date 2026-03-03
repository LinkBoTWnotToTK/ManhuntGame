
# Shop, Powerups, Coins & Save Code System

## Overview
Add an in-game economy with collectible coins scattered across the map, a shop accessible from the main menu to buy powerups, and a save code system (base64-encoded string) so players can preserve their progress without a backend.

---

## 1. Coin System

**New file: `src/components/game/Coins.tsx`**
- Render gold coin meshes scattered across the map (15-20 per game)
- Coins float and spin like existing medkits/ammo pickups
- Player collects by walking near (distance < 1.5)
- Coins spawn at game start at random positions within map bounds

**GameState changes:**
- Add `coins: number` (persistent wallet, saved across games)
- Add `matchCoins: number` (earned this match)
- Add `coinPickups: CoinData[]` for in-world positions
- Spawn ~18 coins at game start spread across the map
- Award bonus coins on win (5 for win, 2 for loss)

---

## 2. Powerup Definitions

**New file: `src/components/game/ShopData.ts`**

8 powerups, each with a cost, name, description, and gameplay effect:

| Powerup | Cost | Effect |
|---------|------|--------|
| Iron Boots | 10 | +20% move speed |
| Extra Heart | 15 | Start with 4 max hearts instead of 3 |
| Quick Reload | 12 | Ammo spawns 40% faster (runners) |
| Ghost Step | 20 | Sprinting drains 50% less stamina |
| Thick Skin | 18 | Take 50% less projectile damage (round up) |
| Eagle Eye | 8 | Wider FOV (65 instead of 55) |
| Lucky Start | 10 | Start with +2 extra ammo (runners) |
| Second Wind | 25 | Auto-heal 1 heart when reaching 0 (once per game) |

Powerups are persistent (saved with save code) and active every game once purchased.

---

## 3. Shop UI

**New file: `src/components/game/Shop.tsx`**

- Accessible from the main menu as a new step/tab (button on role selection screen: "Shop")
- Grid layout showing all 8 powerups as cards
- Each card shows: icon, name, cost, description, owned/buy button
- Coin balance displayed at the top
- "Back" button returns to role selection
- Owned powerups shown with a checkmark, cannot re-buy

**GameUI changes:**
- Add a "Shop" button on the role selection screen
- Add a `menuStep: "role" | "shop" | "map" | "ready"` option
- Display coin count in the HUD during gameplay (bottom-right)

---

## 4. Powerup Integration into Gameplay

**GameState changes:**
- Add `ownedPowerups: string[]` to track purchased powerups
- Add `buyPowerup(id: string): boolean` function
- Modify `startGame` to apply powerup effects:
  - `iron_boots`: increase WALK_SPEED/SPRINT_SPEED
  - `extra_heart`: set MAX_HEALTH to 4
  - `quick_reload`: reduce ammo spawn interval
  - `ghost_step`: reduce STAMINA_DRAIN
  - `thick_skin`: reduce damage in `damagePlayer`
  - `eagle_eye`: handled by Index.tsx reading owned powerups for FOV
  - `lucky_start`: add extra starting ammo
  - `second_wind`: auto-revive flag, checked in `damagePlayer`

**Player.tsx changes:**
- Read speed multiplier and stamina drain from game state
- Apply iron_boots and ghost_step modifiers

**Index.tsx changes:**
- Read eagle_eye powerup to set FOV to 65 if owned

---

## 5. Save Code System

**New file: `src/components/game/SaveSystem.ts`**

Save data structure:
```text
{ coins: number, powerups: string[] }
```

- Encode: `btoa(JSON.stringify(data))` producing a short alphanumeric code
- Decode: `JSON.parse(atob(code))` with validation
- Add simple checksum (sum of char codes mod 1000) appended to prevent casual tampering

**GameUI / Shop changes:**
- "Save Code" button in the shop that displays the code in a copyable text field
- "Load Code" input field on the role selection screen
- On load, validate and restore coins + owned powerups
- Auto-save to localStorage as well (save code is for cross-device/sharing)

---

## 6. In-Game Coin HUD

- Show coin count (wallet + match earnings) in bottom-right during gameplay
- Show "+1" floating text animation when collecting a coin
- Show end-of-match coin summary on game over screen (coins earned, bonus, total)

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/game/ShopData.ts` | New - powerup definitions |
| `src/components/game/Shop.tsx` | New - shop UI component |
| `src/components/game/Coins.tsx` | New - coin pickup 3D objects |
| `src/components/game/SaveSystem.ts` | New - save/load code logic |
| `src/components/game/GameState.tsx` | Add coins, powerups, buy logic, apply effects |
| `src/components/game/GameUI.tsx` | Add shop button, coin HUD, save/load UI, end-screen summary |
| `src/components/game/Player.tsx` | Apply speed/stamina powerup modifiers |
| `src/components/game/Medkits.tsx` | Add coin rendering alongside medkits |
| `src/pages/Index.tsx` | Add Coins component, dynamic FOV for eagle_eye |
