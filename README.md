# Rotate Rings Level Builder

A level builder for Rotate Rings, built on the rules in the [Rotate Rings GDD](https://hvtanh07.github.io/gdd-rotate-rings/) and on the game's own level file. The 60 levels of the game's `levels.json` (level_001 – level_060) are built in.

**Tool:** https://hvtanh07.github.io/rotate-rings-level-builder/
**Level sheet:** [Rotate Rings › Level Config](https://docs.google.com/spreadsheets/d/1nyJ1k3zGlLKoiFaT5fMqq8r27lMgC8l7iSyxq2gokow/edit) (columns `Id`, `Level`: one level JSON per cell)

## Run it

You need Node.js 20 or newer.

```sh
npm install
npm run dev      # opens the builder at http://localhost:5173
npm test         # format round trip, geometry and game rules
npm run build    # writes dist/index.html, one file that opens without a server
```

Every push to `main` runs the tests, builds, and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

## Features

- **Levels:** list, filter, new, duplicate, reorder, delete. Edits are saved in the browser. **Reset to game data** brings back the built-in levels.
- **Design:** add open rings, closed rings, connectors (arm from one ring, hook on another), Pins, Bombs, Gear Rings and Locked Rings. Drag to move; pieces resting on a moved ring follow it. Drag the dots to turn a gap, resize a ring, or move a connector or bar end (ends snap onto rings). Snap grid, zoom, pan, undo and redo.
- **Inspector:** Level (id, tier, difficulty, seed, tutorial ring), Piece (every field of the file), Pieces (all pieces in file order), Check (format problems and a bot that solves the level), JSON (live text, apply, copy, download), Help.
- **Play test:** drag a ring to turn it. Gaps free hooks, pins and bar ends; free pieces shatter; keys open Locked Rings; gears turn each other. Undo move, restart, Hint / Saw / Remove boosters, a bot that plays one move or the whole level.
- **Import / export:** the game file, a JSON list, one level, several level objects pasted one after another, or Id/Level rows copied from the sheet. Export writes `levels.json` in the game's layout, and **Copy as sheet rows** pastes into the Level Config tab.

## Updating levels in both places

1. Design or edit the level in the tool.
2. Export → **Download levels.json** and replace `src/data/levels.json` in this repo (this is the tool's built-in data, and the file the game reads).
3. Export → **Copy as sheet rows** (or **Copy sheet row of this level**), click the `Id` cell of the first row in the Level Config tab, and paste.

## Level format

The tool reads and writes the same keys, in the same order, as the game's `levels.json` (Unity JsonUtility, 4-space layout). Floats are written with a decimal point (`1.0`), like the game. The test suite checks that all 60 levels go in and come out the same.

| Key | Meaning in the tool |
| --- | --- |
| `shape.type` | `1` open ring (C shape), `0` closed ring, `6` connector, `9` pin, `10` Straight Bar, `11` Bomb (new, not in the game file yet). Other types are kept as they are and drawn as a dashed circle. |
| `shape.id` | `R…` rings, `K…` connectors, `L…` bars, `H…` pins, like the game file. |
| `position`, `eulerAngles.z` | Center and angle on the board (y up, degrees counter-clockwise). |
| `shape.radius`, `shape.tubeRadius` | Ring size and tube thickness. |
| `shape.gaps` | Gaps of an open ring: `centerDegrees` (0 = right, counter-clockwise) and `widthDegrees`. |
| `shape.legLength`, `shape.hook` | Connector: an arm of `legLength`, centered on `position`, pointing along `eulerAngles.z`, from its ring's edge to a hook on another ring. Pin: length of the pin. |
| `shape.points` | Straight Bar points, local to the bar and turned by `eulerAngles.z`. The first and last points rest on rings. |
| `shape.gearTeeth`, `shape.gearPhase`, `gearWith` | Gear Ring: teeth, where the first tooth sits, and the indexes of the gears it meshes with. |
| `locked`, `keyHolder`, `lockAngle`, `keyAngle` | Locked Ring: index of the piece holding its key, where the padlock sits on this ring and the key on the key holder. |
| `snapStep` | A turn snaps to this step (15° on every ring in the sample levels). |
| `colorIndex` | 0 Red, 1 Blue, 2 Green, 3 Yellow, 4 Pink, 5 Orange, 6 Purple, 7 Cyan (the GDD's 8 colors). A connector has the color of its ring. |
| `tutorialRing` | Ring with the hand pointer, `-1` for none. |
| `tier`, `difficulty`, `seed`, `mode`, `liftDirection`, `version` | Kept and editable; the tool does not use them. |
| `startAngle`, `limitAngle`, `minAngle`, `maxAngle`, `slide`, `slideAxis`, `pivot`, `rotationAxis`, `flatRatio`, `arcDegrees`, `flexDepth` | Kept and editable. The play test uses `limitAngle`/`minAngle`/`maxAngle`; the rest are the same in every sample level. |

Links are not stored in the file. The tool works them out from the geometry, which matches all 60 sample levels: every connector starts on exactly one ring (its owner, same color) and hooks exactly one other ring; every bar end and pin sits on one ring's circle.

## Rules used by the play test

From the GDD, sections 1.2, 1.4 and 1.5:

- Drag a ring to turn it around its center; it snaps to `snapStep` when you let go. Arms turn with their ring.
- When a ring's gap passes a hook, pin or bar end resting on it, that link comes apart.
- A piece with no links left shatters (300 points per ring). Connectors go with their ring. A pin or bar that locks nothing shatters.
- Pin: locks the ring or bar it stands on, and shatters when it locks nothing. A bar held only by a pin cannot be freed by a gap.
- Bomb (type 11, `shape.radius` = size): sits on a ring (turns with it) or on a bar. When a turn brings it onto another ring or bar, the bomb blows up and both pieces shatter. Pieces it touches at the start do not set it off. The bot uses a bomb when no turn frees anything else.
- Locked Ring: does not turn until the piece holding its key shatters; then the key opens it.
- Gear Rings: meshed gears turn the other way, by the tooth ratio (same teeth: same angle).
- A ring whose arm still hooks another ring is held and cannot turn (a tap only shakes it). Free the hooked ring first. (Confirmed by the designer, 2026-11-25.)
- Boosters: Hint lights rings that can turn and free something; Saw cuts one connector or bar; Remove takes one ring, bar or pin off.

## Code

- `index.html`: page markup.
- `src/main.js`: the builder UI.
- `src/format.js`: the level format, reading, writing, geometry and checks.
- `src/engine.js`: game rules, boosters and the bot.
- `src/render.js`: draws a level as SVG.
- `src/data/levels.json`: the built-in levels (the game file).
- `tests/`: Vitest tests.
