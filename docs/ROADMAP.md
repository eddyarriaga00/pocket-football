# PocketFootball (called Pocket Gridiron until 2026-11-16)

# Pocket Gridiron roadmap

Working plan for the overnight build session that started 2026-11-12 around 02:45 EST. The owner asked for
continuous work while asleep: much better player models, really good sound, animation, optimization, cleaner
formatting, and a full, interactive game experience. This file is the source of truth for what is done and
what is next. Update it after every item.

## Ground rules

- **Branch:** commit on `main` and push `main`. The owner wrote "always push to main" on 2026-11-12 at about
  07:10 (until then the work sat on `ui-refresh`, which is now merged and no longer used). Every push redeploys
  the live GitHub Pages site, so run the regression in "How to test" before pushing.
  On 2026-11-16 the owner, working from a phone, wrote "always merge to main, allow easy rollback". So before
  every push to `main`, add a line to "Rollback points" below with the commit `main` is on and what the push brings.
  (Tags were the first idea, but the cloud sessions may not push tags.) To go back to a point, keeping the history:
  `git revert --no-edit <commit>..main` then push `main`; the site redeploys in a minute or two. Or tell the
  session "roll back to before <what>".
- **Rollback points** (newest first; the commit is the last good `main` before that change):
  - `0289e0c`, before the kicking motions (2026-11-27)
  - `5ea42fa`, before the four line-play stances (2026-11-27)
  - `cf5ec21`, before the hands-to-the-ball catch (2026-11-27)
  - `eeccdbe`, before the pop fixes and the pop detector (2026-11-27)
  - `6a722b0`, before the hand-off, the carried-across ball and the quality step-down change (2026-11-27)
  - `2f097d2`, before the rebuilt throw (2026-11-27)
  - `b077b95`, before the controller's first-press fix and the input tests (2026-11-22).
  - `e65774b`, before the returner and deep-safety hop fixes (2026-11-21).
  - `58b4546`, before the fix to the kick's aiming line (2026-11-21).
  - `601eab4`, before the generated pictures and icon were taken out (2026-11-21).
  - `9a00504`, before the walk between plays was always fast forward (2026-11-21).
  - `950edae`, before rosters that change between seasons and a picture on every sheet (2026-11-21).
  - `5b97c8b`, before the pictures on the play-call, halftime and final sheets (2026-11-21).
  - `218e878`, before the pictures in the main menu's five boxes (2026-11-21).
  - `05dc9ac`, before the new icon and the title picture on the main menu (2026-11-21).
  - `b029fa0`, before the rule book, What's new, blocked punts, called-back return touchdowns and the onside kick at any time (2026-11-21).
  - `ec200f7`, before players walking between plays (no emptied field, no line-ups dropped in place) and blocked kicks, return fouls, offsetting fouls (2026-11-21).
  - `3d5f88d`, before the closer-to-the-pro-game pass (current kickoff line-up, free kick after a safety, 40/25 play clock, booth review, full stat sheet, standings columns) (2026-11-21).
  - `ab8d814`, before the rounding-out pass (real kickers and punters, roster substitutes for injuries, Settings › Saves, About and Rosters) (2026-11-21).
  - `91e87af`, before gang tackles (joining defenders hit high and beside, a beat apart; the runner feels each) (2026-11-21).
  - `c4547e5`, before the rag doll on the falls (hit size and direction, limp limbs, landing bounce) (2026-11-21).
  - `b7a0514`, before the quicker stride (CADENCE 1.22: shorter steps, faster legs and arms) (2026-11-21).
  - `2beab3b`, before everyone got 7% quicker (QUICK in data.js; the ball and pass protection moved with it) (2026-11-21).
  - `d2df5b0`, before the reworked walk and run (two gaits, hip roll, heel strike, new arms and lean) (2026-11-21).
  - `9cca8a7`, before the 53-man rosters with full names (2026-11-17).
  - `53cc466`, before the motion-capture catch and two-hand secure (2026-11-17).
  - `14525cf`, before the motion-capture throw and the tuned juke and running arms (2026-11-17).
  - `56c0c15`, before the new juke, spin and broken-tackle animations (2026-11-17).
  - `5813a2d`, before more field detail (end zone bands, worn lanes, post pads, sideline yardage markers) (2026-11-17).
  - `81c16db`, before three-minute quarters by default (2026-11-17).
  - `ff5d7d8`, before the NFL calendar (17 games, byes, seven-team playoffs) (2026-11-17).
  - `3d54435`, before more awards, trophies and milestones, and the comment-free one-file build (2026-11-17).
  - `e14de31`, before landscape and computer layouts and the controller and keyboard upgrades (2026-11-17).
  - `4c07eca`, before more commentary takes, new conversion and long-touchdown calls, and social posts about your events, milestones and deals (2026-11-16 late).
  - `8ce466d`, before the career hub reorganization, league news, contract extensions and incentives, weekly events (2026-11-16 night).
  - `d29ee21`, before white became the default accent (2026-11-16 night).
  - `60ed5d7`, before Stylized became the default look (2026-11-16 night).
  - `bcca249`, before the Stylized look option (2026-11-16 night).
  - `8e282ac`, before grounded player lighting, sideline turf and team areas, and the leather ball (2026-11-16 night).
  - `c6a445d`, before the move to the pocket-football address and the PocketFB home-screen name (2026-11-16 night).
  - `a523399`, before the rename to PocketFootball (2026-11-16 night).
  - `9f56170`, before the new crowd and stands, the uniform finishes and turf wear (2026-11-16 night).
  - `d41c07d`, before the service worker always asking for fresh game files (2026-11-16 night).
  - `8ec7bd0`, before the one-time re-count of last season's MVP vote (2026-11-16 night).
  - `f74c71a`, before the MVP vote, the Championship Game MVP and the championship experience (2026-11-16 night).
  - `83eb868`, before the single ring again, the reshaped power bar and fewer off-target misses on your throws (2026-11-16 night).
  - `d6ec7b5`, before receivers winning at the break, shifting zones and the two ring strengths (2026-11-16 night).
  - `0e2e039`, before the throwing rebalance from the human-player tests (2026-11-16 night).
  - `7d4de40`, before the harder kickoff power (2026-11-16 night).
  - `8c2c671`, before the perfect throw and its band on the power bar (2026-11-16 night).
  - `fcc0158`, before the catch model, the open ring and incompletion reasons (2026-11-16 night).
  - `c3a5b21`, before the new commentary lines and social posts (2026-11-16 late).
  - `dbf6e55`, before the difficulty slider and receivers timing their run to the ball (2026-11-16 evening).
  - `c432a89`, before safe save reading and the playoff overtime and two-minute warning fixes (2026-11-16 afternoon).
  - `e68b326`, before the chat was connected to the owner's Firebase project (2026-11-16).
  - `477b88b`, before the Online screen and global chat (2026-11-16).
  - `4ec74d0`, before the dash-timer and booth-key guards (2026-11-16 morning).
  - `000449a`, before NFL overtime length and timeouts (2026-11-16 night).
  - `4be9e17`, before 180 surnames and no two men in a game sharing one (2026-11-16 night).
  - `a2e755a`, before the modern two-point chart (2026-11-16 night).
  - `6d70c24`, before the kicking game by the numbers (punt outcomes, the coffin corner, field goal rates) (2026-11-16 night).
  - `a51cc01`, before the computer's modern fourth-down calls (2026-11-16 night).
  - `64ee905`, before the kickoff landing zone (a short kick gives the ball at the 40) (2026-11-16 night).
  - `09e544d`, before the NFL clock rule for a runner out of bounds (2026-11-16 night).
  - `28bee05`, before the All-Star Game for invited career players (2026-11-16 night).
  - `aa77596`, before the roof over the roofed stadiums (2026-11-16 night).
  - `1e549e8`, before the injury scene (trainers out, helped off, the cart for the worst) (2026-11-16 night).
  - `634d2d2`, before the tackle drive (tackler and runner carried on through the hit together) (2026-11-16 night).
  - `5ddc9bc`, before the record book (league single-game and season marks, a card when one falls) (2026-11-16 night).
  - `5e105a8`, before surer open-field tackles after a catch and pursuit angles on the throw (2026-11-16 night).
  - `17446bf`, before the downfield reads, defenders rallying on the throw and the juke rework (2026-11-16 night).
  - `14895e9`, before both feet in: catches out of bounds incomplete, toe taps at the line (2026-11-16 night).
  - `808b4a6`, before player heroes and the podium scene replaced the stretched cards on short screens (2026-11-16, from the Mac).
  - `3eb0ab4`, before short screens filled tall phones (menu, camp, milestones, hall, press, combine, dash, awards) (2026-11-16, from the Mac).
  - `7f53b89`, before the interface pass: grade chip on one line, tile marks, ability locks, hall pictures, standings labels (2026-11-16, from the Mac).
  - `199ae80`, before a career receiver's route was painted bright on the field as he runs it (2026-11-16, from the Mac).
  - `3b38a41`, before the social feed's pictures: faces, score and stat cards, polls, likes, photos (2026-11-16, from the Mac).
  - `f3f4ee8`, before the live play grade, teammate chemistry and the wider social feed (2026-11-16, from the Mac).
  - `381dfb4`, before uniforms picked up grass stains through the game (2026-11-16, from the Mac).
  - `68745cb`, before the jersey was tucked into the pants (2026-11-16, from the Mac).
  - `a782106`, before the 2026-11-16 player and stadium detail pass (chin strap, collar, tape; gooseneck posts,
    padded wall, sideline gear, field marks, the ball's shape).
- **Technology:** the owner also wrote "use more complex languages and change code and anything if needed".
  Shaders (GLSL), modules and rewrites are welcome where they buy visible quality. The site is still static
  hosting, so everything must end up as files a browser loads directly.
- **After each item:** test, commit, `git push origin main`, then tick the item below and add a line to the log.
  Since 2026-11-21 the game ships from GitHub only (the owner: "i don't want the [single-file] copy anymore just the
  github push to main"): no single-file build, no artifact publish, and its 16 MiB limit no longer applies.
- **No questions during automatic runs.** Decide, note the decision in the log, keep going.
- **What the automatic loop is for** (the owner, 14:10 on 2026-11-12: "yes automatic improvement loop yes but make
  major improvements or if not just work on improving ui more and more"): each run takes the biggest improvement it
  can finish and verify from "Next ideas" at the bottom of this file; when none fits, it refines the interface and
  runs the interface audit. Sound should keep moving toward "sounds like football" (the owner's words).
- **Taste (stated by the owner):** no yellow or gold anywhere; no condensed italic display type (Archivo,
  upright, is the display face); small controls (54px actions, 70px snap, 50px receiver buttons).
- **Original game.** No real league, team, player or video game names, logos or likenesses.
- **Assets:** procedural only, with one exception the owner chose on 2026-11-12 at about 17:58 ("of course option
  1", the free speech model on his Mac): the two commentators' lines are recorded by `tools/voice.py` with Kokoro-82M
  (open weights, Apache 2.0) and committed as `audio/vo.pack`. The model, its Python environment and the single clips
  live in `.voice/`, which git ignores. Nothing else is to be downloaded (audio, models, textures, fonts, tools, or a
  different speech model) without his say-so, and no credits are to be spent on the voice service connected to the
  session. Libraries only from cdnjs, pinned to an exact version (three.js 0.159.0 is confirmed available at
  `https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.min.js`).
- **The booth is original.** Every line is written for this game. Never a real commentator's voice, name or
  catchphrase, and no league or team marks.
- **Always shippable.** Keep the 2D renderer working as a fallback. New systems go in behind a setting until
  they are verified, then become the default.

## How to test

1. Preview server: the local preview config has an entry named `game` that runs `python3 tools/serve.py 48231`
   (a no-cache server: plain `http.server` let the browser serve stale scripts after edits). The file is
   gitignored; recreate it if missing. Start it with the preview tool, open
   `http://localhost:48231/index.html`, set the mobile viewport (375x812).
2. Load the harness in the page (the query string defeats the cache):
   `await fetch('tools/harness.js?'+Date.now()).then(r=>r.text()).then(t=>(0,eval)(t))`
3. Run:
   - `H.sim(12,180)` computer vs computer. Healthy ranges: 4 to 5 yards per carry, completions 53-62%,
     interceptions 1-3%, about 35-44 points per game combined (measured 2026-11-14 evening, after the run share
     went up to about 38%; batches of five games swing by ten points, so use thirty or more), `errs` empty.
   - `node tools/playcheck.js` must say the playbook is legal after any change to formations or plays.
   - `H.exh(2,120)` scripted user in exhibition (exercises play calling, kicks, kickoffs). `errs` empty.
   - The rougher test player, `tools/chaos.js` (load it after the harness, the same way): `X.exh(6,120)`,
     `X.exh(6,120,'snow')`, `X.career('WR',6)`, `X.season(1,'potie')`. It goes for it on fourth down, tries for two,
     kicks onside, challenges, picks random plays and ties games late; `X.bad` must stay empty. Run each in its own
     call and reload between long runs (a season takes about ten seconds, three seasons of `H.careerSeasons` more
     than forty-five).
   - `H.fingerprint()` must equal `localStorage['pg.fingerprint']`. It was pinned again on 2026-11-14 when a sack's
     yards moved from team rushing to net passing (the earlier one is kept as `pg.fingerprint.before-sacks`, and again that evening when overtime, the touchback spot and the computer's run rate changed (`pg.fingerprint.before-rules`)); a
     change to the stat sheet that moves the totals needs the same treatment, after checking that score, steps and
     trace are unchanged.
   - Stepped tests leave things behind that a player never sees (a toast or card caught mid-fade, confetti, hit
     rings): audit on a freshly loaded page, and put the test browser's settings back (sound, weather, graphics,
     button side) and clear `pg.career*` and `pg.season*` when done.
   - `H.career('QB',2)` and `H.career('WR',2)` (a new career is a quarterback or a receiver). `errs` empty, stats non-zero.
   - `H.fingerprint()` must equal `localStorage['pg.fingerprint']` after any change that should not alter play. It pins
     the weather and the penalty switch itself, so what is saved in Settings cannot disturb it.
   - `H.camp('pass',4)`, and 'run', 'tackle': a training-camp drill played by a simple test player. `errs` empty.
   - After a change to the playbook: `PG.dbg.lab(name, 40)` per play, with `PG.dbg.seed(s)` before each so every play
     meets the same rosters (rosters are rolled per game, and a weak arm decides a batch). Compare each new play with the
     old ones of its kind (runs about 4-5 yards a snap, short passes about 8, deep about 10), then `H.sim(12,180)` on a
     few seeds against the numbers above.
   - `await H.fps(3)` with the pane visible, during a live play. Target 55+ in the pane.
4. Screenshot the menu, a pre-snap view, a live play, the career hub. Synchronous stepping does not repaint,
   so wait a second before a screenshot.
5. Console: no errors.
6. Interface audit, after any change to the stylesheet or to a screen. Load `tools/audit.js` the same way as the
   harness, then at 320x568 and 390x844 at least (the first is the tightest phone):
   `await A.menus(); A.play('exh'); A.play('season'); A.play('career'); A.play('camp'); A.report()`.
   The report must be empty. It lists touch areas under 44 pixels, overlapping or covered controls, clipped or cut
   text, type under 10 pixels, contrast under 4.5 to 1 (measured against the picture really behind the text, read back
   from the canvases) and blocks of the in-game display that overlap. `A.menus()` replaces the test season and career.
7. Motion, after any change to the poses: `PG.r3d.gait(8)` (and 2, 5, `{ how: 'back' }`, `{ how: 'side' }` at 3,
   `{ how: 'diag' }`, `{ who: 'ref' }` and `{ who: 'crew' }`) should report a slide of about 2 cm or less and a sink
   of under half a centimetre; `PG.r3d.tackle(0)` (and 1.57, 3.14) should report hands within 10 cm of the runner,
   nothing inside him and nothing under the turf, and `PG.r3d.tackleStrip(0)` draws that tackle as a row of frames;
   `PG.r3d.catchTest('leap')` (and `'stretch'`) measures a staged catch at the moment of the ball (the leap: hips up
   about half a hip height, feet off the turf, arms near straight up; the stretch: arms forward, a lean of about 30
   degrees) and `PG.r3d.catchStrip('leap')` draws it from the side;
   `PG.r3d.poseOf(i)` gives the pose player i is drawn in, for checking that a state reaches the figure; `PG.r3d.strip(8)` returns an image of one stride from the side
   (put it in an `<img>` and look at it). `PG.r3d.eyes()` should report the helmet within about 5 degrees of the ball
   carrier out to 90 degrees off his line, short of him beyond that, and not turned at all when he is behind;
   `PG.r3d.block(0.8)` hands within about 10 cm of the other man's chest, elbows bent, chests and helmets apart (no
   negative numbers); `PG.r3d.besideSweep()` a man beside a tackle no more than a few centimetres inside the men on
   the ground in most stagings and moved less than a yard (`eyesStrip()` and `blockStrip()` draw the first two).
   These hooks pose staged figures and never draw a real play, and the harness does not draw at all. So after any
   change to `js/render3d.js` also play a whole game drawn: `H.bot(); PG.dbg.step(0.02); PG.dbg.render()` in a loop
   until the game is over, inside a try, checking `PG.r3d.poseOf(i)` for numbers that are not finite. Run 5 deleted
   the pre-snap stance helper by accident and every staged hook still passed; only the drawn game caught it.
8. Commentary, after any change to the script, the voices or the booth. `tools/voice.py` prints, for every clip it
   records, its length and pitch, and flags any whose sound has far fewer syllables than its words (a swallowed
   line). In the page: `PG.audio.deaf(true)` first (the mix runs but the speakers get nothing; the test pane plays
   through the owner's speakers otherwise), then a real click so the sound engine starts and `PG.audio.booth.state`
   becomes `'ready'`. `PG.audio.booth.log` after `H.exh(3, 120)` and `H.career('QB', 2)` lists every line the game
   asked for: every one must exist in `PG.VO.clips`, and the drills must ask for none. Levels:
   `await PG.audio.measure('vo:td')`, `'vo:a.first'` and so on against `measure('crowd', { level: 0.6, cheer: 1 })`:
   a line should peak near -3 dB and sit about -16 dB RMS, a few dB above a full roar once the roar is dipped under
   it. Timing needs real time, which the synchronous harness does not give: step the game from a timer
   (`setInterval(() => { H.bot(); PG.dbg.step(0.02); }, 20)`) and watch `PG.audio.booth.now` and `.waiting`. The
   hidden pane only runs while a tool call is waiting on it, so wait inside the call.

## Architecture

- `index.html` page shell. `pocket-gridiron.html` is the same game inlined by `tools/bundle.py` (gitignored).
- `css/game.css` all styles. Tokens on `:root`; `--acc` is set from settings.
- `js/data.js` teams, formations, routes, playbooks (`PG.data`). Loaded first.
- `js/game.js` engine (plays, AI, rules), 2D renderer, HUD, menus, exhibition, player-lock controls,
  drive simulation. Exposes `window.PG`. `PG.dbg` has `auto(v)`, `seed(n)`, `step(dt)`, `render()`, `G`, `ps`, `P`.
- `js/league.js` schedule, standings, playoffs. `js/season.js` Season mode.
- `js/career.js` career mode: save (`localStorage` key `pg.career.v1`), league, XP, hub screens.
- `js/media.js` the words of the career's media: the reaction feed, the press questions and what answers do (state in `C.social`).
- `js/camp.js` training camp: drill scripts, star marks, screens (`pg.camp.v1` keeps the best result of each drill).
- Coordinates are yards. x 0..53.33 across, y 0..100 between goal lines, end zones to -10 and 110.
  Team 0 is the user and attacks +y. `G` is game state, `ps` the current play, `P` the 22 players.
- `js/audio.js` sound engine (`PG.audio`). `js/render3d.js` three.js renderer (`PG.r3d`); the 2D canvas stays on top as a
  transparent overlay for markers, letters and the joystick.
- Formatting: `node tools/fmt.js <files>` then `node --expose-internals tools/astcheck.js before.js after.js`.
  After any change that should not alter behaviour, `H.fingerprint()` must return the same string as before.

## Stages

### 1. Foundations
- [x] Auto-resume job (cron, every 10 minutes when idle, self-cancels after noon)
- [x] This roadmap
- [x] `tools/harness.js`

### 2. Sound
- [x] `js/audio.js`: master, sfx, crowd and music buses with a reverb send; unlock on first tap; Sound and Music settings
- [x] Crowd bed that follows the game: level from situation, roar on big plays, groan on turnovers, clap build on third down
- [x] Effects: whistle, pads collision (power from closing speed), kick, catch, snap bark, throw, UI ticks, horn, fanfare
- [x] Menu music: procedural 8-bar drumline with bass and brass (100 BPM)
- [x] Round 2 (see below): announcer, chant, organ riff, rain and wind. Not done: quarterback cadence, footsteps

### 3. 3D renderer
- [x] three.js scene (`js/render3d.js`) behind a Graphics setting, automatic fallback to 2D when WebGL or the library is unavailable
- [x] Field texture (stripes, lines, hashes, numbers, end zones, midfield logo), goal posts, pylons, first-down marker
- [x] Stadium: two decks of crowd, ribbon boards with team names, light towers with glow, benches, sideline figures
- [x] Camera matched to the portrait framing (fov 76, 24 yd high, 40 back); overlay canvas projects through the 3D camera
- [x] Polish: the crowd is a shader now (no moire), video boards show the score. The menu camera path is unchanged

### 4. Player models and animation
- [x] Procedural low-poly rig: helmet with stripe, visor and facemask, pads, jersey numbers front and back, arms, legs, shoes.
      Every body part is an InstancedMesh (13 draw calls for all figures). Ball model with stripes and laces.
- [x] Poses: line, under-center, two-point and wide stances; run cycle; backpedal with eyes on the quarterback; pocket carry;
      tucked carry; throw; catch reach; block; dive; stumble; fall; celebration and heads-down
- [x] Blob shadows, user ring, pass target ring in 3D
- [x] Looked at up close: the fall after a tackle. The kicker's leg swing has still not been viewed

### 5. Game feel
- [x] Break-the-huddle jog to formation; the ball travels from the turf to the quarterback on the snap
- [x] Incomplete passes bounce and roll (`ps.loose`)
- [x] Instant replay of touchdowns, interceptions and 28+ yard plays: half speed, low camera, tap to skip, setting to turn off
- [x] Stadium video boards with score, clock, down and distance, "TOUCHDOWN" on scores
- [x] Cinematic cameras: push-out before the snap, orbit around the scorer
- [x] Referee signals, handoff motion, celebration variety

### 6. Gameplay
- [x] Live kickoffs and returns in exhibition (touchbacks when the kick reaches the end zone); career and simulations use the 25
- [x] Computer tuning after the 3D pass: `H.sim(14,180)` gives 4.1 ypc, 62% completions, 2% sacks, 0.9% INT, 28 pts/game
- [x] Lob and bullet passes (hold vs tap)
- [x] Timeouts (three a half, the computer manages its own late in a half) and two pre-snap flags (false start, offside)

### 7. Career depth
- [x] Abilities: slots open at 74, 80 and 87 overall; four per position; they boost the ratings the engine plays with
- [x] Weekly practice: six reps, no clock, XP at half rate plus 80 (`startGame({drill:6})`)
- [x] Game grades (F to A+), a headline after each game, season honors (All-League, League MVP) with XP bonuses
- [x] Live stat chip under the scorebug; goals with check marks in the pause menu
- [x] The computer quarterback tests the receiver a user cornerback is covering more often
- [x] Combine (a tapping 40-yard dash and five position reps), a draft whose pick sets team, bonus and coach trust; roles
      (starter, rotation, backup) that decide how many drives you play; trust moves with game grades and practice; trade requests.
      Contracts are not modelled

### 8. UX
- [x] First-time tips for each control context (shown twice each, reset in Settings)
- [x] Settings screen: accent, graphics, sharpness, pre-snap camera, replays, sound, music, tips. How-to-play screen.
- [x] Auto-pause when the app is hidden (the test pane triggers this; the harness bot resumes)
- [x] Halftime report with team stats and the career stat line
- [x] Final presentation: player of the game, drive summary after touchdowns

### 9. Optimization
- [x] Measured: simulation 0.013 ms per step, render 0.5 ms of CPU per frame, 68 draw calls, 151k triangles, about 1 KB of garbage per frame. Pixel ratio is capped (Sharpness setting). Body parts are instanced.
- [x] The one per-frame coin flip (computer juke) is now a rate, so the game plays the same at 30, 60 and 120 Hz. A fixed timestep was judged unnecessary after that.
- [x] Lazy work: the field is not rendered while a full-screen menu covers it

### 10. Code quality
- [x] `game.js`, `career.js` and the harness reformatted with `tools/fmt.js` (one statement per line); data tables moved to `js/data.js`.
      The engine itself is still one file with section headers: its parts share too much state to split cheaply.
- [x] README update (controls, modes, layout, libraries)

### Round 2 (added during the night)
- [x] Model detail: tapered chest and limbs, short sleeves, joints, helmet decal; fill light
- [x] Follow camera in the open field; camera flashes in the stands
- [x] Bullet (tap) and lob (hold) passes; pre-snap hot routes by tapping a receiver's letter; QB Kneel and Spike
- [x] Season mode (`js/season.js`): one team, seven weeks, playoffs, standings, schedule, team stats
- [x] `js/league.js`: schedule, standings, simulated scores and playoffs shared by Career and Season
- [x] Career extras: league leaders at your position, 12 trophies, free agency between seasons, a retirement screen
- [x] Seedable RNG (`PG.dbg.seed(n)`), reformat with a syntax-tree check (`tools/astcheck.js`) and a same-seed check (`H.fingerprint()`)
- [x] README refresh

### Stretch
- [x] Offline play: `sw.js` is network first with the cache as a fallback, so a new push is never hidden by an old copy.
      Registered only on https. Not tested offline on a phone.
- [x] The game watches its own frame rate and drops the glow pass, then sharpness, then shadows if a device cannot keep up

## Overhaul plan (2026-11-27)

The owner asked for the animations to be overhauled, starting with the throw, and for a plan of what else needs
work. This is the list, in the order proposed; he decides the order. Each item is checked with a filmed strip
(`film()` in the log entry of 2026-11-27, or the strips in `PG.r3d`) before it ships.

Animation
1. [x] The throw (1.13): full body, ball in the hand, run throw, pump fake.
2. [~] The quarterback around the throw. Done in 1.14: the hand-off (hands on the ball, the ball carried across),
   the snap on every play. Left: the drop's footwork looked at on film, the pitch, a throw-away, taking a sack.
3. [~] (1.16: hands to the ball, the defender's hand to the ball; left: the turn up the field, jump and toe tap on film) The catch: hands to the ball at every height, the jump, over the shoulder, the toe tap, the turn up the field
   afterwards; the defender's swat and the interception.
4. [ ] (filmed 2026-11-27, nothing changed: no defect found at film size) The ball carrier: cuts, stiff arm, spin and juke looked at again on the new stride; a dive at the goal line.
5. [~] (1.17: four stances, the punch, the arm over; left: a real shed, a pancake, double teams) The line: pass sets, rush moves, run blocks. Today two men lean on each other.
6. [ ] (filmed 2026-11-27, nothing changed; pops left: a fallen man's arms after the whistle, about 1.0 a frame) Tackles and getting up: wraps, the fall, the rise.
7. [~] (1.18: the swing, the kickoff run-up, the ball waits for the foot, the punt's drop; left: a holder and a snap on place kicks, the returner's catch on film) Kicking: the kicker's approach, the holder, the punter's drop and swing, the returner's catch.
8. [ ] (filmed once 2026-11-27, nothing changed; the scene is dimmed under the play sheet, so film it before the sheet opens) Between-play life: huddle, walk, signals, celebrations, officials.
9. [x] (1.15, `PG.r3d.pops`) A pop detector: a test that lists any joint that jumps in one frame, run over full games, so transitions
   between all of the above are found by a tool and not by eye.

Beyond animation (proposed, not asked for yet)
- The look of the players in play. The owner said on 2026-11-22 that the models "feel severely downgraded". The
  model code has not changed since 2026-11-16; the suspect is watchSpeed() in game.js, which turns off close-up
  models, the color pass, sharpness and shadows for good when the frame rate dips (a phone in Low Power Mode is held
  to 30). Not confirmed on his phone. Changed in 1.14 all the same: a step-down lasts for the visit (LOW), a step
  that does not help is undone, and saved settings get the full look back once (SET.q14).
- The ball: its size next to the players, the spiral, the arc.
- The camera: framing by situation.
- Still offered and not built: head-to-head online, cloud saves, team logos, a draft screen and trades.

## Log

- 02:45 Session start. State: `ui-refresh` has the UI refresh (fdf47ef), `main` is the live site with the
  older look. Auto-resume job created. Roadmap and harness written.

- 02:54 Sound engine done. Levels checked offline with `PG.audio.measure(name)` (peak / RMS dBFS): whistle -13/-26,
  hit -8/-30, horn -8/-22, fanfare -9/-24, music -4/-22, crowd bed -35 (quiet) to -29 (loud), big cheer -19.
  Nobody has listened to it yet: levels are verified, taste is not.

- 03:07 3D renderer and player models in. 95 draw calls, 131k triangles, 0.9 ms CPU per frame on the dev machine.
  `PG.r3d.debugCam = {pos:[x,h,-y], look:[x,h,-y]}` pins the camera for close-up screenshots; `PG.dbg.render()` forces a frame.
  `H.sim(6,120)`: 4.7 ypc, 59% completions, 2.1% INT, 24 pts/game, no errors.

- 03:16 Kickoffs, replays, video boards, jog-in, loose ball. Regression clean. Note: the pane's `zoom` action can return a
  stale capture; use `screenshot` after `PG.dbg.render()`.

- 03:19 Career depth pass. All five positions: practice, game, grade, headline, ability equip verified by script.

- 03:22 UX pass done: settings and help screens, tips, auto-pause, halftime report.

- 03:32 Round 2 so far: model detail, follow camera, flashes, bullet/lob, hot routes, kneel/spike, Season mode.
  Found and fixed a testing pitfall: `python -m http.server` let the browser reuse stale scripts; use `tools/serve.py`.

- 03:37 Career extras in. `H.careerSeasons(pos,n)` plays whole seasons: all five positions finish a season with no errors,
  a three-season WR run earned six trophies, free agency moves the player and starts the next season.
  League-leader baselines per game at 3-minute quarters: QB 150 yds, RB 60, WR 58, LB 3.4 tackles, CB 0.8 passes defended
  (a scripted bot gets about 143, 67, 60, 2.6 and 0.25, so a real player should be in the race).

- 03:49 Code clean-up. Wrote a small formatter (no formatter was installed and installing one needs the owner's say-so).
  Proof of no behaviour change: identical syntax trees, and `H.fingerprint()` (seeded simulations plus a traced game)
  returns the same string before and after. Data tables moved to `js/data.js`.

### Round 3 (planned at 03:49; the owner's top request is better models and animation, so that goes first)
- [x] Models: body types by position, pant stripes, wristbands, glossy helmets; real body-shaped shadows on the turf
- [x] Reviewed by eye: day, dusk, rain and snow all look right
- [x] Looked at up close: handoff, truck, hit stick, a celebration, the hurdle, an official's touchdown signal.
      Not viewed: the stiff arm and the strip swipe
- [x] Shader pass (GLSL, `js/shaders.js`): turf with blade detail, view-dependent mowing stripes and wet reflections; sky dome with
      sun, stars and clouds; a crowd drawn seat by seat that hops when it cheers; rim light on players; a finishing pass with glow,
      vignette and color (Settings can turn it off)
- [x] Animation: handoff exchange, three touchdown celebrations, officials who jog and signal, reserves that react,
      truck, stiff arm, hurdle, hit stick and strip poses (the run cycle itself is unchanged)
- [x] Weather and time of day: day, dusk, night, rain, snow
- [x] Moves: Power (truck a tackler in front, stiff-arm one beside), Hurdle, Hit (hit stick), Strip; fumbles (lost or recovered);
      rain and snow make catches, fumbles and field goals harder
- [x] Sound round 2: announcer calls through the device's speech synthesizer (Settings and the pause menu can turn it off),
      a stomp-stomp-clap chant, an organ riff the crowd answers, rain and wind beds, a muffled mix while paused
- [x] Presentation: a flyover with a matchup card before kickoff (tap to skip), a drive summary after touchdowns, a box score
      that names a player of the game on every final screen (worth 300 XP when it is your career player)
- [x] README refresh, final regression, morning summary

- 04:01 Round 3, first part, committed in a working but only partly checked state (the usage limit arrived here).
  In: body types by position, pant stripes, wristbands, glossy helmets, body-shaped shadows (four from the light towers at
  night, one from the sun by day; `SHADOW_GEO` keeps them cheap; Settings has a switch), time of day (day, dusk, night) and
  weather (rain, snow) chosen in Exhibition and picked per week in Career and Season, three officials who signal
  touchdowns, first downs and incompletions, reserves that jump when their team scores, more celebrations, a handoff
  pose, the ball on the turf before the snap. 228k triangles, 133 to 157 draw calls.
  Checked: night view by screenshot; day, dusk-rain and night-snow run with no errors; exhibition and career bot games
  finish; `H.fingerprint()` unchanged. NOT yet looked at: screenshots of day, dusk, rain and snow; the celebrations, the
  handoff pose and the officials' signals up close; weather has no effect on play yet. Do that first on resuming.

- 07:19 The owner checked in: "always push to main" and "use more complex languages and change code and anything if needed".
  Merged to `main` and pushed (live). Shader pass added in GLSL (`js/shaders.js`): turf, sky dome, crowd, rim light and a
  finishing pass that renders the scene off screen with 4x anti-aliasing, blooms the brightest pixels and adds a vignette.
  134 draw calls and 229k triangles with everything on. Checked by screenshot in day, night, rain; regression clean
  (`H.fingerprint()` unchanged, `H.sim(6,120)` 4.6 ypc, 63% completions, no errors). Not measured on a phone: if it is slow
  there, Settings has switches for shadows and for the finishing pass, and Sharpness lowers the pixel ratio.

- 07:24 Moves and fumbles. Carry pad: Sprint, Juke, Spin, Power, Hurdle. Defense pad: Sprint, Dive, Switch, Hit, Strip (keys L, H, F, R).
  A tackle knocks the ball loose 1.6% of the time, 10% on a hit stick, 15% on a strip; who recovers depends on who is nearby.
  `H.sim(12,180)`: 4.5 ypc, 57% completions, 1.6% INT, 31 pts/game, no errors. `H.fingerprint()` re-baselined (the fumble roll
  changes the random sequence on purpose). Hurdle pose checked by screenshot; truck, stiff arm, hit and strip checked by
  script only (timers and odds), not yet by eye.

- 07:27 Sound round 2. `PG.audio.spoken` keeps the announcer's last lines, so a scripted game can show what he would say:
  kickoff welcome with the weather, third and fourth downs, touchdowns with the scorer's name, turnovers, sacks, field goals,
  the half and the final score. The test pane has no speech voices, so the calls were checked as text only; nobody has heard
  them. Levels (peak / RMS dBFS): organ -11/-22, stomp -19/-40. The announcer's word choice uses `Math.random`, never the game's
  seeded generator, so `H.fingerprint()` is unchanged.

- 07:30 Presentation. New game state `intro` (3.8 s, tap or Space to skip; skipped in simulations). `G.box` is the box score,
  `playerOfGame()` picks from it; simulated career drives have no players, so only played snaps count. Regression clean:
  `H.fingerprint()` unchanged, exhibition, a season game and all five career positions finish without errors.

- 07:37 Timeouts and flags. `G.runoff` is the time that ran off after the last play; a timeout hands it back. The user gets a
  Time out button for the moment after the whistle and another on the play-call sheet (key T). Scoreboard shows three pips a team.
  Seeded computer games: 3.4 timeouts used a game, a flag on 2% of snaps. `H.sim(16,180)`: 4.5 ypc, 57% completions, 33 pts,
  no errors. `H.fingerprint()` re-baselined (the flag roll changes the random sequence on purpose).

- 07:43 Career opening and coach trust. New career flow: create, combine, draft, hub (or walk on with a team and skip the draft).
  `C.trust` 0 to 100: 60 starts, 35 rotates (about 6 drives in 10), below that backup (about 4 in 10). The engine takes
  `share` and sits the player for whole drives (`simDrives(true)`). Goals and grades scale with the share so a part-timer is
  judged fairly. Checked: a scripted rookie went dash, drills, draft (pick 4, trust 56, rotation) and into the hub; two-game
  bot careers at all five positions and a two-season run finish with no errors; `H.fingerprint()` unchanged.
  Not checked by a person: how the dash feels to tap, and whether trust rises at a fair pace for a real player.

- 07:50 Fumble scramble. Forcing a fumble on 292 computer plays: 53% lost, 46% kept, one returned for a touchdown, none stuck,
  1.4 seconds on average. Natural rate in seeded computer games: 0.36 fumbles a game, 0.14 lost. `H.fingerprint()` re-baselined.
  Noticed while testing: the scripted exhibition user (who only ever calls the first play and kicks on every fourth down) now
  loses by about 27 points a game; with fumbles switched off it is the same, so it is not the scramble. Computer against
  computer is steady at about 32 points a game combined. A smarter test bot is needed before reading anything into that.

- 07:52 Audibles. `setupPlay(true)` re-aligns for the same snap; `G.flip` mirrors formation, run path and the two sided routes.
  Checked by script (a toss sweep's path flips from left to right, two audibles in a row, the drive still counts one play,
  the snap works afterwards, the defense steps from Cover 2 to Cover 3) and by a screenshot of the three-button pad.
  `H.fingerprint()` unchanged.

- 07:56 Two-point tries and onside kicks. `G.pat` holds a pending choice, `G.try2` marks the try play (no clock, no flags, no kicks
  on the call sheet), `finishTry` scores it. Scripted: touchdown, choice sheet, try from the 2, "Two points!", 8-0, kickoff;
  and an onside kick when down 12 with 25 seconds left. Three 16-game simulations: 32 to 34 points a game (one sample of 40),
  no errors. The computer tries an onside kick in about two games out of three: its trailing teams score late often, and
  after such a score an onside kick is the right call. The window is the last 27% of the fourth quarter.
  `H.fingerprint()` unchanged.

- 07:59 Run cycle and tackles. The renderer now keeps its own stride phase per figure (`f.ph`), advanced by ground covered over
  a step length of 0.8 to 2.5 yards. Checked by two close-up screenshots (a back at full stride, a tackler lying across the
  carrier). Motion itself cannot be judged from stills. In `H.fingerprint()` only the position trace changed (downed players
  now slide a little after the whistle); scores, stats and step counts are identical. Re-baselined.

- 08:01 Coach and rival. `coachSays()` builds the note; `C.rival` is the man to beat. A scripted RB season ended ahead of the
  rival (657 yards to 604) and earned the trophy; the hub shows the coach's card. Word choices use `Math.random`, so
  `H.fingerprint()` is unchanged.

- 08:03 Season roster. `startGame({ros0})` plays with a saved roster; `onEnd` now carries the box score. Two bot games: the
  Roster tab shows leaders (rushing 334 yards, 8 tackles) and lines per player. `mkRoster` re-rolls duplicate numbers, which
  changes the seeded sequence, so `H.fingerprint()` was re-baselined. `H.sim(12,180)`: 32 points a game, no errors.

- 08:07 More flags. 20 seeded computer games: 11 holding, 7 false starts, 8 offsides, 1.3 flags a game; none with the switch off.
  Pass interference never came up by itself in computer games: their quarterbacks only throw to open receivers, so a catchable
  ball almost never falls incomplete with a defender close (measured: 0 of 52 incompletions). It needs a defender within
  2.2 yards, so it will mostly follow a user's throw into coverage. Its code path was exercised by forcing it for six games
  (2.8 a game, every one a first down at the spot, no errors), then the real numbers were restored.
  Also learned from that measurement: most computer incompletions are inaccurate throws to wide-open backs behind the line.
  `H.fingerprint()` re-baselined.

- 08:10 Menu shots and portraits. `PG.r3d.portrait(team, home, number)` renders one figure in its own small scene to an off-screen
  target and returns a PNG data URL (cached per team, kit and number). Checked by screenshot on the Exhibition screen (home and
  away kits) and the Career card. With 3D switched off the portraits are simply absent. The four menu shots were not
  watched in motion. `H.fingerprint()` unchanged.

- 08:14 Career difficulty, measured with the bot (which plays your player the way the computer would; a scripted QB also throws
  worse than a person). 21 games per position on teams rated 85, 82 and 80.
  Before: average game grade in points was QB 4.9, RB 6.3, WR 6.2, LB 3.1, CB 3.1 against a neutral point of 4.5 for coach
  trust, so backs and receivers became starters just by showing up and defenders sank to the bench (trust 5) while winning.
  A running back's team won 5 of 21 because the coach called runs 60% of the time.
  Changes: harder goals and a lower stat scale for RB and WR, a higher stat scale for LB and CB, a neutral point per position
  (`NEUTRAL`), run calls for a back cut to 50%, and a difficulty choice in the Career hub (All-Pro pays 20% more XP).
  After: grades RB 5.4, WR 5.1, LB 2.8 to 3.6, CB 3.2 to 4.1; trust ends both above and below its start at every position;
  wins RB 8/21, WR 13/21, LB 10/21, CB 6/21. Samples are small and noisy. `H.fingerprint()` unchanged.

- 08:16 Name plates (a quad above the number, text squeezed to fit) checked by a close-up of the quarterback. Vibration uses
  `navigator.vibrate`, which iPhones do not offer to web pages and which no test here can feel; it waits for the first tap.

- 08:18 Play of the game. `G.potd` holds the frames plus copies of the 22 players and the play state; `watchPotd(done)` replays
  it and hands the final screen back. Scripted: a forced 51-yard run became the play of the game, the button showed it from the
  low camera, and both the natural end and a tap to skip returned to the final sheet. `H.fingerprint()` unchanged.

- 08:23 Playbook and run game. Measuring yards per play by play name (16 seeded computer games) showed what the overall 4.5 yards
  a carry had been hiding: Toss Sweep 12.1, Inside Zone 2.4, Off Tackle 1.6, QB Draw 1.6, and the new Counter at -1.6.
  Changes: the toss is pitched at once so the defense reacts sooner; each run play has a `push` (how hard the line drives its
  men back); Off Tackle and Counter aim at the B gap; a sneak is hard to stop for its first step. After, on three seeds:
  overall 3.9 to 4.5; Inside Zone 3.8 to 4.5, Off Tackle 3.2 to 5.3, Counter 3.0 to 4.3, QB Draw 2.4 to 2.9, HB Draw 2.2 to 6.9,
  Toss Sweep 5.4 to 7.0, QB Sneak 0.5 to 1.6 on short yardage. Points 29 to 36 a game. A longer hold on run blocks was tried
  and rejected (it sent HB Draw to 16.8). All four new plays ran in a scripted user game. `H.fingerprint()` re-baselined.
  The same measurement for passes: Smash 12.6 and Stick 11.5 yards a play are the strongest; not changed.

- 08:26 Punt returns. A punt with a returner (`ps.ret`) becomes a 'ko' play at the catch (`ps.punt`). 24 scripted punts each way:
  the computer returning averages 9.7 yards, the user's returner (run by the computer in the test) 13.4; no touchdowns in the
  sample, though one turned up in an earlier single try. Career games, practice and simulations keep the simulated return.
  `H.fingerprint()` unchanged.

- 08:27 Camera choice (`SET.camv` scales the gameplay camera's height and distance by 0.8 or 1.25), left-handed layout (a `lefty`
  class on the app) and the hall-of-fame card. One screenshot with both settings on shows the button bottom left and the
  closer view; a two-season bot career scores 8, "A short stay in the league". `H.fingerprint()` unchanged.

- 08:44 Training camp (`js/camp.js`). The engine side is small: a drill can now be scripted (`PG.startGame({ drill, side,
  script, dcall })`), each rep is logged in `G.drill.reps`, and `ps.userTkl` records whether the player you steer made the
  tackle (2) or was within 2.6 yards of it (1). Control tips always show in a guided drill and do not use up the two showings
  a real game gets. The star marks came from test players (`H.camp(id, n)`, a bot that throws to the most open man, runs
  upfield around the nearest defender and jukes, or chases the ball and dives):
  passing, completions out of 5: the computer's own quarterback 3.1 (1 to 5, 16 drills), marks 2 / 3 / 4;
  running, yards on 5 carries: nobody touching the screen (the computer runs for you) median 31 to 35, the bot median 90,
  marks 20 / 45 / 75; tackling, tackles you are in on out of 5: the bot 3.0 (2 to 4), nobody steering 0.8, marks 2 / 3 / 4.
  The first version of the running drill used Cover 3 every rep and gave up 10.5 yards a carry, so it now faces the computer's
  normal mix of calls. No person has played the drills yet, so the marks may be off for real hands.
  Also fixed on the way: the rep counter read 6/5 on a drill's final screen, the stadium clock ran during practice, and the
  tip box ran under the receiver buttons. Regression: `H.fingerprint()` unchanged; sims, exhibition, career (QB, LB, WR, with
  practice) and a season game finish with no errors.

- 09:00 Models. `PG.r3d.info` now reports `nearModel` and `camDist`. The inside-out bug: three.js faces a lathe outward only
  when its profile climbs, and the limb profiles ran top-down, so the signed volume of the upper arm, sleeve, forearm,
  thigh, pants stripe and shin came out negative (measured in the page). You were looking at the far wall of each limb.
  `lathe()` now turns such a profile round. Before and after close-ups: the pants stripes, never visible before, appear.
  Near model: 45 figures at about 10,500 triangles each against 3,900 (478k triangles in a close-up, 194k in play; the
  swap happens under 20 yards from camera to subject and back above 24). Measured over a scripted game: play, pre-snap and
  dead-ball views sit at 25 to 55 yards (far model in every sample), replays at 14 (near model in every sample),
  celebrations 8 to 38. Frame rate with the near model was not measured: the test pane was hidden, which throttles it.
  Seams fixed after looking at close-ups: the name plate sank into the pads (a flat chord across a curved surface; it now
  has three rows), ankles poked through the shoes of thick-legged players (shoes now scale with the leg), and the pants
  grazed the jersey hem and the socks (the hem flares, the sock steps in under the knee).
  Also: leaving a game in the middle of a replay left the replay badge on the menu. `H.fingerprint()` unchanged.

- 09:02 Career history. `closeSeason` adds one row to `C.hist`. Two scripted quarterback seasons and one running-back season
  produced the right rows on both screens; `H.fingerprint()` unchanged.

- 09:07 Punt returns, second pass. A returnable punt now hangs one second longer (`HANG`; simulated punts are untouched, so
  `H.fingerprint()` is unchanged), every third coverage man holds up five yards short as a second wave, and the punter trails
  as the last man. Before, the nearest coverage man was 14 to 19 yards away at the catch and nobody had a reason to fair
  catch. After (scripted, 50 punts by the user's team and 40 by the computer): the computer fair-catches 34%, returns
  average 5.1 and 5.4 yards, 3 touchdowns in 90 (5 in 66 before the second wave). Muff chance is 1.5%, 5% with a tackler
  within 2.5 yards, 1% on a fair catch, times the weather; forced in a test, both a recovery by the receiving team
  ("muffed, recovered") and by the kicking team ("Muffed punt!", a turnover) score correctly. The fair-catch wave was
  checked in a close-up. Not tried by hand: whether the button is easy to find in the second or so you have.

- 09:09 Milestones. `endGame` reports every finished game that is not a drill or a computer-only run. A rigged All-Pro win in
  the rain (38-7 with the stat totals set by hand) earned seven at once and the banner listed them; the seeded
  `H.fingerprint()` run counts no games and is unchanged. Title and camp milestones are reported by their own screens and
  were not triggered in a test.

- 09:14 Catch and get-up poses (render only; `H.fingerprint()` unchanged). The session's usage limit was reached here: the
  next three Round 7 items are untouched.

- 12:16 Chain crew. Three more figures (`CREW`), so 48 instances per body part; a night frame is 255k triangles. Checked from
  a sideline camera: on 2nd and 9 the back stick and the "2" box stand at the line of scrimmage and the front stick at the
  line to gain. The standard gameplay camera rarely shows that sideline, so this is mostly for replays and wide plays.
  `H.fingerprint()` unchanged; exhibition, career and camp bots clean. The scheduled autopilot ended at noon (job cancelled
  at 12:12); work after that was at the owner's request.

- 12:18 Bracket and awards. `league.js` records `po.games` ({s1, s2, f} as [team, team, winner]) with the same simulated
  games in the same order as before, so seeded results should not move (`H.fingerprint()` unchanged; scripted careers are
  not a check of this, because the test player's throw timing is not seeded). Checked two scripted seasons: one with the score rigged to win it all (the
  bracket filled in after each round, the title milestone fired) and one played straight that missed the playoffs (the
  whole bracket appears at once). A season saved before today has no bracket until its next playoffs.

- 12:21 Contracts. `C.deal = { years, left, pay }`, `C.cash` for the total. Offers are a pure function of your overall, last
  season's average grade and each team's rating (no dice, so `H.fingerprint()` is unchanged). Scripted: a drafted receiver
  (pick 3: two seasons at $4.2M), a walk-on quarterback through three seasons (re-signed after the first, total $5.8M, then
  signed with another team from the offers screen), and a save with the contract fields deleted (treated as one year left).
  Free agency used to be open every offseason; now it opens only when the deal is up. Round 7 is complete.

- 13:24 Positions and throw power. `throwTo(r, pt, power)` takes 0 to 1 (the computer's quarterbacks throw at a half, as
  before, so `H.fingerprint()` is unchanged). The bar fills in 0.55 s of game time; a hold a second past full throws anyway.
  Scripted checks: a two-step tap on the pad gave "Lob 7" (0.97 s in the air over 19 yards), a full bar from an on-field
  letter gave a bullet (0.77 s), moving to another letter mid-hold moved the charge, and a sack mid-hold cancels it. The
  test player now holds its key for 0.3 s; the first version of that deadlocked a quarterback career (a stale charge
  after a sack stopped it snapping), which is why `finish()` clears the charge.

- 13:42 Audio, second version. Nobody at this end can hear, so it was checked by measurement: `PG.audio.report()` renders
  every sound through the whole mix off line and gives peak, loudness, the loudness and peak with everything under
  250 Hz removed (about what a phone speaker plays) and the share of energy in six bands; `PG.audio.meter` reads the live
  output. Before: crowd bed -35 dB RMS, tick -26 dB peak, catch -17, throw -20, whistle -13. After (dB, peak / RMS):
  crowd quiet -8 / -22, tense -4 / -17, cheering -3 / -14; music -3 / -17; whistle -8, hit -8 (phone peak -9, it was
  nearly all under 200 Hz at first), kick -8 (phone -12), catch -11, horn -5, fanfare -4, tick -20. Nothing reaches
  full scale: the limiter holds sustained sound near -4.5 dB. The loops have no click at the seam (the jump there is no
  bigger than between any two samples) and hold their level round the loop to within about 2 dB after the roar's
  voices were spread over its first two seconds. A live run in the pane with a real click (music, crowd at three
  moods, cheer, ooh, groan, chant, claps, whistle, hit, roll, touchdown, rain and thunder, pause muffle) matched
  the off-line levels and raised no errors. What measurement cannot say: whether the voices sound like people or
  like a choir of synthesizers, and whether the theme is any good. `H.fingerprint()` unchanged.

- 13:47 Camera zoom. `SET.zoom` (1 is standard, bigger is closer) scales the gameplay camera's height and distance and the
  2D view's focal length; the old `camv` choice is carried over. Looked at 60%, 100% and 180%. At 60% with the ball
  on your own 2 the camera had backed out behind the end-zone video board, whose black back filled half the screen: the
  camera now stops 44 yards behind the goal line and climbs instead, the near board is hidden while the camera is behind
  it, and the near goal post is hidden during play when the camera is behind it (its uprights used to stand in front
  of your quarterback on your own goal line at any zoom). `H.fingerprint()` unchanged.

- 13:50 Suggested plays. `suggestOff()` and `suggestDef()` are plain rules with no dice. Seen in a scripted game: 1st and 10
  Off Tackle, 2nd and 9 Stick, 3rd and 5 Slants, 3rd and 15 Dagger, 3rd and 2 Inside Zone, 4th and 1 QB Sneak; on defense
  Cover 2, Cover 3 on 2nd and long, Cover 4 on 3rd and 7. The test player now takes the suggestion, and its exhibition
  scores went from losing by about twenty to 7-0, 7-14, 6-7 and 3-14. `H.fingerprint()` unchanged.

- 14:04 Play tag and run-pass options. `playKind(op)` names the play; `ps.rpo` marks an option. Balance, by scripted
  players over three games each (yards a play): Inside Zone 3.6; RPO handed off every time 2.2 (it was -0.1 with a
  one-second mesh four yards deep, so the mesh is 0.7 s and nearer the line); RPO thrown every time 16.0 with 71%
  complete and 7% turned over (it was 21.3 and 90% before the lane rule); ordinary Slants thrown by the same player
  13.7, 74% and 6%. So an option thrown blind is about an ordinary pass, and the hand-off is the safe floor. The test
  player's own "read" did not match the engine's lane check, so a well-read option is not measured.
  `H.fingerprint()` unchanged: the computer never calls an option, and the only dice are rolled when one is called.

- 14:09 Football sounds. Measured the same way (dB peak, and the peak a phone speaker would reach): cadence -6, "Hut!"
  about -8, line crash -4 (it plays on every snap, so it was pulled down from six hits to five quieter ones), audible -8,
  cannon -4 (phone -14), band pieces -3 to -4 with the snares brought up and the bass drums down after the first
  render came out 91% below 200 Hz. A live run played every one of them without an error; with the horn, the fanfare,
  the cannon and a full cheer at once the output peaked at -3 dB. The band rests at least 16 seconds between pieces.

- 14:42 Bug test and interface pass. Looked up the numbers first: Apple's guidelines ask for 44 by 44 point touch
  areas, Material for 48 dp, WCAG 2.2 sets a 24 pixel floor (AA) and 44 as the enhanced level; text contrast 4.5 to 1
  (3 to 1 for large type); safe-area insets need `viewport-fit=cover` (already set). `tools/audit.js` measures all of
  that on the live page. Found by it, on a 320x568 phone: the play tag and the coaching card ran under the thumb
  buttons; "Punt return" was cut off; the kick caption was white on snow (1.1 to 1); the tagline and the how-to-play
  text sat over the moon at 1.6 to 2.9 to 1; locked trophies were at 2.1 to 1; nine kinds of control were under 44
  pixels (the trade link was 17 high); eleven labels were under 10 pixels. Found by hand while testing: Settings and the
  Career and Season hubs jumped back to the top on every tap (measured: scroll 465 to 0; now 190 to 190), and How to
  play still said "tap a letter for a bullet pass", which the power bar replaced. `H.fingerprint()` unchanged;
  exhibition, quarterback and receiver careers, a full receiver season and all three drills ran clean; no console
  errors. One trap for later runs: the seeded run used to read the weather from Settings, so a test that leaves snow
  switched on made it look like a regression. It pins the weather itself now.

- 15:12 Stadium sound (automatic run 1). `paVoice()` speaks any text down the speakers' route: the spelling becomes
  vowels and consonants through one formant mouth, with the echo and reverb the horn already had. A referee's call
  measures -6.6 dB peak and -23.5 RMS, 61% of it between 500 Hz and 1 kHz, so it sits under the commentator; his
  microphone click is -11.6. New crowd stems: `boo` (-3.4 peak, -15.5 RMS, 81% between 200 and 500 Hz, which is where
  a "booo" lives) and `firstdown` (-3.3, -16.5). `crowd.rise()` holds about -14.6 dB RMS against -17 for a tense crowd
  and -13.8 for a full cheer, and `settle()` drops it at the snap. `crowd.swell()` is the kickoff "ohhh" played at the
  speed that makes it top out as a long pass comes down. The halftime piece is 16.5 seconds, -2.8 peak, -18.8 RMS; its
  first render had 38% of its energy under 200 Hz, so the tubas went up an octave and the bass drum down (28%).
  In ten scripted games the game asked for the halftime show 10 times, the third-down noise 22, the deep-ball swell 5,
  and referee's calls for a false start, an offside and a hold. A 15-second live run at low volume played every one
  with no error. `H.fingerprint()` unchanged (every hook is outside simulations and rolls no dice); exhibition, both
  careers and the three drills clean; the interface audit empty at 320x568 and 390x844.
  Not built: the crowd counting down the play clock. The computer snaps about two seconds after it lines up, so there
  is nothing to count; the third-down noise does that job. Hits already grew with closing speed (`pw` in the tackle).
  `PG.audio.asked` lists what the game has asked the stadium for, so a test can check the hooks without sound.

- 15:46 Motion (automatic run 2). Measured the old run first, with the formulas copied into a script: the foot was within
  2 cm of its lowest point for 5 to 11% of the stride, was moving backward over the turf at 1.5 to 7 yards a second
  while it was there, and sank 2.6 to 6.7 cm into the field. The rig now has ankle joints (two more pose values) and
  the legs of anyone on the move are solved, two bones in the plane the leg swings in, to put each foot where the
  stride says: planted for 66% of the cycle at a walk down to 30% flat out, then swung through on an arc.
  `PG.r3d.gait(speed)` runs the real figure code and measures it. From 1 to 9.5 yards a second the planted toe now
  slides 0.9 to 1.5 cm at most (0.2 cm backpedalling), sinks 0 to 0.2 cm, lifts 21 to 63 cm, and the knee over the
  planted foot bends 33 to 51 degrees. `PG.r3d.strip(speed)` draws one stride as a row of side views; looked at for
  2.2, 5 and 9.5 yards a second and a backpedal. Set stances are stood on the turf by `plant()`: soles flat, hips
  moved until the lower foot rests on the ground (the shoe used to be one piece with the shin, so a crouch buried the
  toes 10 to 16 cm). The quarterback winds up as the power bar fills, faces the man he is throwing to, skips the
  cocking part of the throw if he is wound up already, and finishes low and across for a bullet, high for a lob.
  Drawing only: `H.fingerprint()` unchanged; exhibition, both careers and the drills clean; audit empty at both
  phone sizes; no console errors. Not solved: a sideways shuffle. The legs only swing forward and back, so a defender
  sliding across still steps in place while he moves (measured: 120 cm of slide a step).

- 17:20 Motion, the sideways half (automatic run 3; the 16:02 run stopped at the owner's usage limit before any change).
  The hips now open sideways and the ankle turns on all three axes, so the leg solve reaches a foot placed anywhere
  on the turf and the shoe still lies flat pointing where he faces. The stride takes the direction of travel in the
  figure's own frame: forward, backward, sideways or between. A shuffle takes short quick steps (0.5 yard plus 0.06
  per yard a second), keeps the feet 0.22 of a leg wider than the hips so they never cross, and rides 7% lower.
  `PG.r3d.gait(3, { how: 'side' })` went from 120 cm of slide a step to 1.7 at most (0.9 on average); a diagonal is
  0.9, a backward diagonal 2.2; forward and backward are unchanged (1 to 1.5, 0.2). The first version left 3.3 cm,
  because the ankle only undid the leg's pitch and roll and the shoe swung a little about the ankle: the exact
  inverse of hip, hip and knee fixed that. A covering defender no longer shuffles at a sprint: above 4.6 yards a
  second across the field (6.4 straight back) he turns and runs, chest and helmet turned back to the quarterback
  (looked at in a close-up: a safety at 8.6 yards a second). The officials and the chain crew are on the same stride
  (1.0 and 1.4 cm) through `stridePhase()`, `strideLegs()` and `easePose()`, which all three kinds of figure share.
  Drawing only: `H.fingerprint()` unchanged; exhibition, both careers and the drills clean; audit empty at both phone
  sizes; no console errors.

- 17:44 Two-player tackles (automatic run 4). Measured first, with a staged tackle (`PG.r3d.tackle(angle)`: a runner
  at six yards a second met from the front, the side or behind, then moved exactly as the engine moves the pair).
  As it was: the tackler's hands ended 23 to 28 cm from the runner, his trunk 19 to 35 cm inside the runner's body,
  and parts of both men up to 46 cm under the turf; the two fell side by side like dominoes. Now the tackler bends to
  the hit inside a tenth of a second with his shoulder at the runner's hip, his arms are solved (`armIK()`, the leg
  solve turned round for an elbow) to a hand on each side of the runner's hips, he is drawn at 0.96 yard from the
  runner so the shoulder really is there, and he rides him down to lie across his legs with his head turned aside
  (the head has its own turn now). `settle()` tries each fallen pose on the figure before it is used: hips up until
  nothing is under the grass and the tackler's trunk is on the runner and not in him, hands pushed out to the
  runner's surface, feet let down to the turf. Measured at six approach angles once they are down: hands 8 to 9 cm
  from the runner's surface (the hand's own radius, so touching), trunk inside the runner 0, under the turf 0 for
  both. The runner keeps the ball tucked on his back or side and holds it out in front when he lands on his face.
  `PG.r3d.tackleStrip(angle)` draws the fall as a row of frames; looked at for the three directions, and one real
  tackle in a game from above.
  A correction to the 15:46 entry: the quarterback's wind-up was not reaching the game. The power-bar value was
  passed to the renderer but not on to the pose code, and the still I took showed his ordinary pocket pose, which I
  misread. It is passed through now and checked by reading the pose the game draws (`PG.r3d.poseOf(i)`): right
  shoulder 0.80 in the pocket, 3.05 with the bar at 87%, 3.33 at the release, 1.25 late in the follow-through.
  Drawing only: `H.fingerprint()` unchanged; exhibition, both careers and the drills clean; audit empty at both phone
  sizes; no console errors.

- 17:51 The owner's first verdict by ear: the spoken commentary sounds "too ai" and should be "like the nfl
  commentators". Nothing changed in the game for it yet. Looked at what could record real-sounding lines: the voice
  service connected to this session (Eleven v4 and others; a two-voice sample of 230 characters priced at 1.15
  credits, one short line at 0.5; the account holds 5 credits), and this Mac (M1, Python 3.14, no speech model, no
  ffmpeg; only compact system voices installed). Asked the owner which way to go; see "Next ideas".

- 18:32 The booth (Round 10). The owner chose the free model on his Mac. Downloaded, with that say-so and nothing
  else: `kokoro-v1.0.onnx` (326 MB) and `voices-v1.0.bin` (28 MB) from the kokoro-onnx project's GitHub release
  "model-files-v1.0", and the `kokoro-onnx` 0.6.1 package with its dependencies from PyPI into a Python 3.12
  environment (155 MB); all of it in `.voice/`, outside the repository. Auditioned twelve of the model's male voices
  on one line and measured pitch and range: play-by-play is `am_fenrir` (the second-widest range of the twelve, at a middle pitch:
  4.8 semitones between the 10th and 90th percentile) at 1.05 speed; the analyst is a deeper blend, 65% `am_michael`
  and 35% `am_onyx`, at 0.98, so the two cannot be mistaken for each other (median pitch 155 Hz against 110).
  `tools/voice.py`: records each line, trims it, lifts the worked-up calls (up to 7% faster and higher, 3.5 dB more
  top, 3 dB louder), cuts rumble, compresses, sets loudness (calm lines -20 dB RMS while speaking, the biggest calls
  -17.8), holds peaks under -2 dB, and encodes 40 kbit/s AAC. One- and two-word shouts are spoken at 0.78 speed
  first: "Touchdown!" came out at 0.59 s, a real call holds the word. Each clip is checked by counting the syllable
  peaks in its sound against the syllables in its words: none came out short (the worst is 4 heard of 6, two vowels
  running together). The .m4a files carried 3.4 kB of padding and tags each, a third of a short clip, so the tool
  strips them and moves the sound pointers: the pack went from 3.2 MB to 2.4 MB. 273 clips, 6.5 minutes of speech.
  In the game (`js/audio.js`): the pack is fetched after the first tap, kept compressed, and a clip is decoded when
  wanted (the last 36 stay decoded; all of them decoded at once would be about 120 MB). The booth has its own route:
  dry, a little presence, its own compressor. Priorities: colour is dropped when anyone is talking, a call waits its
  turn and is dropped when its moment has passed, a big call cuts in with a 25 ms fade. Measured through the whole
  mix: a play-by-play line peaks at -3 dB and sits at -16 to -17.8 dB RMS, the analyst (trimmed to 0.84, his rumble
  cut at 115 Hz and his top lifted 3 dB after he measured 50% of his energy under 200 Hz) at -14 to -15; a full roar
  is -13.7 and is dipped 7.5 dB under them, so they sit 5 dB over a roar and 8 over an ordinary crowd. Raising the
  booth further only pushed it into the limiter, so the dip does the work.
  In the game (`js/game.js`): the editorial side, on the game's own clock so tests can count it. Three scripted
  exhibition games asked for 171 lines (57 a game, 29 of them the analyst's), every one of which exists; the drills
  asked for none. In real time with the speakers muted (`PG.audio.deaf`), a game's opening ran: welcome (the matchup
  card now stays up until he has finished it), "The Aviators are in town.", "And the Outlaws are ready to defend
  their home field.", the analyst, then the return; a touchdown ran call, analyst, missed extra point, "And they take
  the lead.", analyst, in that order over nine seconds; an interception cut in over the analyst; a line asked for
  behind a five-second line with 1.5 s to live was not said. Peaks stayed at -2.8 dB over a minute of play.
  The referee now waits 0.9 s before his call so the booth's "Flag down." is not under it. The one-file build
  carries the pack as base64 (3.8 MB in all) and plays it. Commentary only, and none of it touches the game's
  generator: `H.fingerprint()` unchanged; exhibition, both careers and the drills clean; audit empty at 320x568 and
  390x844 (the switch is now labelled "Commentary"); no console errors. Nobody has heard any of it in the game.

- 19:00 Eyes, hands and standing room (automatic run 5). The first two ideas wait on the owner (his verdict on the
  booth; my question about the referee's voice), and the stadium-sound idea is mostly that same voice, so this run
  took the motion idea.
  Eyes: `watching()` gives each man a spot to look at and the pose code turns the helmet to it, eased over about a
  tenth of a second, up to 69 degrees at the neck with the shoulders coming round up to 23 more, and tips it up to
  31 degrees at a ball in the air. Measured on a defender running at five yards a second (`PG.r3d.eyes()`): the helmet
  is 0 to 4 degrees off the ball carrier out to 90 degrees from his line, 34 short at 120 (as far as he can turn),
  and not turned for a man behind him. In two drawn games the helmet was turned more than 11 degrees in 38% of
  player-frames during live play. The bench turns its helmets to the ball.
  Blocks: the engine holds a locked-up pair 0.79 yards apart (median over 2,063 samples), and at the size the
  figures are drawn that is chest inside chest. Each man is now drawn back from the other, about a quarter of a yard
  for linemen, both hands are solved onto the other man's trunk on the side facing him, and both lean the same way
  so the helmets pass. `PG.r3d.block(0.8)`: blocker's hands 5 and 7 cm from the chest surface, the defender's 5 and
  9 from the pads, elbows bent 72 to 113 degrees, chests 11 cm apart, helmets 12 cm apart (before: chests
  overlapping, arms through the other man). Looked at as a strip from four sides and in a real pass play from
  beside and behind the line.
  Standing room: a man still on his feet beside a tackle is moved clear of the lines of the two men on the ground
  (pelvis to helmet, pelvis to feet), by at most 0.8 yards, and the move is fed to his stride so he steps there.
  `PG.r3d.besideSweep()`, 156 stagings (a tackler from four sides, another man from thirteen angles at three
  distances), 0.9 s after the hit: at worst 14 cm inside the runner and 26 inside the tackler where the limit binds,
  0 to 7 cm in the stagings looked at one by one; before, up to 43 cm inside the tackler's trunk alone, his helmet
  not counted. A man standing still now stands on the turf (he was a centimetre in it).
  Tried and taken out: a second defender bending in to put his hands on the runner. Every angle put him in the first
  tackler; "Next ideas" says what a pile needs instead.
  A mistake caught late: cutting that code out also cut the pre-snap stance helper, and every staged hook still
  passed, because none of them reaches a stance. A whole game played with drawing on threw at once. Restored it,
  checked that every name the three edited files declared before is still declared, and added the drawn game to
  "How to test". Then: two drawn games, 9,319 frames, no errors and no number that is not finite; the gait and
  tackle hooks unchanged (slide 1.0 cm at eight yards a second, tackle hands 9 cm, nothing under the turf).
  Drawing only: `H.fingerprint()` unchanged; `H.sim` in range; exhibition, both careers and the drills clean; audit
  empty at 320x568 and 390x844. The console showed "The AudioContext encountered an error from the audio device"
  three times during long test loops in the hidden pane, which freezes the page between tool calls; no game code
  was in the trace, and it did not happen in the timed runs. Worth a look if a player ever reports sound stopping.

- 19:13 Field sound (automatic run 6). A field goal whose accuracy lands within 0.03 of the line between good and no
  good (about one kick in fifteen near it) is flown at the upright and leaves it inward or back out. Whether it is
  good was already decided and the flight time is unchanged, so play is untouched. Forced four kicks in a game (good
  and missed, at each post): each met its post exactly (23.57 and 29.77 across the field, the posts' own positions)
  above the crossbar, scored or not as decided, put "off the upright" in the banner, and asked for the clang. Levels
  through the whole mix (peak / RMS / the part a phone plays): clang -4.1 / -22.4 / -22.4 (first version -30 on a
  phone, 88% of it under 200 Hz; raised to a 340 Hz tube); the defense's calls peak -11.7 and the whoop -11, level
  with the quarterback's cadence at -10.1 (first version 6 dB under it); a hard bounce -13.3. 59 of these were asked
  for over the scripted games. Drawing and sound only: `H.fingerprint()` unchanged, `H.sim` in range, exhibition,
  both careers, the drills and a drawn game (3,412 frames) clean, audit empty at 320x568 and 390x844, no console
  errors.

- 19:35 Round 11, from the owner's message at 19:15.
  The bug: he threw for what should have been a touchdown and got a first down. In each step the game checks the
  tacklers before it checks the goal line, so a receiver who caught the ball in the end zone with a defender on him,
  or a runner hit as he crossed, was ruled down at his spot, which `setBall` clamps to the one-yard line, and the
  chains moved: "First down" on the one. `finish()` now rules a carrier down in the end zone he attacks a
  touchdown. Staged six times (a receiver half a yard into the end zone, a defender on him): six touchdowns, five
  of which were tackles before. In simulated play it happens about once every seven games (3 in 20). It changes
  play, but the seeded fingerprint game never reaches it, so `H.fingerprint()` is unchanged; `H.sim` in range.
  Voices: measured the pitch movement of twelve candidates on excited and on analyst lines. Play-by-play is now 70%
  `am_fenrir` and 30% `am_eric` (12.4 semitones of movement, was 10.2); the analyst 70% `am_echo` and 30% `am_onyx`
  (10.5, was 7.8, still the deep voice at about 100 Hz). New: the referee (`am_adam`, the most even delivery, 0.94
  speed) and the stadium announcer (`am_puck`, the most theatrical, 0.86). 346 clips (was 273), 3.0 MB, none
  flagged by the syllable check. The referee's call is three recorded sentences, chosen by the game ("False start,
  offense." / "Five yard penalty." / "Repeat third down."); the announcer's "And that is another... Outlaws..." for
  each team, with the crowd's "FIRST DOWN!" after it. Both go down the stadium-speaker route after the microphone
  click, at -19 to -20 dB RMS (the synthesized voice was -23.5). The pack now loads whenever sound is on, not only
  with the commentary, since the referee and the announcer are part of the stadium.
  Drives: each drive keeps its quarter and clock at its first snap; every score goes into a log with the drive
  (plays, yards to the goal line or the kick's spot, game time). The booth follows a scoring drive with its length,
  "a long, patient march" (ten plays or four minutes) or "quick strike" (three plays or fewer), and the analyst
  on why. A toast shows the drive a moment after the score. Halftime and every final screen (exhibition, season,
  career) list the scores with their drives, and each team's passing, rushing and receiving leaders from the box
  score. Looked at on a 390x844 screen.
  Checked: every one of 450 lines asked for in three exhibitions and two careers exists; `H.fingerprint()`
  unchanged; exhibition, both careers, a career season, the drills and a drawn game clean; audit empty at 320x568
  and 390x844. The console again showed "The AudioContext encountered an error from the audio device" during long
  frozen loops in the hidden pane; the context was still running afterwards.

- 19:39 The booth knows who has the ball (automatic run 7). 19 new clips (365 in all, 3.1 MB), recorded with the
  same voices, none flagged: three quarterback-run calls, three tight-end catches, three to a running back, two
  analyst lines, and the stadium announcer's welcome for each team (-18.2 dB RMS through the speakers' route, like
  the referee). Three exhibitions and five career games asked for 495 lines, every one recorded; quarterback runs
  and catches by the backs were called, a tight-end catch never came up (the test player rarely throws to him).
  The welcome plays as the intro hands over to the opening kick, and the intro card waits for the booth's welcome
  as before (7 s in all). Commentary only: `H.fingerprint()` unchanged; exhibition, both careers, the drills and a
  drawn game clean; audit empty at 320x568 and 390x844.

- 19:48 Round 12, from the owner's message at 19:42.
  Two-minute warning (`twoMinute()` and `warnCall()` in `js/game.js`). It changes play, so it was checked: in two
  scripted exhibitions with three-minute quarters the clock stopped at 2:00.00 in the second and fourth quarters
  three times and at 1:59.96 once (the clock crossed 2:00 during a live play, which is how the rule works), with
  no time left to give back for a timeout. The seeded fingerprint game uses two-minute quarters, so
  `H.fingerprint()` is unchanged; `H.sim(10, 180)` with three-minute quarters stayed in range (3.8 yards a carry,
  58% completions, 32 points a game).
  Awards night (`awardsNight()` and `showAwards()` in `js/career.js`): MVP, Offensive Player of the Year, Rookie of
  the Year (first season only), All-League at your position, and your position's statistical title from the
  leaders table. You win on your average game grade (MVP 8.2, or 7.5 with a playoff team; OPOY 7.0; All-League 6.5,
  as before; Rookie 5.6); otherwise a player from around the league wins, and the nominees are named. Their names
  come from a hash of the season, not the game's generator. The ceremony opens after the season's last game and can
  be seen again from the hub. Won awards count as honors in the hall-of-fame case, as All-League and MVP did.
  Hall of fame (`retireToHall()` and `showHall()`): a "Retire" button beside the erase puts the career to a vote
  (`fameCase()`, 70 to get in) and keeps it in `localStorage['pg.hof']`; the Hall of fame opens from the main menu.
  The test harness erases careers with the erase button, so test careers never reach the hall.
  24 new clips (389 in all, 3.4 MB): the two-minute warning for the booth and the referee, the coin toss for each
  team, "Timeout, (team)." and "That's their first / second / third and final timeout." In a game with the sound
  running (output muted) the toss, the welcome, the first-down call and the two-minute warning all played from
  their clips. The audit now walks a playoff season, the awards night, the retire screen and the hall: at 320 wide
  the bracket's names ran 2 px off the screen and the page scrolled sideways (older; never reached before). The
  bracket's columns may now shrink and its names wrap. Audit empty at 320x568 and 390x844; exhibition, both
  careers, two career seasons, the drills and a drawn game (7,850 frames) clean.

- 20:03 The reverse angle (automatic run 8). The idea list's first two items wait on the owner, so this took the
  presentation idea. `rpBegin()` works out which way the play went (the ball carrier's, or the ball's, position at
  the start of the replay and at the end) and `replayStep()`, at the end of the sideline pass, plays the last 150
  recorded frames again at 0.55 speed with `G.rpAngle = 1`; the renderer then puts the camera 16 yards ahead of the
  play that way, 7 high, a quarter of the way to the middle of the field, looking back at the carrier (first tried
  at 4.2 high and 15 ahead: a defender in front filled the picture). The badge says "Replay · reverse angle". In a
  drawn game all three replays switched over (the first after 6.6 s); looked at on an interception return coming
  down the sideline at the camera. Drawing only: `H.fingerprint()` unchanged; exhibition, both careers, the drills
  and a drawn game (8,976 frames) clean; audit empty at 320x568 and 390x844.

- 20:34 Age and the rival (automatic run 9). `ageOneYear()` runs once at the start of each new season from
  `initSeason()` (re-signing and free agency both go through it); no dice. Checked: a quarterback went from
  76/70/64/62 to 77/71/65/63 in his second season (age 23, "still growing"); the same player set to 31 and moved
  into his third season (age 33) lost 2 arm power, 2 speed and 2 elusiveness and kept his accuracy. Careers saved
  before this have no age stored: they are treated as having started at 22. The rival's line showed before his
  game ("I've seen his film. I'm not worried." early; "Check the leaderboard. Then come talk to me." once he led the
  race) and his reaction went into the headline. Career only, from the second season: `H.fingerprint()` unchanged;
  exhibition, both careers, two career seasons and the drills clean; audit empty at 320x568 and 390x844 including a
  35-year-old's hub, the rival game card and the retire screen.

- 21:06 The two-minute drill (automatic run 10). This changes play, so it was measured against the version before
  it, four seeds of 20 simulated games with three-minute quarters each: before, 31.4 points a game and 71.9 plays; the
  first version (hurry for two minutes before halftime too, 6 seconds between plays, the computer throwing more)
  38.0 points on 76.7 plays, outside the healthy 25 to 35; the narrower rule shipped (fourth quarter only when not
  ahead, the last minute before halftime, 8 seconds, no change to play calling) 32.9 points on 74.8 plays, with
  completions 59 to 60%, 3.9 to 4.7 yards a carry and interceptions 1.0 to 1.7%. Two-minute quarters: 25.8 points.
  The seeded fingerprint changed (it runs in two-minute quarters, where the window is open); checked repeatable and
  stored as the new `localStorage['pg.fingerprint']`. 5 new clips (394). In a game: "No huddle · 4th & 12 · ATX 32"
  on the sheet, "Outlaws in the hurry-up · no huddle" as a toast, once a drive. Exhibition, both careers, a career
  season, the drills and a drawn game clean; audit empty at 320x568 (with the no-huddle sheet) and 390x844.

- 21:45 Round 13, from the owner's message at 21:25.
  Robotic voices. Listed every voice made in code and replaced or removed each: the quarterback's "Ready... set" and
  "Hut!", his audible, the defense's calls, whoops and "Ball!" are now 26 recorded clips in three new voices
  (`am_liam` for the quarterback; `am_michael`, and a blend of `am_onyx` and `am_fenrir`, for defenders), played out
  on the field, panned, dulled above 4.8 kHz, with the stadium's echo, under the booth. The draft is the stadium
  announcer joining three recorded sentences (pick, team, position; the player's own name cannot be recorded, so it
  is left out). Removed outright: the device's speech voice (the draft used it, and the booth fell back on it), the
  synthesized stadium voice (`paVoice`, the stand-in before the clips load), the synthesized shouts and grunts
  (`bark`), and the crowd's lone synthesized shouts. 438 clips, 3.8 MB. In a minute of muted play the field clips
  decoded and played with no errors.
  The pile (`pileOf()` and the pile branch of `poseFor()` in `js/render3d.js`). When the runner is first seen down, the
  two nearest defenders within two yards (not the tackler) dive on. `settle()` now keeps a man out of a list of
  bodies (up to four; helmets and his legs count for a man on top) instead of one, with up to six passes. The top
  man lies flat with his legs trailing, gets off first (from 0.45 s: he slides back two yards away from the middle of
  the pile, then stands); the tackler gets up from 0.85 s and the runner from 1.05 s. Measured over 104 piles staged
  from every angle: while lying on it, 3.3 cm inside the men below at the median and 7 cm at worst; from 0.95 s, at
  most 9 cm. Short of perfect in two places, noted in "Next ideas". The first versions failed in ways worth knowing:
  the fall timer was reset every frame for anyone not on the ground (so he never fell), the step-clear offset was
  applied after solving, his feet were pulled to the turf through the men under him, and three passes were not
  enough. In two drawn games a pile formed on 11 of 24 tackles; looked at in one.
  Officials: a timeout signal (arms straight up, crossing at the wrists) for timeouts and the two-minute warning.
  Drawing and sound only: `H.fingerprint()` unchanged; exhibition, both careers, a career season, the drills and a
  drawn game clean; gait and tackle hooks unchanged; audit empty at 320x568 and 390x844.

- 21:48 The propped runner (automatic run 11). The staging test now names a downed runner's lowest joints: rolled onto
  his left side (hit from his right) his lowest points were his left hand and elbow at 8 and 10 cm, the arm he holds
  out "to break the fall" folded under him, and the ground solver lifted his hips to 0.57 to keep it above the turf
  (0.35 on the other side, where the tucked ball arm lies along his body). On that side the arm now goes out past his
  head. Both sides now lie at the same height (chest 57 cm), the tackler on him at 106 against 101, and the tackle
  hooks are unchanged. Piles came down with it: the highest a pile man lies went from about 2 m to 1.72 m, and while
  he slides off, 4 of 104 staged piles have a leg in someone (was 6 to 9). The solver's pass-by-pass record is now
  kept only while the staging test runs. Drawing only: `H.fingerprint()` unchanged; exhibition, both careers, the
  drills and a drawn game clean; audit empty at 320x568 and 390x844.

- 22:04 Celebrations (automatic run 12). The scorer's celebration now comes from six (it was three), picked by his
  figure's seed as before: jump, spike, strut, and new, a knee with the head bowed that turns into both arms to the
  sky after 1.3 s, a flexed roar with the head thrown back, and a bow repeated every 2.2 s with the hips folding back
  so he does not tip. Teammates: jump, fist pump, and a clap. The side that was scored on: heads down, or for about
  four in ten, hands on their helmets. `PG.r3d.celebStrip()` draws all eleven; looked at at 0.9 s and 1.8 s. The first
  roar (fists at the belly) read as standing still and was redone with the arms out wide. Drawing only:
  `H.fingerprint()` unchanged; exhibition, both careers, the drills and a drawn game clean; audit empty at 320x568
  and 390x844.

- 22:16 The scoop-and-score (automatic run 13; the owner said "keep improving"). The scramble was already there (the
  ball bounces, everyone near chases it, a man who gets there falls on it half the time or knocks it loose again);
  what it lacked was the pickup. Now about four in ten defenders who close on a loose ball stay on their feet instead
  of diving, and one who gets there upright scoops it (55%, 70% off a bounce) and the play goes on as a return. The men
  round the ball cannot tackle him for 0.45 s (they have just dived or been knocked off it). A scooped fumble is
  scored and called as a fumble, not an interception; the booth has three new lines for it. A bug found on the way:
  the tackle code took "a fumble exists" to mean "this tackle knocked the ball out", which after a scoop would have
  turned every tackle of the scooper into a new fumble with no ball; it now asks about this tackle only, with the dice
  rolled in the same order. Measured over 80 simulated games: 59 fumbles, 8 scoops, returns of 52 (a touchdown), 11,
  9, 4, 2, 1, 1 and 0 yards. Balance: 33.6 points a game with three-minute quarters (32.9 before; the seeds vary by
  more than that), 23.8 with two-minute; completions, yards a carry and interceptions in range. The seeded
  fingerprint did not change (its games have no loose ball a defender reaches). Exhibition, both careers, the drills
  and a drawn game clean; audit empty at 320x568 and 390x844.

- 22:24 The kick swipe (Round 14, part 1). On your field goal or punt (the timing bar's screen) and on your kickoff, a
  finger swiped up the field kicks. Its angle is the aim and its power comes from length (55%) and speed (45%). A field
  goal needs a straight swipe (accuracy falls to nothing at 23 degrees) and enough leg for its distance; that becomes
  the same 0-to-1 strike the bar gives, so the make-or-miss rule is unchanged, and the swipe's side decides which way
  a miss goes. A punt's power is its distance and its angle where it lands. Your kickoff waits for the swipe (or the
  Kick button, or 8 s) and comes down by power: a full swipe deep in the end zone, a soft one around the 15. The bar,
  Space and the button still work; computer kicks and simulations are untouched, and the generator is drawn the same
  way either way. Checked with synthetic swipes on a 45-yarder: straight and strong good, 4 degrees left good, 12
  right wide right, a weak one short; kickoffs: full to the back of the end zone, soft and left to the 17 near the
  left sideline, none after 8 s to the goal line. A test swipe also grabbed the movement stick; the stick is off
  during your kickoff now. `H.fingerprint()` unchanged; exhibition, both careers and the drills clean; audit empty at
  320x568 (with the kickoff screen) and 390x844.
- 22:42 The rest of Round 14. Play clock: 35 seconds from the play-call screen while you have the ball (not in
  simulations, drills or your own kicks), shown beside the down and red from :05; at zero a five-yard delay of game
  with the referee's call (new clips ref.delay, a.delay). Coach's challenge: a spot within 0.6 yd of the line to gain
  is given the wrong side about three times in ten (Math.random, so seeded runs are untouched); the side it hurt may
  challenge, two a game, a failed one costing a timeout. Overturned restores the true spot (first down, or the right
  down and distance, or a turnover on downs on fourth). The computer challenges a wrong call three times in four, and
  so does your coach in a career; you get a button on the next sheet. New clips ref.chal.{team}, ref.over,
  ref.stands, booth "challenge". Celebrations: five more for the scorer (shuffle, salute, to the sky, flex, leap) and
  two for teammates (wave, shuffle), picked in game.js by Math.random; group celebrations (whole side jumping or
  shuffling on one beat) about one in three; a career player can choose his own in the hub. Switching ends: the
  engine still has team 0 going up the field, so render3d.js turns the stadium instead in the 2nd and 4th quarters
  (the end zones repainted the other way round, the sun mirrored), under a 2.6 s crane shot over midfield; rotating
  the turf mesh was tried first and turned every yard number upside down. Checked: challenge overturned (first down
  and short), stands (timeout lost), computer rate 0.8 of 40, a bot game with one natural close spot; celebrations as
  a picture strip and staged in an end zone; ends turning in a bot game at Q2, Q3, Q4. `H.fingerprint()` unchanged;
  exhibition, both careers and the drills clean; audit empty at 320x568 and 390x844 (the celebration picker first
  overlapped its own touch areas; rows are now 14 px apart), and the sheet with the challenge button checked at both.
- 22:45 Teammates run to the scorer (automatic run 14, from "Motion, the rest"). After a touchdown, coast() in game.js
  steers every teammate within 40 yards of the scorer to his own place in a loose ring round him (golden-angle
  spacing, 1.6 to 3 yards out) at up to 6.2 yd/s, and keeps them about an arm's length (1.1 yd) apart; render3d.js
  draws a man still running with his running stride and starts his celebration when he gets there, facing the
  scorer. Cosmetic only: never in simulations, so `H.fingerprint()` is unchanged. Measured over 11 bot touchdowns:
  from 0 or 1 teammates within 4 yards at the whistle to 2 to 9 two seconds later; the closest pairs (0.3 to 0.8 yd)
  are men still running past, standing men keep their spacing. A screenshot shows the group round the scorer in the
  end zone. Exhibition, both careers and the drills clean; audit empty at 320x568 and 390x844; no console errors.
- 23:04 The ball carrier's eyes and the bench (automatic run 15, the last of "Motion, the rest"). watching() in
  render3d.js now gives a ball carrier (not a quarterback in the pocket) the defender closing on him soonest, inside
  4 yards and under 0.9 s to contact; the neck limit means he sees only one coming from in front or the side. Over
  2,053 drawn live frames, in 331 of the 400 with such a defender off to one side the carrier's helmet was turned his
  way (the rest are the turn catching up). The bench: about three in ten reserves (by figure seed) walk a yard or two
  from their place at up to 1.05 yd/s with a walking stride, turn to face the way they go, stop five to thirteen
  seconds, and stop for a celebration; over 60 s, 7 of 20 walked, none more than 1.5 yd from his place, no two
  closer than 1.85 yd. New test hook `PG.r3d.bench()`. `H.fingerprint()` unchanged (drawing only); exhibition, both
  careers and the drills clean; audit empty at 320x568 and 390x844; no console errors. At phone size the far bench
  is a few pixels tall, so the walk is judged by numbers, not by eye.
- 23:18 The career's media (Round 15). New `js/media.js` writes the words; `career.js` keeps `C.social` (followers,
  hype 0 to 100, the last 40 posts, your quotes, an open callout, backed/eaten counts, the coach's name) and draws three
  screens after every career game: the press conference (three questions chosen from the game: performance or last
  week's callout; rival, role change, loss or win; next opponent or the season), its summary (your quotes, net trust,
  hype and followers, the coach's verdict, any new callout), and the reaction feed. Answers have fixed effects (trust
  -3 to +3, hype -3 to +9; big talk after a poor game earns half the hype). Buzz 0 to 10 from the grade, player of the
  game, the result, a rival win, the playoffs and a settled callout sets how many posts (about 4 to 25), how far they
  reach (likes scale with the square of buzz) and whether one goes viral and the game trends. Follower growth goes with
  the square of buzz and with hype; eating your words costs 4% of followers, 20 hype and 3 (5 for a guarantee) trust;
  backing them up pays 250 (400) XP and 2 trust. Measured: a staged monster game drew 37 posts with 7 replies on the
  final, trending and a viral post, followers +31%; a bot season of 7 games kept the feed at 40 and no errors. A clash
  with the play buttons' `.pb` class first drew the posts in capitals with rings; renamed. Cosmetic choices use
  Math.random, so `H.fingerprint()` is unchanged; the harness and the audit now answer the podium; exhibition, careers
  (QB and WR, three games each, one QB season), drills clean; audit empty at 320x568 and 390x844; no console errors.
- 23:30 The feed audited after test games (the owner: "audit the feed after a test game and bug fix / improve"). Two
  careers (WR and QB, six games each) dumped post by post. Fixed: lines repeated up to five times a week (lines and
  fan accounts are now dealt like cards: an exhausted pool means one post fewer); reply authors and lines were drawn
  apart, so opposing fans posted home fans' lines; neutral accounts spoke as partisans (they have their own lines);
  a new random teammate per post (three different starting QBs in a week, one with your surname; teammates are now
  five fixed men per team in `C.social.mates`, never sharing a surname with you, the coach or the rival, and a rival
  who shares yours is renamed); opposing fans ignored the result (separate lines for their win and their loss);
  win-flavoured analyst and teammate lines after losses; "wasted day" lines for an ordinary loss (now only a great
  game in a loss; a good game in a loss and a bad game in a win have their own lines); a blowout loss of 17+ takes
  a notch off how the media sees the game; the final listed the loser first; quotes had no context ("No regrets"
  about what?): every question now carries a topic ("on last week's guarantee"); the coach quoted as "Solid." (now
  his first two sentences when the first is a word); times were random (now the final is oldest, the feed newest
  first, replies in order); the feed's 40-post cap cut weeks in half (now the last three weeks, whole, each headed
  with its result); "one target all day" for none; a player-of-the-game day headed "A quiet week online"; a long
  hyphenated name pushed posts 17 px off a 320 px screen (the feed's grid columns are now pinned to the screen). A
  comment swallowing half a line during the work broke the podium for one test run and was caught by the harness.
  After: 0 repeated lines in 11 weeks, no broken text, no name clashes; fingerprint unchanged; careers, a WR season,
  drills clean; audit empty at 320x568 and 390x844.
- 23:38 The media, more (automatic run 16, the first of "Next ideas"). Media day: the hub's next-game card offers one
  question about your rival the week you play him (`PG.media.mediaDay`), once a week; its answer counts like the
  podium's and can set the callout. The booth: `G.callout` comes from the career (`startGame({callout})`); new calls
  call.guar / call.trash at the open (instead of a.intro), a.callout, call.td the first time your side scores to lead
  (three in four), call.shaky from the play-call screen when behind in the last 2:30 of the fourth (it first sat in
  voPre, which only runs when a drive opens, and never fired), call.won / call.lost at the final whistle in place of
  a.final: 7 calls, 14 clips, recorded with the local model (471 clips, 4.3 MB). Endorsements: two games in a row at
  hype 55+ bring an offer (pay a game = followers / 50, 80 to 500 XP; four times that to sign), shown on the reaction
  screen and the Social tab, signable from either; an unanswered offer expires after two games; two deals at most;
  a deal ends when hype drops under 25, with the brand's post. Also: a rival answers a guarantee aimed at him; a
  loss has its own thread lines under the final; avatar initials turn near-black on a light team color (the Comets'
  orange failed contrast at 3.0:1). Checked: an offer after two hot games, signing (+1,040 XP, +260 a game in the next
  result), a brand leaving at hype 5, media day setting a guarantee that the next game settled (+400), every booth
  line logged in place across five games. Fingerprint unchanged; careers, a QB season, drills clean; audit empty at
  320x568 (with a Comets career) and 390x844, including the hub, Social tab with an offer, and media day. (This entry
  went up in a second commit: the first one's log script failed on a brace.)
- 23:44 Sizing on the phone (the owner, with a screenshot of the career hub's Social tab from his iPhone: "sizing is a
  little off on mobile"). The app frame stopped at the bottom safe area (`#app{bottom:env(safe-area-inset-bottom)}`),
  so on a phone with a home indicator every scrolling page ended above a dead band and the last button (Retire) was
  cut off there. Now the frame runs to the bottom of the screen and what sits at the bottom keeps clear of the strip
  with `--sb` (the inset): the controls (`#deck`), the play-call and result sheets, the end of every menu, the
  feed's sticky Continue; `html` is painted the app's dark so nothing shows black. The sheets count their padding
  inside their height limit now (`box-sizing:border-box`; with the inset, the career result sheet otherwise covered
  the pause and zoom buttons at 320x568). The celebration picker was words floating in a tall box (its buttons had
  no fill and 14 px gaps); now 36 px buttons with a fill, 8 px apart, the same 44 px touch pitch. Long fan names
  and handles wrap instead of being cut. A career begun before the media existed said "Play a game..." after games;
  now "Your mentions start with your next game." The pane cannot show a real safe area, so every audit was run twice
  more with `--sb` set to 34 px (an iPhone's strip): empty at 320x568 and 390x844 both ways, as were exhibition,
  season, career and camp; fingerprint unchanged. On the phone itself it is still to be seen.
- 00:05 Round 17 (the owner: "organize social better, add more visuals to the game, add more league leaders stats, make
  it more realistic models wise keep improving things, research too and work smarter not harder"). Researched first
  (four web searches): the parts of a football helmet (shell, jaw pads below the ears, ear holes, facemask on the
  shell), the official passer rating formula, broadcast lower-third practice (legible, team colors, simple fades,
  sparing), and social profile layouts (identity and stats header over a small tab bar). Built:
  Social tab as a profile: avatar, handle, a four-stat row (followers, hype, callouts, partners), hype bar, waiting
  items, then Mentions (this week open, earlier weeks in <details>), On the record, Partners.
  League leaders: one generator per team and position (`starter()`, seeded by season and team) so every number one
  man has agrees with the rest (his rating from his own attempts, yards, touchdowns and interceptions); five
  categories for your position, four around the league; rate stats qualify on volume; `leaders()` (awards, rival,
  trophies) now reads the same generator. Measured: other quarterbacks rate 90 to 102 after three games.
  Broadcast cards (`#bcast`): `playerCard` after a touchdown (always) or a 20+ yard play (at most one per 25 s), your
  man in a career; `teamStatsCard` at the change of ends; the career stat line fades while a card is up; role letters
  shown as a broadcast names them (X, Z, S as WR); a card on a timer checks the game still exists (a fast test found
  one firing into the menu).
  Models: the helmet is now a shell (`helmetShell`): longer than wide, sides and back down past the ears into jaw pads,
  the face open below the brow behind the mask, a slight brow ridge; ear holes; a skin-colored face under the mask
  with a thin dark eye band in place of the dark ball that filled the front; the far model's shoulder pads get the
  caps the near model had. New test hook `PG.r3d.headStrip(team)` draws the helmet from four sides. About +20k
  triangles a frame in a game (+10%).
  Checked: fingerprint unchanged; exhibition, careers (QB and WR, three games each), a WR season, drills clean; a drawn
  game with every pose finite; cards seen in real career games; audit empty at 320x568 and 390x844, with and
  without a simulated 34 px bottom strip, including every Social sub-tab, an opened week and four leader boards.
- 00:12 Awards night as a ceremony (automatic run 18, the last of the career items in "Next ideas"; the voices and the
  read-out scores wait on the owner, the pile was measured and left, see its item). The cards start sealed with their
  nominees and are read from the stat title up to the MVP: the stadium announcer introduces each (new clips
  pa.aw.open/title/all/roy/opoy/mvp/close, 7 clips, recorded locally: 478 in the pack), the drum roll (`roll`, 0.9 s),
  then the winner comes up to applause, with the fanfare when it is you; Reveal all opens every card at once and
  Continue works throughout; with the sound off the cards open on a timer (about 5 s an award, 24 s in all). New
  synthesized `applause`: single claps, about one every hundredth of a second at first and thinning, each a band of
  noise between 1 and 3.4 kHz at its own pan, over a quiet murmur. Measured: the first version put its energy in the
  murmur (bands 9/36/30/15/7/3) and sat 13 dB under the voice; now 1/5/7/20/41/27, the big round -28 dB RMS on a phone
  (the voice -20, the fanfare -20 over it), the polite round -32. Checked: the ceremony stepped through five awards in
  order in a real end of season; fingerprint unchanged; exhibition, careers, a WR and a QB season, drills clean;
  audit empty at 320x568 (sealed, mid-ceremony and opened, and with the 34 px strip) and 390x844; no console errors.
- 00:33 Cutscenes, 1 of 7: the walkout (Round 19). A cutscene system in game.js: `playScene(kind, o, then)` puts the game
  in state 'scene', stages actors as P (ordinary player objects, from the roster), a stub play state so render3d can
  pose them, a caption with Tap to skip; SCENES[kind] has dur, setup, update and timed cues; actors run to `go` by
  way of `via` points and take an `act` when they arrive. render3d.js: SCENECAM[kind] for the camera, `actPose` for
  staged poses (in front of every other branch of poseFor, only in a scene), props built once (`buildProps`) and
  shown per scene, officials and the chain crew left out, an actor with `ref` in stripes. Settings: Cutscenes on/off.
  The walkout: the tunnel 10 yd left of the posts (centered, it stood on the goal post's base); the first try had the
  team start wider than the tunnel and run diagonally through its wall (now two abreast inside, straight out of the
  mouth, then fanning out), and a tunnel washed out by the team's light second color (now its first). 7 s: into the
  tunnel, the team pouring out of the mouth, then up in front of them. The caption first failed contrast over the
  smoke (1.2:1; now on a dark panel). Checked: skipping goes to the matchup card, the whole scene hands over to it on
  its own, careers play through it with no errors (the harness steps through it), fingerprint unchanged (never in
  simulations); audit empty at 320x568 and 390x844, at three moments of the scene, with and without the 34 px strip.
  (The roadmap went up in a second commit; the first one's log script missed its anchor.)
- 00:38 Cutscenes, 2 of 7: the rival face-off. Before a rival game, after the walkout: you and the rival at midfield,
  fists drawn up to the chest, face to face; the caption carries his line from the week (`rivalSays`) and your
  callout if you made one (the career passes `rivalry` to startGame). Shots: side on and pushing in, over your
  shoulder as he points at you, over his as you answer with a fist to the chest, then up and away; an "ooh" from the
  crowd at the point, a cheer at the answer. Fixed on the way: "arms folded" first read as hands to the face, then as
  reaching for each other (now upper arms down, elbows tight, fists at the chest); the kickoff ball was left lying at
  midfield (no ball in any cutscene now); the over-the-shoulder shots hid him behind your helmet (now wider); "Tap to
  skip" failed contrast over a white jersey (now on a dark pill). Checked: a QB season with its rival game, careers,
  exhibition, drills clean; fingerprint unchanged; audit empty at 320x568 and 390x844 at the walkout and three moments
  of the face-off, with and without the 34 px strip.
- 00:43 Cutscenes, 3 of 7: the championship. After the final, when the career wins it (`gameEnd` plays it from the
  game's 'over' state and the scene now hands back whatever state it found, then the results and awards night): a
  stage at midfield (a dark deck on a skirt in team colors), a silver cup with handles and a football on the lid held
  over your head (it follows your helmet each frame), eight teammates round the back and ends of the stage cheering,
  confetti in four bursts, six fireworks over the stands in team colors (points flying out and falling), the fanfare,
  booms and the crowd; 8.5 s: circling close, in on the cup, then up over the field. Silver, not gold (the owner's
  rule). Fixed on the way: teammates first stood between the camera and you (now behind the stage); the fireworks were
  out of frame and took the flame texture's orange (now lower, behind the stage, on a white spark). Checked: a whole
  season won game by game to the title, the trophy scene seen in it and the results and awards after it; a scene
  from the 'over' state returns to it with the scorebug hidden; seasons, careers, drills clean; fingerprint unchanged;
  audit empty at 320x568 and 390x844 at three moments, with and without the 34 px strip.
- 00:46 Cutscenes, 4 of 7: the coin toss, in every game that is not a simulation (after the walkout and face-off in a
  career): three captains a side facing each other, the referee between them facing the camera; he shows the coin,
  flips it (a silver coin flies up about 3 yd spinning and lands flat in front of him), the microphone clicks, his
  arm goes out to the side that won (G.first, who receive), the announcer reads the toss (`ref.toss.{team}`, and the
  intro then does not say it again), the winners pump their fists and the caption turns to the result. In a career
  you are a captain once you are the starter (`G.share` 1). Fixed on the way: a duplicate else left by the edit
  broke the page until removed (caught by the parse check, before anything shipped); the staged referee first wore a
  helmet and a number (now dressed as the officials: `REF_HIDE`, the striped shirt, a cap; ear holes added to the
  list); the captains were cut off at the edges (now closer in, the camera further back); the camera looked up at the
  coin into empty sky (now less). Checked: exhibition, careers, drills clean; fingerprint unchanged; audit empty at
  320x568 and 390x844 at three moments of the toss, with and without the 34 px strip.
- 00:51 Cutscenes, 5 of 7: draft day. `cinema(kind, o, then)` plays a cutscene away from a game: a quiet stadium in the
  home side's colors (a menu state given the teams and a night sky), then back to the menus; the draft calls it
  before the board, and the board skips its fanfare and announcement when the scene had them. The scene: the stage
  at midfield with a draft board behind it (canvas: "THE DRAFT · ROUND 1 · PICK n", the team's name and city in its
  colors), you walking up the step onto it, the commissioner (a figure in a dark suit, no pads, no number) shaking
  your hand, then you turning to the cameras with your jersey held up (canvas: your name across the shoulders and
  your number in the team's colors), confetti, the fanfare, the announcer reading the pick. Fixed on the way: the
  jersey first covered your face (now at chest height). A page load in the pane once lost render3d.js to the test
  server's connection resets (no renderer, so no cutscenes): not the code; later runs check that the renderer
  loaded. The audit's menu walk now passes through the scene (it skips it, after scanning it). Checked: careers,
  exhibition, drills clean; fingerprint unchanged; audit empty at 320x568 and 390x844 at three moments of the scene
  and through the whole create-combine-draft path, with and without the 34 px strip.
- 00:55 Cutscenes, 6 of 7: the podium. "To the podium" now opens on you behind a podium (a dark lectern with a team
  plate, four microphones on stalks), the team's backdrop behind (its name and abbreviation in rows over its color),
  camera flashes from the room, shutter ticks; 4.2 s pushing in, then the questions. You are dressed for it: a team
  hoodie and cap, no pads. The first try showed the helmet shell for the cap, shiny, like a helmet with the mask off;
  now there are three optional head parts, hidden on every figure unless it asks for them (`f.extra`): a skull, hair
  or a cap's crown, and a brim. The commissioner gets the skull and hair too (no more cap). The harness and the audit
  skip the scene after scanning it. Checked: careers (the podium after every game), a QB season, exhibition, drills
  clean; fingerprint unchanged; audit empty at 320x568 and 390x844, with and without the 34 px strip.
- 01:00 Cutscenes, 7 of 7: the hall of fame. Retiring with enough to be voted in now plays the induction before the
  hall screen (`PG.cinema('hof', ...)` from the retire button, only when `e.inducted`): the draft's stage at midfield
  with its skirt in your team's color, the draft board redrawn as "HALL OF FAME" with the class and your name, your bust
  on a dark pedestal (a stone head and shoulders) under a cloth cone in team colors, you beside it in a dark jacket.
  A drum roll at 1.3 s, the cloth lifted off and shrinking away at 2.6-3.4 s, applause, the fanfare and confetti, the
  caption turning to "... is inducted" with the hall's verdict, and you waving (a new `wave` act: right arm high, the
  hand going side to side). The plaque on the pedestal (canvas) carries your name, position and number, team and
  class. Three shots in 7.4 s: the stage and the covered bust, close on the bust as the cloth comes off, then the two
  of you with the hall behind. The board is shared with the draft, so the draft redraws its own next time. Checked:
  the real retire path (a 6-ring career: induction, then the hall, back at the menu with the HUD hidden), careers, a
  QB season, exhibition, drills clean; fingerprint unchanged; audit empty at 320x568 and 390x844 at three moments of
  the scene, with and without the 34 px strip. That finishes the seven cutscenes; each can be skipped with a tap and
  all of them turned off with the Cutscenes chip in settings.
- 01:30 The playbook, after the owner wrote "it feels like i play the same plays over and over a lot". Measured
  first: in two QB career games the coach called 18 different plays in 42 snaps from a book of 19 (Stick, Four
  Verticals 5 times each), half of them from the Shotgun; a WR career saw 17 in 66, one play 8 times, three repeated
  back to back. The book now has 49 plays (15 runs, 4 options, 17 short, 13 deep) in nine formations (new: Gun Trips,
  Gun Empty, Pistol, Gun Bunch, Jumbo, Gun Slot, the last with X in the slot), 15 new routes (wheel, seam, skinny post,
  fade, comeback, sail, slant and go, out and up, stop and go, angle, bubble, arrow, snag, swings) and trick plays (a
  jet sweep, an end around that gives a WR career the ball). Defense: five new calls (Tampa 2, Cover 6, Cover 2 Man,
  Fire Zone, Overload) and pre-snap looks (`al` in data.js). Play calling (`callOff`/`pickOff` in game.js): the old
  situation rules, then a play weighted by the team's offense (`SCHEME`: each of the eight teams has one, shown on the
  matchup card), the red zone (`rz`), and what that side has called this game (the last call x0.03, the last four
  x0.15, the last ten x0.5, and /(1 + 0.5 per use)); the computer mirrors half its calls. The Suggested card uses the
  same caller with Math.random and is put first on its tab; the QB's "Coach sends in" offers two other kinds of play
  from other formations; Audible steps through the same formation's plays. After: 29 different plays in 33 QB snaps
  (most-used twice), 30 in 40 WR snaps, nothing back to back, all nine formations used.
  Balance, with a new play lab (`PG.dbg.lab`): the first version scored 46 points a game against 38. Causes found:
  a seam route bending into the gap between deep zones averaged 38 yards a throw and a fade 40 (now both a go with a
  release), routes that turn back sharply (whip, stop and go) were overthrown because a throw leads the receiver along
  his route at full speed (whip gone, the double moves smoothed), a deep crosser was intercepted one throw in eight
  (Yankee became PA Corner), and blitzers walked right up got home three times as often (now a step). The lab also
  showed rosters, not plays, deciding a batch (one draw's quarterback could not reach the deep routes), so plays are
  compared on the same three rosters. After: 36 seeded games average 4.1 yards a carry, 57.7% completions, 15.4 per
  completion, 1.4% interceptions, 38.5 points (before: 3.9, 58%, 15.0, 1.5%, 38.3); sacks 3.6% (2.2%). Training camp
  keeps the old five calls and plain spots, so its stars are unchanged (the test player: run drill 3,3,1,3,2,3). In a
  bunch the receiver letters sat on each other: a letter that would cover another is now lifted above it, and a tap
  takes the nearest letter. `H.fingerprint()` changes on purpose (the play calling is new); the new one is saved and
  repeats. Checked: careers QB and WR, a QB season, exhibition (the scripted user scored 36 points in 8 games against
  17 before), the drills, a drawn game, the WR end around (his carry, his line), audit empty at 320x568 and 390x844
  with and without the 34 px strip, no console errors.
- 01:57 Round 20. The play-call sheet shows three plays at a time in a row that swipes, takes a mouse wheel (a page a
  notch: a nudge on a snapping row only springs back) and pages with small arrows that say where you are ("4-6 of 46").
  The Coach tab opens it: `rankOff` ranks every play by the play caller's own chances (`callPlan`, split out of
  `callOff` with the dice in the same order, so the fingerprint did not change), shaken with Math.random, and shares the
  top three between the kinds of play by how likely each is, the way seats go by votes (first and ten: a shot, a short
  pass and a run; third and one: two runs and a pass). A career quarterback gets the same sheet with the coach's call
  first. Two traps on the way: grid percentage tracks collapsed to 2 px cards in a scrolling row (now flex), and the
  browser's smooth scroll never moved a snapping row (now a 220 ms slide of our own, landing by timer where frames are
  not running). The audit now skips text scrolled away in a sideways row and still checks what shows.
  Controllers (`pollPad` in game.js, the standard Gamepad layout): on the field the stick and d-pad move, RT sprints,
  the face buttons do the pad's buttons (receivers wear A, B, X, Y and RB); on screens a ring moves with the d-pad
  (nearest button in that direction), A presses, B goes back, LB and RB change tabs, LT and RT page the play row; the
  first press only shows the ring. Tested with a fake controller (`PG.dbg.pad`): menus to kickoff, the sheet, hard
  count, snap, a held-and-released throw, pause and resume.
  Research (Madden's team books run about 550 to 630 offensive plays in some 40 formations; the league's penalty tables:
  under one defensive offside or neutral zone infraction a game, about 2.5 false starts; Next Gen Stats: top speed and
  completion probability) turned into: the hard count (Y, G or a button; works about one time in eight, backfires one
  in twenty-five), a top speed card after a run or catch of 25 yards or more (yards a second times 2.0455), a completion
  probability card after a catch the game gave under 32 percent, a third-down line ("2 of 5 today") before third downs,
  and a measurement when the spot is within a third of a yard of the line to gain. The icon is new (a night game: light
  banks, the field in perspective, a spiral with its trail; rendered with the system's qlmanage, no download). Checked:
  fingerprint unchanged, careers, a QB season, exhibition, drills, audit empty at 320x568 and 390x844 with and without
  the 34 px strip, no console errors.
- 02:06 Automatic run, animations (Round 21, item 3, in part): the catch. Taken ahead of the old "Next ideas" because
  those three wait on the owner (the voice model download, the score lines) or were judged too big for a run (the pile
  solver), and the owner named animations and models as what he wants next. In `poseFor` (render3d.js only, so play
  and the fingerprint are untouched): a receiver whose ball comes down with a defender within 1.8 yards of the spot
  goes up for it in its last 0.42 s, both arms high and knees drawn up, takes it at the top and lands over 0.3 s
  (`f.leap`); the defender beside the spot goes up with him; a ball coming down 0.9 to 2.6 yards off his line with
  nobody near gets a stretch, the chest turned and out over the front foot, arms long, the hips a little lower. The
  first try never left the ground: on a deep ball the pass comes from behind, the old catch code calls that over the
  shoulder, and the leap had been kept to the other kind; a contested ball is fought for either way, so now it leaps.
  New test hooks `PG.r3d.catchTest(kind)` and `catchStrip(kind)` stage it: at the catch the leap has the hips up 0.5 of
  a hip height, the lower foot 89 cm off the turf (field scale) and the arms at 172 degrees; the stretch has the arms
  at 98 degrees and a 30 degree lean; both land back at standing height. In two drawn computer games, 4 of 109 passes
  came down as a leap and 4 as a stretch (before widening the contest from 1.6 to 1.8 yards). Checked: fingerprint
  unchanged, gait slide 1 cm at 5 and 8 yd/s with no sinking, a whole drawn game with every pose finite, careers,
  exhibition, drills, audit empty at 320x568 and 390x844, no console errors.
- 02:30 Round 23, the owner at 02:10 on 2026-11-13: "i want 30 nfl teams in this game, and bruh if u really can't have
  the normal teams from the nfl due to copyright, can u have similar names to represent them or nah / why are field
  goals still automatic".
  Kicks: a career's own team kicked nothing (field goals and punts went in by themselves when `G.lock`), and the extra
  point was a roll of the dice in every mode (96 in 100, no kick at all). Now your team's field goals, punts and
  kickoffs are yours in a career too, and the extra point is a real kick from the 15 (`patKick`, `finishPat`: a
  32-yard field goal worth one, with the swipe or the meter; a career's coach still decides when to go for two).
  The league: 32 teams, one in every city of American pro football, two conferences (Union, Frontier) of four
  divisions aligned by city the way the real league is. Real names are trademarks, and names made to sound like them
  were left out on purpose (the answer to "similar names"); the nicknames and colors are original, and a new team
  editor (Settings, Edit teams; `pg.teams` in this browser) renames any team on the owner's own device. The first
  eight keep their nicknames, colors, offenses and index (so saves keep their team) and moved city: Austin to Dallas,
  Portland to Green Bay, Omaha to Tennessee, Salt Lake to Seattle, Orlando to Jacksonville, St. Louis to New Jersey,
  Honolulu to Miami, Brooklyn to New York; their recorded calls stay valid (`vo` keys: the booth only ever said the
  nickname). League (league.js rewritten): ten weeks, the division twice (weeks 1-3 and 8-10) and four games against
  another division of the conference, rotating each season (`schedule(lg)`, checked: every week all 32 play, every
  team 10 games, 6 in the division, all in the conference); the four division winners of each conference make an
  eight-team playoff (divisional round, conference finals, championship; phases 'qf', 'semi', 'final'); standings by
  division, yours first, leaders marked; the bracket by conference. A save from the eight-team league (no `L.fmt`)
  finishes its season the old way and starts the next in the full league (`LG.fix` extends its ratings; tested with
  a staged old save: loaded at week 4, finished, free agency, then 32 teams and 10 weeks). Career: the rival is the
  best team in your division (you play him twice), free agency shows your team and the seven best offers, the draft
  is a full first round of 32 (eight contract tiers). Team pickers grouped by conference and division. The booth: 24
  new nicknames and draft picks to 32, recorded on the local Kokoro model (790 clips, 7.4 MB; Krewe is spoken
  "Crew", Voyageurs "Voyagers"); the checker flags "The Iron Sides select..." (4 syllables heard of 7, 1.33 s, the
  same line passes for the other 31; kept). New clips measure as the old ones (Touchdown, Blizzard! -3.2 dB peak,
  -17.2 RMS; Touchdown, Outlaws! -3.4, -17.5). Checked: play unchanged (the fingerprint's games, stats and trace are
  identical; only the career schedule in it went from 7 weeks to 10, new baseline stored), careers, a full WR season
  through the playoffs, exhibition, drills, the booth asks for nothing missing, the editor (rename, reload, reset),
  audit empty at 320x568 and 390x844 with and without the 34 px strip, no console errors.
- 02:40 Round 24, before the owner went to sleep. For a career (and season mode): three primetime games a season
  (`L.prime`, never the opener; the conference final and the championship always), at night, XP +25% and a hype bump,
  marked on the next-game card and the matchup card; Player of the Week in your conference (a win with an A+, or an A
  one time in three: +400 XP, a post from the league, in the headline; the first try gave it on two of three games,
  losses included); career highs per stat (`C.highs`), listed on the results when beaten and announced on the
  broadcast during the game once the old one was worth beating (`highCheck`); scores around the league at the end of
  the first and third quarters, your division first: the week's other games are now played out at kickoff (`preWeek`,
  `L.pend`) and the standings use those same results, and the card waits for your next snap because in a career the
  quarter often ends in a drive you only hear about; the team editor from the career hub and the new-career screen.
  Top speed is now held over a third of a second: unsmoothed, a juke read 27 mph; four computer games now top out at
  21.2 (median 16.5). New team colors broke two contrasts (the social avatar on Tampa Bay's sky blue, the matchup
  card's small text over a day game): the avatar takes its ink from the color, the card is a little darker. Checked:
  fingerprint unchanged, careers, a full QB season (3 primetime games at night, one Player of the Week), exhibition,
  drills, audit empty at 320x568 and 390x844 with and without the 34 px strip, no console errors. The NFL and Madden
  list for the loop is in "Next ideas", career first.
- 02:49 Automatic run: weather by city. Every team has a climate (data.js CLIM): dome for the eleven roofed stadiums
  (never rain or snow, always the lights), snow for the thirteen cold-weather cities, wet for five, warm for Miami,
  Tampa Bay and Jacksonville. `envFor(season, week, late, home)` reads it (a career or season game is at the
  player's home city, the only kind there is until home and away lands); the matchup card says "Indoors" and "Under the
  roof". Over 40 seasons of 13 weeks: domes 0% rain and snow; snow cities 15% rain early, 37% snow late; wet 26% rain
  early, 33% rain and 6% snow late; warm 19% then 12% rain, never snow. The career hub's next-game card gives the
  forecast ("Night game · snow in the forecast", "Indoors, under the roof"), from the same function the game uses
  (`gameEnv`), so it is what you get. Left: a roof drawn over those stadiums (in "Next ideas"). Checked: fingerprint
  unchanged, careers, exhibition, drills, audit empty at 320x568 and 390x844 with and without the 34 px strip.
- 03:23 Automatic run: home and away. `G.home` says which side is at home (team 0, yours, unless `startGame({away})`); the
  league decides (`LG.home`: each schedule pair is [home, visitor], five home games each, the middle round of each
  division leg turned round so nobody opens with three at home; in the playoffs the better seed hosts, the
  championship the better record; the old eight-team league plays at home). On the road: midfield and the crowd's
  colors are the home team's, the visitors wear white (render3d `setTeams(t0, t1, hs)`, the uniforms' kit from
  `p.team === G.home`), the crowd cheers the home side and groans at yours (`react`), roars on your third downs,
  boos your walkout (no welcome from their announcer), cheers a flag on you; a false start comes a little easier for
  you there (+0.8 in 100 a snap) and the hard count rarely works (3 in 100 instead of 12); "at" on the cards and the
  matchup card; the weather is the home city's; a road win +100 XP. Computer-only games are all at home, so play is
  unchanged (the fingerprint's games, stats and trace identical; only its schedule changed, new baseline stored).
  Measured: in a home game the third-down roar came on the other side's third downs only (5, none on yours), on the
  road on yours (3 of 3); a road walkout drew a boo and no cheer. Checked: careers, a full QB season (five at home,
  five away), exhibition, drills, a drawn road game with every pose finite, gait slide 1 cm and no sinking, audit
  empty at 320x568 and 390x844 with and without the 34 px strip, no console errors.
- 03:49 Automatic run: home and away, the rest. In a career or season game both end zones carry the home team's name
  and color (render3d `paintField(..., both)`; exhibition keeps one each); new booth lines recorded on the local
  Kokoro model: `intro.road` (three takes, said at the start of a road game) and `a.loud` (the analyst, about one
  road third down in three: "They'll need a silent count"). Six clips; the voice tool flagged none of them (the one it
  still flags is "The Iron Sides select...", see 02:30). Measured: intro.road peaks -3.3 dB at -14.7 RMS, a.loud -3.6
  at -13.4, a.hurry beside them -3.1 at -15.6; a road game asked for 85 lines, a.loud among them, none missing.
  Checked: fingerprint unchanged, careers, exhibition, drills, a drawn road game with every pose finite, gait slide
  1 cm, audit empty at 320x568 and 390x844 with and without the 34 px strip.
- 04:27 Automatic run: kick and punt returns for a receiver's career. A receiver is the returner (hub switch "Special
  teams": Return kicks / Offense only, on by default; `C.kr`, passed as `kr` to `startGame`). Their kickoffs are now
  played live in a career when you return (`startCall`), with you as the deep man (`beginKickoff` swaps you and the
  other receiver, so you keep your number, ratings and look) and the "YOU" marker on you. Their punts: the simulated
  drive stops when the computer calls a punt (`simDrives` keeps it as `G.liveP`), the banner says "JAX punt · get
  back deep", and the punt is played live with you fielding it (`asHero` dresses the free safety as you; your hands
  lower the muff chance; Fair catch works as in exhibition; the brief says "Punt return"). Returns are counted
  (`retStat`: kr, kry, pr, pry, krtd), shown on the game line ("6 ret, 97 yds") and in the stats tab, and pay XP
  (2 a kick return yard, 3 a punt return yard, 160 a return touchdown). A fumble on a return that they recover takes
  you off returns for the rest of that game. The play tag reads "Kick return" while one is live. Measured, test bot
  (no steering): 4-6 returns a game, kickoffs about 16 yards a return, punts about 7. Checked: fingerprint
  unchanged, careers (QB and WR), exhibition, drills, a drawn career game with every pose finite, the switch on the
  hub, audit empty at 320x568 and 390x844, no console errors after a reload.
- 05:52 Automatic run: the returner, the rest. Returner trust on the hub under Special teams (`C.rt`, starts at 60;
  after a game `retAfter` adds (kick return yards - 21 a return) / 5 + (punt return yards - 8 a return) / 2.5 + 10 a
  return touchdown, held to -12..+15). A return fumble they recover (`G.my.krf`) costs 20 and sits you down for two
  games (`C.krOut`), trust under 30 for one; back at 40 at least. The results card says so, the hub shows "sitting" and
  how long. League leaders: "Return yards" for a receiver (`CATS.WR` takes a fifth field, the job whose numbers it
  shows; `starter(i, 'KR')` gives every team a returner with about the chances a career returner gets: 2.8-4.4 kick
  returns and 1.4-3 punt returns a game at 3-minute quarters). Career high: kick return yards (`HIGHS.kry`, called
  from 40). Booth: `punt.big` (play-by-play, two takes, for a punt return of 15 or more) and `a.ret.me` (the analyst,
  two takes, after a long return by the career player), recorded on the local Kokoro model; the voice tool flagged
  none. Measured: punt.big peaks -2.6 dB at -14.5 RMS, a.ret.me -3.5 at -15.2, kick.big beside them -3.2 at -16.1; two
  receiver games asked for 131 lines, a.ret.me twice, none missing. Forced test: a return fumble in game 1 took trust
  60 to 36 and sat the receiver for games 2 and 3 (no returns), back in game 4 at 40 and up to 54. Checked:
  fingerprint unchanged, careers (QB and WR), exhibition, drills, audit empty at 320x568 and 390x844, no console errors.
- 06:23 Automatic run: pre-snap motion, the first part. `planMotion(kind)` picks a receiver (X, Z or a slot, six yards or
  more outside the ball, never the ball carrier) and a kind: 'zip' (in toward the formation, sets 1.6 yd off the
  line), 'across' (behind the line to the other side, at the spot with the most room) or 'jet' (85% of his speed, at
  most 8.5 yd/s). He steps back off the line first and passes behind a quarterback under center (3.2 yd deep) or in
  front of one in the shotgun (2.2). `motionStep` moves him in the 'pre' state like `jogIn` does (speed, stride),
  rebuilds his route every frame from where he is (`mkRoute` picks the side from his x, so a man who crossed runs it
  to his new side) and moves the defender who has him in man coverage along with him at his own depth; in a zone
  nobody follows, and a quarterback the user controls gets the read as a toast ("Man coverage · #24 went with him" /
  "Zone · nobody went with him"). At the snap his route is built once more, he keeps his speed, and his alignment
  and his defender's become where they are. The computer's offense and a career receiver's coach use it on 33% of
  snaps (`Math.random`, only when !AUTO, so the fingerprint is identical); the automatic snap waits for him (set, or
  a jet 1.5 yd past the ball; 7 s at most). The user's quarterback has a Motion button (M, controller X), across on a
  pass and a jet on a run, once a play; a career receiver sent in motion reads "You go in motion first" in the brief.
  Measured: in an exhibition the computer moved a man on 5 of 16 snaps (3 zip, 1 across, 1 jet), the man defender
  ended 0.0 yd from him, the jet was snapped 1.5 yd past the ball, snaps came 2.2-4.6 s after the break; a receiver
  career's coach used it on 4 of 10 snaps, twice on the user; every route point finite; a drawn game posed the moving
  man in a stride with every pose finite. Checked: fingerprint unchanged, careers (QB and WR), exhibition, drills,
  audit empty at 320x568 and 390x844 (the snap pad holds five buttons in two rows), no console errors.
- 06:51 Automatic run: pre-snap motion, the second part. Motion is now a path of points (`pts`, `i`), so 'orbit' fits:
  a slot in a shotgun formation with nobody straight behind the quarterback runs in front of him, round behind him at
  about eight yards and back toward his own side; the snap comes as he comes round (point 4 of 6). A zone now slides
  instead of standing still: with no man defender on him, the deep zone players move 2.6 yd toward where he is going,
  the safeties 1.8, the linebackers 1.3, the corners hold (less for a zip or an orbit), zone centres included, in step
  with how far he has gone; the quarterback's read says "Zone · the safeties slid over". The Jet Sweep is run from jet
  motion in every watched game, the user's included: the runner is in motion when the play starts, the snap comes 3.2
  yd before he reaches the quarterback (automatic, whoever is the quarterback), the sweep path drops the points he has
  run past, and the handoff comes as he flies by (within 1.8 yd, or 0.5 s). Measured: 24 user jet sweeps by the test
  bot (no steering) gained 9.9 a carry, the same play simulated without motion about the same (`lab`); in a 10-minute
  exhibition the computer moved a man on 39 of 134 snaps (16 across, 9 zip, 11 jet, 3 orbit), every orbit snapped at
  7.8 yd deep behind the quarterback, the zone slid on every motion without a man defender, the man defender followed
  on 6, every position finite. Checked: fingerprint unchanged, careers (QB and WR), exhibition, drills, audit empty at
  320x568 and 390x844, no console errors.
- 07:20 Automatic run: the formation shift, which finishes pre-snap motion. `planShift` lines the offense up in another
  formation with the same men (single, pistol and slot share theirs; gun, empty and bunch theirs), either way round,
  or in the mirror of the called one, keeping only the men who move 1 to 12 yards (two at least; it tries every
  option and picks one at random). `shiftStep`: once the quarterback has called it and everybody has stopped, they all
  move at once (jog speed held to 3 yd/s and 70% of each man's speed), then set for a full second ('from', 'move',
  'set', 'done'); the corners walk out over whoever is outermost the whole time, at up to 6 yd/s. The computer's
  offense and a career receiver's coach shift on 12% of snaps (a formation that cannot shift sends a man in motion
  instead), and the automatic snap waits for the second set. A career receiver who moves reads "The offense shifts
  first" in the brief. The End Around stays a true end around (the receiver starts after the snap): it is not a
  motion play. Measured, a 10-minute exhibition: 11 shifts on 120 computer snaps (slot to single 3, slot to pistol 3,
  mirrored heavy and trips, bunch or empty to gun, bunch to empty), 2 to 4 men each, set for 1.0 s every time, the
  corners 0.0 yd from the outside men at the snap, every man at his spot; motion on 40 more. Checked: fingerprint
  unchanged, careers (QB and WR), exhibition, drills, audit empty at 320x568 and 390x844, no console errors.
- 07:54 Automatic run: the coin toss call. `G.toss` (`mine`: you are a captain, so every exhibition and season game and a
  career once you start; `coin`, `call`, `win`, `choice`). The toss scene now waits at midfield (`sc.hold`, which stops
  the scene clock) for "Heads / Tails" before the referee flips it, and again after the coin lands if you won it, for
  "Receive / Defer"; the question hides the scene's tap-to-skip layer under it (the audit flagged the two overlapping).
  A scene skipped early, or cutscenes turned off, ask the same questions in a 'toss' state (`tossDone`). The computer,
  and your own captain when you are not one, defer 70% of the time. `tossApply` sets `G.first` (who receives now; the
  second half already kicks to the other side) and respots the kickoff; the matchup card says "won the toss ·
  deferred" or "will receive". The referee's line has a new form, `ref.defer` ("The {team} have won the toss, and have
  deferred to the second half."), recorded for all 32 teams on the local Kokoro model (3.2-3.7 s each, none flagged;
  the pack is 8.2 MB, 832 clips). Measured: ref.defer.ATX peaks -2.8 dB at -18.3 RMS, ref.toss.ATX beside it -3.3 at
  -17.9. Exhibition no longer always opens with you receiving. The test bot calls heads and receives (`H.bot` clicks
  `#tsH` and `#tsR`). Checked: the three outcomes (lost the call: they chose; won and deferred: they receive first;
  won and received), a skip before the call, fingerprint unchanged (simulations keep the old coin), careers (QB and
  WR), exhibition, drills, audit empty at 320x568 and 390x844 including both questions; the console showed only the
  test pane's "AudioContext encountered an error from the audio device" after long runs, as two earlier runs in this
  log noted.
- 08:34 Automatic run: more penalties, the first part. Watched games only (`watched()`: not in simulations, so seeded runs
  are unchanged; `Math.random`, never the game's generator). `finish` is now a wrapper round the old one (`finish0`):
  after the play is settled it enforces a foul the play carried, unless a flag during the play already decided it
  (`ps.flagged`, set by `flagAfter`). Roughing the passer: a rusher within a yard of the quarterback in the half second
  after the release (`ps.rel`, checked in `tick`), 6% of those. Unnecessary roughness: a defender within 1.4 yd of a
  runner who went out of bounds, 10%. Both: fifteen yards (or half the distance) from where the play ended and an
  automatic first down, let go after a score or a turnover (`lateFoul`). Intentional grounding: the computer's
  throw-away from inside the tackle box, 35% (the officials do not always see it): loss of down, back to where he
  threw it or ten yards, the farther (`grounding`). Illegal formation at the snap: 0.4%, five yards on the offense.
  The free play: 1.2% of snaps a defender jumps and the play goes on ("Flag at the snap · free play!"); the state at
  the snap is kept (`freeSnap`: spot, down, score, team stats, your line, the box score, the score log) and afterwards
  the offense chooses: keep a touchdown, take the flag after a turnover or a short gain, keep a first down past the
  five yards; only the real trade-off (more yards and the next down, or five and the down again) is asked, of you
  when you call your offense (a 'decide' state with Accept and Decline, each saying what it gives), and the computer
  keeps a gain of eight or more. Accepting wipes the play from every stat. Seven new referee lines recorded on the
  local Kokoro model (roughing, unnecessary roughness, illegal formation, intentional grounding, "Fifteen yard
  penalty.", "The penalty is declined.", "Loss of down."), none flagged; the pack is 8.3 MB. Measured: ref.rough peaks
  -2.9 dB at -20.0 RMS, ref.fifteen -3.3/-20.3, ref.decl -3.7/-20.1, ref.ground -2.7/-19.6, ref.hold beside them
  -3.0/-21.6. In a game of 15-minute quarters (336 snaps) at the first settings: 4 roughing calls (too many, so 15% became
  6%), 2 free plays, 1 illegal formation; each roughing call moved the ball fifteen past where the play ended with a
  first down. The first version of the roughing check (a defender within 1.3 yd at the release) never fired in 162
  throws, so it moved to the half second after. A staged free play: a 10-yard completion on second down, accepted,
  left first and five, five yards up, with the completion gone from the team stats. Checked: fingerprint unchanged,
  careers (QB and WR), exhibition, drills, audit empty at 320x568 and 390x844 and on the staged question, no console
  errors. A test that forced Math.random to a constant hung the page (a booth take picker loops until it draws a
  different take): never stub Math.random to a constant in this game.
- 08:38 By hand (the owner, awake: "keep working hard"): the rest of the penalties. Facemask: 1.2% of tackles on an
  offensive ball carrier, enforced like roughing (`lateFoul`). Defensive holding: 1.5% of throws to a receiver
  (`ps.dhold`, the state kept at the throw): five yards from the old spot and an automatic first down with the play
  wiped from the stats, or declined when the play was a touchdown or a first down farther on (`defHold`). A
  throw-away for the user's quarterback: an Away button on the pass pad (Z, controller LB) throws it out of bounds;
  from inside the tackle box it can be flagged for grounding like the computer's. Two referee lines recorded
  ("Facemask, defense.", "Holding, defense."), none flagged. Measured in three quarters of 15 minutes: facemask 2,
  defensive holding 1, roughing 2, grounding 1 (the test's own throw-away from the pocket), illegal formation 1, a
  free play 1. Checked: fingerprint unchanged, careers (QB and WR), exhibition, drills, audit empty at 320x568 and
  390x844 with the pane in front (run in a background tab its timers stall and a fading banner is reported on every
  screen), a drawn game with every pose finite; the console showed one three.js "getUniforms" error during the
  audit's viewport switch (a lost graphics context in the test pane; none in a drawn game after a reload).
- 08:50 Automatic run: roughing the kicker, and injuries for a career. Roughing the kicker: 1.2% of punts and field goals
  in watched games (`ps.rk`, the state kept at the kick); the kick and any return are wiped, the kicking team gets
  fifteen yards from the old spot and a first down (`roughKick`); a field goal that was good stands (declined). One
  referee line recorded. Staged: a punt from the 58 became first and ten at the 73 for the punting team. Injuries
  (career.js): after a game 7% of the time you are questionable for the next one (`C.inj`: a sore ankle or tight
  hamstring takes 4 or 5 off speed, a bruised shoulder or jammed finger 4 off arm power, accuracy or hands; `hero()`
  applies it, the next-game card says so, and it clears after that game). The opponent's injury report (`oppInj`,
  drawn from the season, week and team so it reads the same every time): one week in four a starter is out
  (quarterback 4 overall, anyone else 2), shown on the card and taken off their rating for that game. The first seed
  never produced one: this generator's first numbers barely move between neighbouring seeds, so the seed is now
  multiplied through and three numbers are thrown away. Checked: fingerprint unchanged, careers (QB and WR, one game
  played questionable), exhibition, drills, audit empty at 320x568 and 390x844 and on a hub showing both lines.
- 09:19 Automatic run: shaken-up players. After a tackle in a watched game (0.8%, never a career player's own man, two at
  most at once) the ball carrier stays down (`shaken`): the dead ball lasts 2.6 s longer, the clock waits, the banner
  reads "Injury timeout · #29 Nakamura is shaken up · Petrov comes in", and the roster slot is played by a
  substitute (another name and number, 97% of his speed, six points lower) for the next three to six scrimmage snaps
  (`G.hurt`, counted down by `healStep` in `setupPlay`); then the starter is back with a toast and a cheer. Four booth
  lines recorded (`inj.down`, `inj.back`, two takes each), none flagged. Measured: at the first rate (1.2%) a game of
  15-minute quarters had four (a running back twice, a quarterback, another back), each replaced on the field by the
  named substitute and each back within the quarter or two; the rate came down to 0.8%. inj.down peaks -3.3 dB at
  -14.4 RMS, inj.back -3.0 at -16.0. Checked: fingerprint unchanged, careers (QB and WR), exhibition, drills, audit
  empty at 320x568 and 390x844.
- 09:47 Automatic run, the last of the night (a short one): the tackler can be the man shaken up (35% of the time,
  `p0.tackler`), so defenders are replaced too. A game of 15-minute quarters had three: a quarterback and both outside
  linebackers. No screen changed, so the interface audit was not rerun (it was empty at 09:19). Checked: fingerprint
  unchanged, careers (QB and WR), exhibition, drills.
- 17:10 By hand (the owner: "no more additions but focus on improving ui with no regressions"): an interface pass. The
  career hub repeated its settings (difficulty, special teams, quarter length, celebration) under every tab; they are
  now one "Game settings" card that says the current choices and opens on a tap (rendered only when open: a folded
  `<details>` still gave the audit buttons under the ones below it). The hub is about 600 px shorter. The Away button
  on the pass pad is smaller, dashed and set apart from the receiver letters. Checked: fingerprint unchanged, careers
  (QB and WR), exhibition, drills, audit empty at 320x568 and 390x844 including the open settings card, no console
  errors. Until the owner says otherwise: interface work only, no new features.
- 17:23 By hand (the owner: stale cards, "especially if u skip make it work", and the kickoff "more like the normal 3
  point kicks"). Cards: every snap and kickoff has a number (`G.pn`); a card scheduled after a play (`later`: top
  speed, completion probability, a career high, the quarter's team stats, the scores around the league) is dropped if
  the next play has been snapped or the ball is live when its time comes (the league scores wait for the next huddle
  instead). `clearCards` takes the last play's banner and note down when the game moves on (`next`, so also after a
  skipped replay) and everything, the broadcast card too, at the snap. Kickoff: the same timing bar as a field goal
  ("swipe up, or stop in the green"); the green's middle is a deep straight kick, the edges short and wide. The Kick
  button had never worked on a kickoff (the 'pre' check returned before its branch), only the swipe or the 8 second
  timeout did. Measured: stopped in the green the ball came down 8 yards deep in the end zone (touchback), at the
  edge on the 14 and 10 yards off centre; a banner up at the whistle was down by the next snap, with a card forced on
  too. Checked: fingerprint unchanged, careers, exhibition, drills, audit empty at 320x568 and 390x844 and on the
  kickoff bar, no console errors.
- 17:39 By hand (the owner: the press conference "is the same 3 questions and answers every time", and "improve
  character models and field"). Press conference (media.js `press`): each of the three slots now draws from the
  topics that fit the game, each with two or three wordings and one or two answer sets: your day (great, player of
  the game, bad, a grade, two touchdown catches, drops, return yards, interceptions, three touchdown passes, your
  running, accuracy), the game (a loss, a skid, a close one, a blowout, a win, a streak, a road win, primetime, the
  playoffs, playing hurt, a tie; the rival and a role change still come first), and what is next (the next opponent
  six times in ten, where the callouts live, else the fans, the coach, what you are working on, being a rookie, the
  contract, the race). The career passes the facts (`away`, `prime`, `inj`, `streakW`/`streakL`, `season`, `left`)
  and remembers the last seven topics (`C.pressSeen`) so they are passed over while others fit. Five test games
  asked fifteen different questions. Field (render3d `paintField`): the texture is 1792 wide (was 1280), bands mown
  both ways with a light across each, mower lines and more grain, arrows beside the yard numbers, end zones with a
  diagonal weave and edged lettering, the midfield disc inside a second-color ring with edged letters. Figures: the
  number texture is twice the size with a stitched edge, and the shoulder pads carry small numbers (`f.tv`, which
  wear whatever the big number wears). Measured: 60.7 frames a second in the pane, a drawn game with every pose
  finite, gait slide 1 cm and sink 0.2 cm as before. Checked: fingerprint unchanged, careers, exhibition, drills,
  audit empty at 320x568 and 390x844, no console errors. Not done: the body shapes themselves (the skinned body is
  still its own project).
- 18:14 By hand (the owner: "keep going on the body shapes"). The limbs are one recipe each at two finenesses (`mkThigh`,
  `mkShin`, `mkUpperArm`, `mkForeArm`, `mkHips`, `mkNeck`, `cleat(seg)`), so the gameplay model has the close model's
  muscle instead of plain tubes: quadriceps and hamstring on a thicker thigh (0.116 to 0.124 at the top, was 0.108),
  a calf that swells 2.4 cm behind the shin, biceps and triceps, a seat on the hips, real cleats with a toe and heel.
  Both models: the torso tapers harder (waist 0.176, chest 0.247, more chest and back), the neck is thicker, the
  sleeves a little wider for the arm. Joints did not move, so every pose is as it was. Measured: gait slide 1 cm and
  sink 0.2 cm at 8 yd/s (1.5 and 0 at 2), tackle hands 9 cm from the runner with nothing inside him or under the
  turf, block hands 3.5 to 10.5 cm with chests 11 cm apart, the leap as before, a drawn game with every pose finite,
  60.3 frames a second three times (one reading of 44 came straight after a long synchronous test). Checked:
  fingerprint unchanged, careers, exhibition, drills, audit empty at 320x568 and 390x844, no console errors. Still a
  jointed body, not a skinned one: elbows and knees are balls between rigid parts.

- 2026-11-13 20:20. The owner: "allow u to go for it on 4th down instead of field goal, also don't skip over
  opponents plays, show it and allow u to fast forward or skip it". Both are career changes (an exhibition already
  lets you call anything on fourth down, and you play its defense). game.js: `startCall` no longer hands the other
  unit's drives (or a drive you sit out) to `simDrives`; `watchPlay` plays each snap live with nobody under your
  control (`G.watch`, `G.wd` keeps the drive's start for the result line), the snap comes after 1.7 seconds, and their
  kickoffs to a team whose returner is not you are played too. The pad shows Skip drive and Fast fwd (`watching()`,
  pad kinds watch/watchF/watchK/watchKF; keys F and K; controller A and B). Fast forward is three steps a frame and
  no replays, saved as `SET.wff`. `skipDrive` finishes the play in flight unseen and hands the rest to
  `simDrives(own, res)`, which sums the whole drive up as before; on a kickoff it takes the touchback spot. Fourth
  down: when the coach's call is a kick, `ask4th` offers Kick it / Go for it (`G.go4` makes `callPlan` leave the
  kicks out; a quarterback then gets the usual sheet, a receiver gets the coach's play). The test player skips
  watched drives unless `window.H_WATCH` is set, and kicks on fourth down. Checked: fingerprint unchanged; careers
  with every drive watched and with every drive skipped, exhibition, drills, no errors; audit empty at 320x568 and
  390x844 including the new pad and sheet. Ten-game samples put the opponents' scoring in the same range watched or
  skipped (13 to 25 a game). Not judged by eye at real speed: the test pane was hidden and drew a frame now and then.

- 2026-11-13 21:10. Bug test asked for by the owner ("bug test with different careers and such"); no game bug found,
  nothing in the game changed. A random test player ran 4 games for every one of the 32 teams (quarterbacks on the
  odd ones, receivers on the even), watching drives, tapping Skip drive at random moments (before the snap, in flight,
  between plays, on kickoffs), toggling fast forward, and going for it on fourth down between 20% and 100% of the
  time, with every fifth career skipping everything as before. Each step checked the ball spot, down, clock, score
  and every player's position for a bad number, and for a state that stops moving: none. Also clean: games drawn
  every 25 steps (no render errors), one whole season each for a quarterback and a receiver with every drive watched
  (one reached the conference final), two seasons with drives skipped, the play clock running out on the fourth-down
  question (delay of game, then it asks again), and the fingerprint. One thing about the tests themselves: with sound
  on, a page that plays more than about 80 stepped games in a row freezes or crashes, because thousands of sounds are
  started within seconds of real time and never get to finish. It did not happen with `PG.SET.snd = false` and
  `PG.SET.ann = false` (48 games), or in short runs with sound on. Long stepped runs should turn sound off first.

- 2026-11-14 00:30. The owner: "keep improving". Three things on the watched drives, nothing new elsewhere.
  (1) On a drive the coach sat you out for, the man on the field still carried your name and number, in the booth's
  calls and the box score too: `startGame` now keeps the roster's own player at your position as `G.bench`, and
  `setupPlay` puts him in for those drives. (2) The card beside the watch buttons counts the drive (`watchLine`):
  whose it is, the play number and the yards so far; on the sideline it names the backup. (3) The watch pad has its
  two first-time tips (the drive buttons, and the kickoff's Skip), shown with fast forward on as well. Checked:
  fingerprint unchanged; six watched career games with no error and never your name on the field while sitting;
  careers, exhibition, drills; audit empty at 320x568, 375x812 and 390x844.

- 2026-11-14 01:00. The owner: "yes tidy up things now layout and ui". Interface only. (1) Before the snap, Snap is
  now the corner button under the thumb with Audible beside it (it used to sit left of Audible); Flip, Hard count and
  Motion stay in the row above. (2) Career hub: XP to spend and the contract share one row (`.xp2`), the coach's note
  and his word on your press conference are one card, and Practice and Play game sit side by side (`.pg2`), so Play
  game is about 90 pixels higher on the page. Checked: fingerprint unchanged, careers and exhibition clean, audit
  empty at 320x568 and 390x844 (the contract text does not clip at 320).

- 2026-11-14 02:10. The owner: "focus on speed and loading with no regressions". Measured first, then three changes.
  (1) Voices: half of the 8.5 MB pack was the 32 teams' own lines, and a game uses two teams. `tools/voice.py` now
  writes `audio/vo.pack` (the lines every game uses, 4.2 MB) and `audio/vo/TEAM.pack` (about 140 kB each; a clip's
  fifth index entry names its pack). `audio.js`: `booth.loadPack`, `has`, `teams`; `startGame` and draft day ask for
  the teams they need (`PG.audio.voTeams`); a line whose pack has not arrived is left unsaid and the pack asked for;
  a pack that cannot be fetched is retried after twenty seconds and never switches the booth off. A game now
  downloads about 4.5 MB of voices instead of 8.5. The packs were split from the existing recordings byte for byte
  (nothing re-recorded); the one-file build carries all 33 inside it as before. The clips' words left `js/vo.js`
  (nothing read them): 87 kB to 44 kB. (2) Drawing: about 280 of a frame's 400 draws were jersey lettering, one draw
  for each number, name and shoulder number on 48 figures, and the two-sided numbers were drawn twice. Numbers now
  draw in one pass (`forceSinglePass`), and lettering under a pixel and a half tall on screen is left out
  (`writeFigure`, only while the game's own camera draws; `PG.r3d.lodTest(false)` turns it off to compare). From the
  quarterback's view: 400 draws to about 140, and the frame's drawing time on this Mac from about 3.0 ms to 1.0 ms.
  The players' chest numbers stay; what goes is under two pixels. Cutscenes keep every letter (44 of 44 shown).
  (3) `index.html` opens its connections to the font and library hosts early. Checked: fingerprint unchanged;
  careers, exhibition, drills; a watched game drawn every 20 steps with no error; audit empty at 320x568 and 390x844;
  a common line, a team line and a referee line measured at their old levels from both builds; every pack's size and
  three clips from each decoded (99 of 99); a missing pack leaves the booth ready. Not measured: a real phone, where
  the saving in draws should matter more than it does here.

- 2026-11-14 03:20. The owner: "work on proper animations". Two from the Round 21 list, drawing only (`render3d.js`,
  `poseFor`). (1) The quarterback's drop and set. Going back he is turned about sixty degrees to his throwing side
  with the ball up at his back shoulder and his eyes downfield, in crossover steps (`gait.base` cut so the feet
  cross); the steps are counted: the distance to his spot is shared out as three steps from the shotgun, five from
  under center, seven on play action (`f.dropStep`, passed to `stridePhase`; this playbook's quarterbacks all line up
  four to eight yards deep, so in practice it is the three-step drop). When he stops he sets: a throwing base by
  `legIK` (front foot at the target, back foot behind, knees bent, a little bounce), body a quarter open, the ball
  nearer the throwing shoulder. Scrambling forward and the wind-up are as they were. (2) The stiff arm goes to the
  man: the nearest defender on his feet within 2.4 yards who is not behind him. The chest turns part of the way and
  the hand is solved onto his shoulder pad with `armIK`; a man on the right gets the right hand and the ball goes
  under the left arm; with nobody there, or the man behind, it is the old locked-out arm. Measured with everything
  frozen and a defender placed round the runner (`PG.r3d.handOf`): the hand ends 0.4 to 0.6 yards from his chest
  centre at the side and in front (the figures are drawn 1.6 times life size, so that is on his pads), where the
  old arm pointed the same way whoever was there. Something learned: a positive chest turn (`CHRY`) is to his LEFT.
  Checked: fingerprint unchanged (drawing only); gait 1 cm slide and 0.2 cm sink, tackle hands 9 cm, block and
  leaping catch as before; two watched career games drawn every 15 steps (5,743 frames) with no bad pose and no
  error; careers, exhibition, drills. Seen as frame strips from the side and from above, not in motion. Next on the
  list: the toe tap at the sideline, the form tackle as a paired animation, then the skinned body.

- 2026-11-14 04:00. The owner: "keep improving things add more small details". Four, all drawn only and never in
  simulations. After the whistle somebody says it with his arms (`gesture()` in game.js picks the man and stores
  `ps.gest`; `poseFor` draws it from 0.25 to 1.65 seconds after the whistle): a first down, and the nearest teammate
  on his feet (or the runner, if he stayed up) points upfield; a pass broken up, and the nearest defender waves it
  off with both arms; a sack, and a defender beside it flexes. And the quarterback, set in the pocket, pats the ball
  about once a second. In three watched games: 18 points, 5 flexes, 1 wave. Checked: fingerprint unchanged; gait,
  tackle, block and leaping catch as before; two watched career games drawn every 12 steps (6,130 frames) with no bad
  pose and no error; careers, exhibition, drills; audit empty on the career and exhibition games at 390x844. Seen as
  three small stills, not in motion.

- 2026-11-14 05:00. The owner: "research what madden has and add more things from it". Read up on the current
  game's feature list and controls (its career mode's short-term goals, relationships and trade requests; on the
  field: pump fake, quarterback slide, pass protection slides and max protect, hot routes, fake snap). Already here
  under our own names: hot routes, the hard count, motion, the throw-away, trade requests, coach trust, game goals.
  Built now, as plain football and with no names or marks taken: (1) the pump fake (`pumpFake`, Pump on the pass
  pad, B on the keyboard, LT on a controller): 0.42 seconds in which he cannot throw; it is sold to the shortest
  route, and zone defenders near that receiver may drive on him for about half a second (`d.fakeT`, `ps.fake`,
  `zoneAI`), good coverage men less often; once every second and a half; the computer never pumps. (2) the
  quarterback's slide (`qbSlide`, pad kind `carryq` with Slide where Hurdle was, N, controller Y): past the line he
  gives himself up, the ball is dead there, with no fumble and no chance of being shaken up. Drawn in `poseFor` (the
  arm cocks and comes back; he goes down on his back). In a staged test eight pumps drew six bites, a throw was
  refused during the pump and allowed after, and a slide four yards past the line ended the play there. Checked:
  fingerprint unchanged; careers, exhibition, drills; audit empty at 320x568 and 390x844 with the new buttons.
  Not built from the list: pass protection calls (slide left or right, max protect), which need the line's blocking
  assignments reworked; relationships with teammates and fans.

- 2026-11-14 06:30. The owner: "Yes keep working" (pass protection calls). Two things, and the second CHANGES PLAY.
  (1) Pass protection, before the snap on a pass (`protect`, `setProt`, Protect on the pad, O, controller LT): Base,
  Slide left, Slide right, Max protect. A slide re-makes the line calls with every lineman counted 1.6 yards over
  (`lineCalls`, now its own function) and biases free blockers that way; Max protect takes the routes off the backs
  and the tight end so they block, and re-letters the receivers. `PG.dbg.lab(play, n, { prot })` measures a call.
  Seeded, 300 snaps each: a slide changes who comes free (Curl Flat against Man Blitz, sacks 144 base, 133 left,
  125 right; Skinny Post against Man Blitz, 0 base but 121 and 152 with a slide: the wrong slide costs you), and Max
  protect lifts completions against zone (67% to 85% against Cover 3) but can backfire against a man blitz, because
  the men covering the backs come too. The computer and simulations stay on Base.
  (2) Found while measuring: receivers ran two or three yards past every hard break, so a ball thrown to the break
  was "overthrown" every time. In 160 seeded snaps of eight plays the computer completed 1 of 116 hitches, 0 of 42
  in-routes and half its outs; the same throws from a person missed the same way. Fixed in three places:
  `followRoute` throttles down into a sharp turn (and records it as `p.cut`), `lead` charges a break for the ground
  it costs, during it and for 0.7 seconds after. Now hitches 76 of 82, ins 23 of 38, outs 100 of 138. That lifted
  completions in `H.sim` from 57% to 67%, so the base catch chance in `resolvePass` came down from 0.96 to 0.9:
  24 games now give 59% completions, 2.1% interceptions, 16.0 yards a completion, 41.9 points a game (before: 57%,
  1.8%, 15.8, 45.4). An attempt to also pace the receiver to arrive with the ball was dropped: it took completions to
  87%. The fingerprint changed, as it must, was checked to repeat, and was re-pinned (the old one is kept as
  `pg.fingerprint.before-routes` in the test browser). Checked: careers (4 games each), exhibition, drills with the
  usual star counts, audit empty at 320x568 and 390x844 with the sixth pre-snap button.

- 2026-11-14 07:30. The owner: "improve". Max protect did not protect, so it was made to. Timed properly this time:
  `PG.dbg.lab(play, n, { prot, hold: true })` has the quarterback keep the ball and reports how long the protection
  lasted (`t`), who got him (`by`) and whether the extra blockers ever blocked (`extra`). Before: the back kept in
  stood idle on 40 snaps of 40 (every rusher was already "claimed" by a lineman, so he had no man, and when he had
  one he chased him and was run past), and the defenders who had the backs in man coverage followed them into the
  backfield. Now a man kept in (`p.stayIn`) helps on a rusher who is still coming free and meets him two yards in
  front of the quarterback (`blockAI`); of the defenders left with nobody to cover, one in five rushes and the rest
  sit in a short zone (`ps.dogs`, undone when the call changes). Over three plays and six defenses, 80 seeded snaps
  each, protection lasted 2.95 seconds on Base and 3.26 on Max protect; against the Overload blitz 1.8 became 3.2 to
  3.3. The extra blockers blocked on about 95% of snaps. Base protection, the computer and the simulations are
  untouched: fingerprint unchanged. Slides still mostly decide WHICH rusher comes free, not how soon. Also looked
  into white rings seen on the field in test stills: they are the tackle effect, which only expires on drawn frames,
  piling up when a test steps the game without drawing. Not a game bug. Checked: a career game calling Max protect
  and slides on every pass (4 and 9 snaps) with no error; careers, exhibition, drills; audit empty at 390x844.

- 2026-11-14 09:00. The owner: "add more customization of character colors and such, add more to social".
  (1) Your look, a folded card on the career hub (`LOOKS`, `lookHtml`, `C.look`): skin tone (five), gloves (twelve,
  or none), cleats (eleven), socks, visor (dark, clear, mirror, team and four colors), facemask, arm bands (or none).
  No yellow in the lists. `hero()` carries it as `x.look`; render3d.js `lookColors` lays it over the team's kit on
  the field and on the card's portrait (`portrait(team, home, num, look)`); the backup who plays your sat-out drives
  wears the team's kit. Drawing only. (2) Social: a weekly post (`socialPost`: thank the fans for followers, hype
  the next game for hype, shout out a teammate for a point of coach trust; your post lands in Mentions with two
  replies), and a Messages tab (`dms`): each week three direct messages about your last game from home, your agent
  and a teammate, and one from your rival in the week you play him. Messages are flavor; the post is the only part
  that changes numbers. Checked: fingerprint unchanged; a look chosen in the hub seen on the field in a close still;
  a whole receiver season with every drive watched; careers, exhibition, drills; audit empty at 320x568 and 390x844
  with the look card open, the composer, and the four Social tabs.

- 2026-11-14 10:00. The owner: "improve more things add more details". Two, drawn only. (1) A towel: a new optional
  body part (`towel` in `PART_DEFS` and `GEO`, on the pelvis, shown through `f.extra` like the caps and hair) and a
  Towel row in Your look (none, white, black, the team's colors, red, blue, pink). The first version sat inside the
  hips and showed as a sliver; it was moved out. Seen on the hub card and on the field. (2) The toe tap: a pass
  coming down within 2.2 yards of a sideline has the receiver get both feet down together on the field side, up on
  his toes with the heels lifted, leaning out over the line (`f.tap`, set in the catch and blended over his stride
  for a third of a second; `PG.r3d.tapOf(i)` reads it). One in a watched game, seen in a still. Also confirmed, with
  nothing to change: the look already follows the player into the walkout scene, since the actor is made from the
  same roster entry. Checked: fingerprint unchanged; gait, tackle, block and both staged catches as before; careers,
  exhibition, drills; audit empty at 320x568 and 390x844 with the longer look card.

- 2026-11-14 11:00. The owner: "add more small details". Five, drawn only. After the whistle (`gesture`, `ps.gest`):
  a made field goal or extra point and the kicker pumps his fist, a miss and his hands go to his helmet ('pump',
  'aw'); an incompletion that was not broken up and the receiver's hands go to his helmet, always on third or fourth
  down and otherwise about one time in seven (`ps.down0`); an ordinary tackle and, six times in ten, the nearest
  teammate turns to the runner, bends and holds a hand down to him ('help', `ge.to`). Before the snap (`poseFor`, the
  stance block): a shotgun quarterback points out a defender as his cadence starts, to a different spot each play,
  and on two snaps in three the middle linebacker spreads his arms to set his front. In four watched games before
  the receiver's share was cut: 45 helping hands, 36 hands on helmets, 7 fist pumps. Checked: fingerprint unchanged;
  gait, tackle, block and the leaping catch as before; a watched game drawn every 10 steps (3,812 frames) with no
  bad pose and no error; careers, exhibition, drills; audit empty at 390x844. Seen as four small stills.

- 2026-11-14 12:00. The owner: "add more small details". Three on the field, drawn only (`render3d.js`). (1) A
  kicking net: two poles and a net 3.6 yards behind each set of uprights (`g.userData.net`), run up only while a
  field goal or extra point is being tried at that end and gone again for the next play. (2) A kickoff tee: an orange
  tee at the kickoff spot with the ball stood up on it, leaning back toward the kicker, instead of lying on the turf.
  (3) A stiff arm with the right hand now has the ball under the left arm (`f.ballL`): it used to be drawn in the
  hand that was fending the man off. The pass already spiralled and a kick already tumbled, so those were left.
  Checked: the net is up for a staged field goal at the right end only and down after it; fingerprint unchanged;
  gait and tackle as before; a watched career game drawn every 10 steps with no error; careers, exhibition, drills;
  audit empty at 390x844 (a first run reported every button "blocked": that was the test's own overlay canvas).

- 2026-11-14 13:00. The owner: "small details add more in places, add cool cut scenes if possible". Two cutscenes
  in every watched game (`SCENES.half`, `SCENES.final` in game.js; cameras in render3d.js `SCENECAM`), skipped like
  the others in simulations, practice and with cutscenes off. Halftime: both teams jog off toward their own ends,
  seen from high in a corner pulling back, the score and who leads on the caption; then the halftime sheet as
  before (`next()` plays it before `showHalf`). The final whistle: the two leaders (you, in a career, and their man
  at your position) walk to midfield and shake hands while the camera comes in from wide; the winners celebrate
  behind their man, the losers turn and walk off, a tie gets applause from both sides; the home crowd cheers a home
  win, and there is confetti when the win at home is yours; then the final screen (`endGame` plays it before
  `G.onEnd` or `showFinal`). Halftime only shows when the half ends on a play you watch: a half that ends inside a
  skipped drive goes straight to the sheet, as before. Checked: both seen in stills (the first handshake still had
  the teammates out of frame, so they were moved in behind their man); fingerprint unchanged; careers, a whole
  quarterback season, exhibition, season mode, drills; audit empty at 390x844 through all four game types. The test
  tab crashed once after that whole batch had finished and reported; a reload ran clean.

- 2026-11-14 14:00. The owner: "apart from cut scenes, what other small details can u add, and apply them". Five,
  drawn only. (1) Long sleeves in the snow: the arms have their own color key now (`arm`, bare skin unless set), and
  in a snow game about three players in five wear white or black sleeves under the jersey. (2) A Sleeves row in Your
  look (none, white, black, the team's colors). (3) Every quarterback wears a play-call wristband on his left forearm
  (`playband`, an optional part like the towel; `gearOf(p)` picks a player's optional gear). (4) The stadium board's
  bottom line now names the big ones while the play is dead (first down, sack, interception, a kick good or no good,
  fumble, safety, turnover on downs, touchback, pass broken up), not only touchdowns. (5) A hit kicks up a few specks
  of turf with the white ring (snow, when it is snowing). Considered and left: eye black (too small behind the
  facemask to place blind), an official's flag on the turf (the owner's no-yellow rule), breath in the cold.
  Checked: sleeves, the wristband and the linebacker's signal seen in a snow-game still; seven kinds of board message
  came up in one watched game; fingerprint unchanged; gait, tackle and block as before; careers, exhibition, drills;
  audit empty at 320x568 with the longer look card.

- 2026-11-14 15:30. The owner: "add a captains patch ... things do feel a bit cluttered and very text like, though i
  don't want it removed i want more interactive ui with more visuals". Read up on hub design first; the advice that
  kept coming back is progressive disclosure: show what matters now, put the rest one tap away, a card a topic.
  Nothing was removed. (1) Captain's patch: a "C" over a star on the right chest (`f.patch`, `patchMaterial`, hidden
  with the shoulder numbers when too small), worn by each side's quarterback and middle linebacker and by you once
  you start (`p.capt` in `setupPlay`). (2) Career hub, next game: the two teams as badges in their colors with record
  and rating under each (`matchupHtml`), replacing the line of text that carried the same numbers; goals have a
  bullet each. (3) The four tabs have a small picture each (`TAB_ICON`, `.itabs`). (4) Standings (league.js
  `standingsHtml`, so Season mode too): your division is open, the rest of your conference and the other conference
  are folded cards, and last week's other scores are a folded grid of score chips with the winner marked. The Season
  tab went from about 3,300 pixels tall to under 900. (5) Your games is a strip of W/L chips; tap one for its score,
  grade and stat line (`schedHtml`). (6) The trust explanation is a folded line with an (i) (`details.inf`), and
  Edit teams, Ask for a trade and Retire are in a folded Career options card (`#hmore`), like Game settings and
  Your look. The test tools open that card before looking for Retire. Checked with every card opened: the three
  career options, four settings groups, nine look rows, eight division tables, fifteen scores and the game chips are
  all still there. Audit: the first run found the chips 40 wide (now 44), 9 and 9.5 pixel labels (now 10), and the
  longer Snap tip touching the play card in camp at 320 (the sentence added for Protect was taken back out); empty
  at 320x568 and 390x844 after. Fingerprint unchanged; careers, a quarterback season, exhibition, season mode, drills.

- 2026-11-14 17:00. The owner, on doing Stats and Social next: "Yes but improve organization don't automatically
  just hide it with a section thing". So this pass lays things out instead of folding them, and three of the folds
  from 15:30 were taken back out. Stats (`tabStats`): this season's numbers are tiles with the career figure under
  each (`.stl`); the games are a chart of grades, wins in the accent color, over a row a game with the grade as a
  badge (`gamesHtml`); every name on the leader board has a bar as a share of the leader (`ldBar`); the trophies have
  a progress bar and the earned ones come first. Social: messages are a conversation with a round avatar a sender
  (`.chat`), the hype bar has its two thresholds marked under it (25 partners stay, 55 offers come), and followers
  are a line over the last weeks (`folTrend`, from `so.hist`, kept from now on, so it appears after two more games).
  Un-folded: the other seven divisions are small cards two across with record and points for and against (`.dvg`),
  last week's scores are an open grid, the trust explanation is two fact chips and a line, and Edit teams, Ask for a
  trade and Retire are a row of three buttons under a Career heading (the trade still asks twice). Still folded,
  as before today: Game settings and Your look. Checked with counts: 8 divisions, 15 scores, 14 trophies, 10 leader
  categories, every game in the log, and the buttons #edt #ret #trade #hset #hlook #play #prac. Audit: one label
  cut at 320 ("Touchdowns" in a tile; the tiles now say TDs, INTs, Completed), empty after at 320x568 and 390x844
  through every tab and Social sub-tab for both positions. Fingerprint unchanged; careers, a receiver season,
  exhibition, season mode, drills.

### Daytime loop, 2026-11-14 (cron job 735d3840, every 30 minutes until 17:30; the owner is at work 9:30 to 5)
The owner at 02:20: "now work on the game non stop ... every like 5 changes check where u are and what needs to be
worked on, dont add new features or such be faithful to madden and nfl and football, just make it better and more
visually better and such, bug test too and make sure good for mobile". No new features or modes. Each change is
numbered below; after every fifth, a stock-take line says what looks weakest and what the next five are.
Queue (first five): 1 a bug-test sweep after the day's hub work (random players, all four game types, both sizes);
2 the main menu, more visual and better organized; 3 the Upgrade tab's abilities as cards with their state shown;
4 Season mode's hub to match the career's (badges, chips, tiles); 5 a mobile check of load size and draw cost.

- Change 1 (02:40), bug sweep: a random test player played 18 career games on six teams (quarterback and receiver),
  choosing looks at random, tapping every hub tab and Social sub-tab, posting, picking schedule chips, pumping,
  sliding, going for it on fourth down and skipping drives at random, drawn every 40 steps, with the ball spot,
  clock, score and every position checked each step. No error, bad number or stuck state. Nothing to fix.
- Change 2 (02:50), the main menu: each mode has a round picture on the left, and a saved career or season shows the
  badge of the team it is with instead; the four small buttons have an icon each (`MENU_ICON`, `menuBadge`). Nothing
  moved or removed. Audit empty at 320x568 and 390x844; fingerprint unchanged.

- Change 3 (03:05), the Upgrade tab's abilities: the three slots are drawn as slots (what is in each, which are open,
  and the overall rating that opens a locked one), and the abilities are cards two across with the equipped ones
  outlined (`tabPerks`, `.slts`, `.pkg`). Equip and unequip work as before. Audit: a slot's name was cut at 320 (it
  wraps now); empty after at 320x568 with all three slots filled for both positions. Fingerprint unchanged.
  Next: 4 Season mode's hub to match the career's; 5 a mobile check of load size and draw cost; then the stock-take.

- 02:45, asked for by the owner, outside the loop's no-new-features rule: "allow multiple careers / saves and
  eventually we will add multiplayer and a global chat". Careers: up to eight on a device (`career.js`: `SLOTS`,
  `stash`, `switchTo`, `dropSave`, `showSaves`). The career being played stays under `pg.career.v1` as before; the
  others wait whole under `pg.career.slot.<id>` with a list of summaries in `pg.career.slots`, so nothing that reads
  or writes the career had to change. The hub's Career row has a Careers button; the screen lists each one (team
  badge, player, rating, where the season stands) with Play or Continue and a two-tap Delete, and New career, which
  puts the current one away instead of replacing it. The new-career screen links back to the list, and the menu's
  Career opens the list when nothing is being played but careers are saved. Erasing or retiring removes that
  career's slot only. Checked: two and three careers made, switched (the first came back with its XP and game log
  intact), one deleted, one erased; the test tools start a new career through the list; fingerprint unchanged;
  careers and exhibition clean; audit empty at 320x568 and 390x844.
  NOT started, for the owner to decide: multiplayer and a global chat. Both need a server that every player's phone
  talks to (the site is static files on GitHub Pages and cannot hold a connection or a message), so they mean
  choosing and paying for a hosted service, accounts or at least names, and for chat, moderation of what strangers
  type. Head to head could instead be two phones linked directly with no server beyond a free relay for the
  handshake. These are his calls; nothing is to be signed up for or connected without him.

- 03:00, the owner on multiplayer and chat: "i'll do that tmr just set it up for that". Set up, not switched on:
  `js/online.js` (loaded last; `PG.online`) holds what does not depend on the service: an online name and id kept on
  the device, the rules for a chat line (plain text, 140 characters, links removed, one every 2.5 seconds), and the
  adapter a service plugs into (`use`, `connect`, `chat.send/on`, `match.host/join/send/on`). It makes no network
  call and has no screen; with no adapter `ready()` is false and sends are refused. Tested with a fake adapter.
  `docs/ONLINE.md` is the decision sheet for him: phone-to-phone head to head (PeerJS 1.5.5 is on cdnjs) against a
  hosted service, the chat services whose libraries are on cdnjs (firebase 13.3.0, ably 2.30.0, pusher 8.6.0; their
  limits and prices were NOT checked), names against sign-in, and moderation. Nothing was signed up for.

- Change 4 (03:20), Season mode's hub, to match the career's: the next game as two team badges with record and
  rating; pictures on the four tabs; the schedule as a row a game (a W or L badge and the score for the ones played,
  the week's number, opponent's rating and record for the ones to come); the team's totals as six tiles with the
  per-game figure under each. Roster and Start over as before. Audit: "Points against" was cut in a tile (the tiles
  say Points, Allowed, Pass yards, Rush yards); empty after at 320x568 and 390x844. Fingerprint unchanged.
  Next: 5 a mobile check of load size and draw cost; then the first stock-take.

- Change 5 (03:30), a mobile check, measured, nothing changed. Load: the page's own files are 1,004 kB, 318 kB
  compressed (game.js 103, render3d.js 69, career.js 42, audio.js 27), plus the library from cdnjs and, after the
  page is up, the 4.2 MB common voice pack. Drawing at 390x844 on this Mac: 117 to 151 draws and about 339,000
  triangles in play (0.7 to 2.2 ms a frame); cutscenes and the kickoff swap in the close-up model and reach 537,000
  triangles at 105 to 178 draws. Triangles at that level are within what current phones draw; the draws were the
  cost and they came down on 2026-11-14. No change made. Not measurable here: a real phone.
- STOCK-TAKE after five (03:35). Done: a clean bug sweep; the main menu, the abilities, and Season mode's hub made
  visual; load and draw cost measured. Also today outside the loop: multiple careers, the online groundwork.
  Weakest now, by eye: (a) the halftime and final sheets are tables of numbers; (b) the play-call sheet and the
  pause and settings screens have not had the visual pass; (c) Exhibition and Season have had no random bug sweep
  since the new cutscenes and the watched kickoffs; (d) the field and stadium have not been looked at in day, dusk,
  rain and snow since the repaint; (e) the close-up model draws all 48 figures in full detail in a cutscene that
  shows six.
  Next five: 6 the halftime and final sheets as side-by-side team bars; 7 a random bug sweep of Exhibition and
  Season (kicks, onside, two-point tries, overtime, cutscenes on and off); 8 Settings and the pause sheet organized
  visually; 9 a look at the field and stadium in each time of day and weather, fixing what looks off; 10 in a
  cutscene, the bench figures drawn with the plain model or not at all.

- Change 6 (03:50), the halftime and final sheets: the table of team numbers is now the two teams side by side, a
  line a stat (total, pass and rush yards, completions, turnovers) with a bar under it split by their shares in the
  teams' colors (`statTable`, `.stb`); Season and Career result screens use the same function. Total yards is new
  on the sheet (the sum of the two it already showed). Audit empty at 320x568 and 390x844 through Exhibition,
  Season and Career games; fingerprint unchanged. Next: 7 a random bug sweep of Exhibition and Season.

- Change 7 (04:05), a bug sweep of Exhibition and Season: a random player played 11 exhibition games across 22
  teams (one- to three-minute quarters, all three difficulties, day, dusk and night, clear, rain and snow,
  cutscenes on in half), picking random tabs and cards, going for two, pressing every pre-snap and in-play key at
  random and mistiming kicks, drawn every 50 steps with the ball spot, clock, score and positions checked each
  step; two went to overtime. Then three Season games through the audit. No error, bad number, stuck state or
  audit finding. Nothing to fix. The onside-kick sheet never came up (the random player was rarely close late).
  Next: 8 Settings and the pause sheet organized visually.

- Change 8 (02:55 by the clock; the times on changes 1 to 7 above ran about an hour fast), Settings: each group of
  rows (Look, Sound, Rules, League, Help) is one card, and every On / Off setting is a switch with its word beside
  it (`chip` in `showSettings`, `.grp`, `.tog`); the settings with more than two values stay chips. All twenty
  controls are still there under the same ids. The pause sheet was left as it is (four buttons). Audit empty at
  320x568 and 390x844. Next: 9 the field and stadium in each time of day and weather.

- Change 9 (03:05), the field and stadium in each light and weather: day, dusk and night in clear, rain and snow
  were drawn side by side. One thing was off: in the rain the light towers' reflection on the turf was a patch of
  blocks, because the wet surface's ripples came from the lattice noise and its cells showed through the tight
  highlight. The ripples are sums of sines now and the highlight a little wider and softer (`shaders.js`, the turf's
  `uWet` branch): a soft sheen. The rest read correctly (snow dusting, dusk sky, rain streaks, the board) and was
  left alone. A rain game drawn every 30 steps gave no shader warning or error; fingerprint unchanged; audit empty.
  Next: 10 in a cutscene, lighter bench figures; then the stock-take.

- Change 10 (03:15), lighter cutscenes: a cutscene sent all 22 player slots to the graphics card in the close-up
  model even when it had seven actors (the empty slots were shrunk to nothing, but their vertices were still
  worked out). It now sends only its actors and the benches (`active` in `render`). Triangles in a frame: coin toss
  535,932 to 345,782; walkout 397,688 with 11 actors; halftime 254,372; final whistle 435,248. All four seen in
  stills, the referee and both lines of captains present. Fingerprint unchanged; audit empty.
- STOCK-TAKE after ten (03:20). Since the last one: team bars on the halftime and final sheets, a clean bug sweep of
  Exhibition and Season, Settings as cards and switches, the rain reflection fixed, lighter cutscenes. Outside the
  loop: nothing new. Weakest now, by eye: (a) the career's post-game screens (result, grade, goals, XP) are lists
  of text; (b) the play-call sheet and the in-game pause sheet have had no visual pass; (c) the seasons after the
  first (awards night, offseason, contract offers, a trade, retirement and the hall) have had no random bug sweep
  since the hub was rebuilt and careers got slots; (d) training camp's result screens; (e) How to play is a wall of
  text.
  Next five: 11 the career's post-game result as a visual summary (grade badge, goals ticked, XP bar); 12 a random
  bug sweep through whole careers with slots: seasons, awards, offers, trades, retirement, switching careers
  mid-way; 13 the pause sheet (score, switches for sound and commentary); 14 How to play laid out as cards with a
  small picture each; 15 training camp's results (stars and the rep list) made visual.

- Change 11 (03:25), the career's post-game result: it opens with the grade as a badge (in the accent color for a
  win), the score with Win, Loss or Tie, and your line, then two chips (XP earned, coach trust and its change), then
  the news line; the goal ticks and the XP list follow as before (`.rs`, `.rsn`). The trust sentence that was at the
  foot is the chip now. Audit empty at 320x568 and 390x844; fingerprint unchanged; careers clean. Confetti seen over
  a loss in the test still is the test's own leftover (confetti only falls on drawn frames), not the game.
  Next: 12 a random bug sweep through whole careers with slots.

- Change 12 (03:40), a bug sweep through whole careers with slots: a quarterback played five games; a second career
  (a receiver) was started beside him and played two whole seasons, with awards night and a contract offer taken at
  random; the quarterback was brought back (week, game log and XP as he was left), finished his season, asked for
  and got a trade, played a game for the new team, and retired to the hall of fame vote; the receiver's career was
  then opened from the list and deleted. No error at any step, and the slots list was right throughout. One thing
  polished: with nothing being played but careers saved, the menu's Career card now says how many are saved instead
  of inviting a first career (`summary()`). Audit empty at 320x568; fingerprint unchanged.
  Next: 13 the pause sheet; 14 How to play as cards; 15 training camp's results; then the stock-take.

- Change 13 (03:40), the pause sheet: it opens with where the game stands, drawn as a scoreboard (both badges, the
  score, each side's time outs as dots, the quarter and clock between them, down and distance under), or the drill's
  name and reps left in a drill; Sound and Commentary are switches in one card instead of two "Sound: on" buttons
  (`pauseTop`, `sw`, `.pzs`, `.tod`). Resume, the goals list and Leave as before. Switches and the leave dialog
  exercised; audit empty at 320x568 and 390x844; fingerprint unchanged.
  Next: 14 How to play as cards with a small picture each; 15 training camp's results; then the third stock-take.

- Change 14 (03:55), How to play: every tip is a card with a small drawn picture and a two-word name (25 cards in
  Every play, Offense, Defense, Career, each sentence kept as it was); the keyboard and the controller are key caps
  two across instead of one long sentence, and the caps now also list pump fake (B), slide (N) and protection (O),
  which were bound but not written down; six chips at the top jump to a section, nothing is folded (`HOW`,
  `HOW_ICON`, `HOW_KEYS`, `HOW_PAD`, `.hw`, `.kc`, `.hwj`). Audit empty at 320x568 and 390x844; fingerprint unchanged.
  Next: 15 training camp's results; then the third stock-take.

- Change 15 (04:10), training camp: the camp screen has a nine-dot star meter and each drill is a card with a
  picture and its best result; a drill's card numbers the steps and shows the three star marks as tiles; the result
  screen has large stars over a bar that fills to the score with a tick at each mark, and the reps are numbered rows
  with a green or gray disc (`marksBar`, `dIcon`, `.mkb`, `.rps`, `.cmt`, `.mk3`, `.stp`). Audit empty at 320x568 and
  390x844; fingerprint unchanged. The result screen was checked by the audit only, not looked at in a still.
  NOT done: the third stock-take (the session's usage limit was reached). Do it first on the next run.

- Third stock-take (04:25), after fifteen changes. Changes 11 to 15: the career post-game badge, a whole-career bug
  sweep (clean), the pause sheet as a scoreboard with switches, How to play as tip cards and key caps, and training
  camp's three screens (the result screen has since been looked at in a still at 320x568: stars, the marks bar and
  the numbered reps read correctly). Every screen reached from the menu has now had a pass except the ones a game
  ends on. Weakest now: (a) the final-score sheet in exhibition and season still uses the old three-column text
  table and a bare "21 – 14", while halftime has the split bars: the two should match and both should open like a
  scoreboard, with the points by quarter; (b) the exhibition set-up screen is five rows of text buttons; (c) the
  scoring summary and game leaders under those sheets are plain lines; (d) no bug sweep has been aimed at the rare
  endings (overtime, onside kick, two-point tries, challenges, fourth-down tries) since the watched drives went in;
  (e) load and draw cost have not been measured since change 5.
  Next five: 16 the halftime and final sheets (scoreboard header, points by quarter, split bars on both); 17 the
  scoring summary and leaders as badge rows; 18 exhibition set-up with pictures for time and weather; 19 a bug sweep
  of rare endings across random teams, QB and WR; 20 a second mobile measurement; then the fourth stock-take.

- Change 16 (04:40), the halftime and final sheets: both open like a scoreboard (the two badges with the score under
  each, the winner's ringed at the final) over the points by quarter (`finTop`, `.ftp`, `.lsc`; an overtime column
  appears when there was one). The final sheet in exhibition and season now uses the same split bars as halftime
  instead of the old three-column table. The line score was checked against the totals in a played game.
- Change 17 (04:45), scoring plays and game leaders: each is a row with the team's badge in its color, a small label
  (quarter and kind, or Passing / Rushing / Receiving), the play or the player, and the figure on the right (`tch`,
  `.evs`). Same information as before; it also shows on the career and season result screens. Audit empty at 320x568
  and 390x844 over menus, exhibition, season, career and camp; fingerprint unchanged.
  Next: 18 exhibition set-up with pictures for time and weather; 19 a bug sweep of rare endings; 20 a second mobile
  measurement; then the fourth stock-take.

- Change 18 (04:55), exhibition set-up: the kickoff time and weather choices carry a small picture each (sun, sun on
  the horizon, moon; clear sky, rain cloud, snowflake) and difficulty has one, two or three bars (`ENV_ICON`,
  `.seg.pic`, `.lvl`). Same choices, same words. Audit empty at 320x568 and 390x844; fingerprint unchanged.
  Next: 19 a bug sweep of rare endings across random teams, QB and WR; 20 a second mobile measurement; then the
  fourth stock-take.

- Change 19 (05:10), a bug sweep of rare endings, nothing in the game changed. A rougher test player was written
  for it, `tools/chaos.js` (`X.exh(n, ql)`, `X.career(pos, n)`): it goes for it on fourth down, tries for two, kicks
  onside, challenges, calls time out, declines free plays, picks random cards from every tab, ties the score late in
  the fourth quarter so overtime is played, and after every step checks that the line of scrimmage, clock, distance,
  score and every player's position are still numbers. Run: 25 exhibition games on random teams, times and weather
  (1, 2 and 3 minute quarters, three of them with every opponent drive watched) and 28 career games as QB and WR on
  random teams. Seen: 21 overtimes, 22 two-point tries, 30 fourth-down tries, 4 challenges, 127 time outs, about 470
  random cards. No errors, no game that failed to end, no bad numbers. Not reached: an onside kick and a declined
  free play (both need a rare situation the test did not meet). One false alarm: careers that ended tied with no
  overtime were the test tying a game that was already over; the test now leaves a finished game alone.
- Change 20 (05:15), a second mobile measurement, nothing changed. Load: the page's own files are 1,025 kB, 324 kB
  compressed (up 21 kB and 6 kB since change 5, from the interface work), plus the 4.2 MB common voice pack after the
  page is up. Drawing at 390x844 on this Mac, one exhibition half: before the snap and in play 108 to 208 draws and
  about 340,000 triangles (2.2 to 2.7 ms a frame); cutscenes 108 to 126 draws and 253,000 to 346,000 triangles (down
  from 537,000 before change 10); the instant replay 97 to 179 draws but 612,000 triangles, the heaviest moment left.
- Fourth stock-take (05:15), after twenty changes. Changes 16 to 20: the halftime and final sheets, scoring and
  leader rows, exhibition set-up pictures, the rare-endings sweep (clean) and the measurement. The interface pass is
  complete: every screen has been redrawn or checked today. Weakest now: (a) the instant replay sends the close-up
  model for all 22 players (612,000 triangles) when the camera is on two or three of them; (b) the on-field picture
  has had one check today (change 9) and the players, sidelines and crowd none; (c) the play-call sheet and the
  in-game HUD chips have not been looked at for clutter; (d) season mode's playoff bracket and the league screens
  were only audited, not looked at.
  Next five: 21 the replay's close-up models only for players near the ball; 22 a look at the players and sideline
  in stills, day and night, fixing what is off; 23 the play-call sheet at 320 wide; 24 the playoff bracket and
  league screens in stills; 25 a bug sweep of season mode through the playoffs; then the fifth stock-take.

- Change 21 (05:40), a lighter instant replay: the close-up model used to be swapped in for every figure at once,
  the twenty on the benches included. The players, officials and chain crew now have their own close-up meshes that
  read the same matrices and colors (a view on the same arrays from the slot after the last bench figure, `p.hi` in
  `render3d.js`), so the benches stay on the light model when the camera comes in. Replay: 612,000 triangles down to
  499,000 at most; cutscenes 346,000 down to 231,000. Looked at in a replay still (close-up players, numbers, names,
  shadows and the bench behind them all drawn). Audit empty at 320x568 and 390x844; careers, exhibition, season and
  camp clean; fingerprint unchanged.
  Next: 22 the players and sideline in stills, day and night; 23 the play-call sheet at 320 wide; 24 the playoff
  bracket and league screens in stills; 25 a season-mode bug sweep through the playoffs; then the fifth stock-take.

- Change 22 (06:00), the players and sideline in stills, nothing changed. Looked at from a low camera: the bench in
  day and at night, the quarterback and his line from behind, a linebacker from in front and from above (his shadow
  in daylight), the huddle side at night under the towers. Numbers, names, helmets, stripes, skin tones, shadows and
  the board all drew correctly. One thing that looked wrong was not: a team in pink helmets and pants has pink as
  its second color. Left as is: the bench figures stand in one row in the same pose.
- Change 23 (06:05), the play-call sheet at 320 wide, nothing changed: six tabs, three cards with their drawings,
  the pick tags and the page bar all fit and read.
- Change 24 (06:15), the playoff bracket: each slot has the team's color dot and its seed set apart from the name,
  the winner in bold and the loser's dot dimmed; the narrow later rounds show the abbreviation, so no name breaks in
  the middle of a word at 320 wide, and an undecided slot says TBD (`bracketHtml`, `.gm`). The first column is wider
  for full names. Looked at with a made-up finished bracket of the longest team names; audit empty at 320x568 and
  390x844 over menus, season, career and exhibition; fingerprint unchanged. The standings and league screens were
  redone in changes 2 and 4 and were not touched.
  Next: 25 a season-mode bug sweep through the playoffs; then the fifth stock-take.

- Change 25 (06:45), a season-mode bug sweep through the playoffs. `tools/chaos.js` gained `X.season(n, rig)`: whole
  seasons on a random team with the rough test player; rig 'win' gives your side three touchdowns late, 'potie' wins
  the regular season and ties every playoff game late. After every game the league table must add up (wins equal
  losses, points for equal points against) and at the end the bracket must be settled and its winner the champion.
  Run: eight seasons, about 100 games, one title, exits in the divisional round and the conference final, six playoff
  overtimes. One fault found, and it was mine from change 16: a playoff game still level after four overtimes is
  settled off the field by a field goal to one side (as before), but the new scoreboard header on the final sheet
  read the scoreboard and showed the level score while the header said who won. `finTop` now takes the recorded
  score and puts the difference in the last period. Checked directly, and the sweep now compares the sheet with the
  recorded score after every game. Audit empty at 320x568 and 390x844; fingerprint unchanged.
- Fifth stock-take (06:45), after twenty-five changes. Changes 21 to 25: the lighter replay, stills of the players,
  sideline and play-call sheet (nothing to fix), the playoff bracket, and the season sweep (one fault of today's
  own, fixed). Bug sweeps today: careers with save slots, rare endings, and whole seasons; all clean apart from that
  one. Weakest now: (a) the bench figures stand in one row in one pose; (b) the career hub and its tabs have not
  been looked at in stills since the pause, result and camp screens changed around them; (c) the in-play messages
  (toasts, banners, the broadcast cards) have not been checked for overlap at 320 wide; (d) a declined free play
  has now been seen, an onside kick still has not; (e) whole careers as a receiver have had fewer games than
  quarterbacks today.
  Next five: 26 the bench: a few poses and uneven spacing; 27 the career hub's five tabs in stills at 320 and 390;
  28 toasts, banners and broadcast cards at 320 wide; 29 an onside kick forced and watched through; 30 whole receiver
  careers with the rough test player; then the sixth stock-take.

- Change 26 (07:05), the benches: the reserves stood evenly spaced, square to the field. Now each stands up to a
  yard off his mark along the sideline and a foot or so nearer or farther, turned a little his own way, and one or
  two of those who do not pace take a knee to watch (the kneeling pose the game already had; heads still follow the
  ball, and everyone still gets up to celebrate a score). `window.PG_KNEEL = 1` before a game makes every one of
  them kneel, for looking at the pose. Looked at in day stills of the home bench, standing and kneeling. Audit empty
  at 320x568 and 390x844; exhibition, career and camp clean; fingerprint unchanged.
  Next: 27 the career hub's five tabs in stills; 28 toasts, banners and broadcast cards at 320 wide; 29 an onside
  kick forced and watched through; 30 whole receiver careers with the rough test player; then the sixth stock-take.

- Change 27 (07:30), the career hub's tabs in stills at 320 wide, after a three-game test career. Four small faults
  fixed: (1) the header's one long line ran to four lines; it is now "#9 · QB · age 22", the team and season, and
  chips for the archetype, depth-chart place, titles and honors (`.pcc`); (2) on the Social tab the two notes under
  the hype bar ran into each other ("partners stay|55"): they read "25 · partners" and "55 · offers"; (3) the label
  "Followers" was 4 pixels wider than its tile: the four tiles have a little more room; (4) dark team colors
  (navy, black) were invisible as dots on the standings cards and score chips: the dots have a faint ring. Upgrade,
  Season and Stats read correctly and were left alone. Audit empty at 320x568 and 390x844 over menus, career,
  season and exhibition; fingerprint unchanged.
  Next: 28 toasts, banners and broadcast cards at 320 wide; 29 an onside kick forced and watched through; 30 whole
  receiver careers with the rough test player; then the sixth stock-take.

- Change 28 (07:35), in-play messages at 320 wide: on a 568-tall screen a toast (18.5% down, 105 px) sat on top of
  a broadcast card (80 to 150 px). Toasts now sit at least 157 px down and banners at least 190, so the three stack:
  card, toast, banner (measured with all three shown: 80-150, 157-182, 196-257). No change on taller screens. Seven
  different toasts in a half fitted without clipping. Audit empty at 320x568 and 390x844; fingerprint unchanged.
- Change 29 (07:40), an onside kick forced and watched through, nothing changed: three games in which the test's
  side was put on the goal line trailing by ten late, scored, and chose the onside kick from the kickoff sheet. Two
  were lost, one recovered; the ball, the possession, the banner and the rest of each game were right, and the
  kickoff sheet passed the audit.
- Change 30 (07:45), receiver careers with the rough test player, nothing changed: four careers of six games on
  random teams (29 fourth-down tries, 7 overtimes) and one whole receiver season with every opponent drive watched
  (9-1, lost in the divisional round, eight trophies, kick and punt returns included). No errors, no bad numbers.
- Sixth stock-take (07:45), after thirty changes. Changes 26 to 30: the benches, the career hub at 320 wide, the
  in-play messages, the onside kick and the receiver careers. Every rare ending listed in the fourth stock-take has
  now been seen. Weakest now: (a) the crowd and stands are flat color flecks close up, and have not been looked at
  from the play camera at dusk; (b) the menu's first screen and the new-career screen have not been looked at in
  stills today; (c) the kick meter and the swipe hint; (d) the result of the press conference and awards night
  screens (text-heavy); (e) the README has not been checked against today's changes.
  Next five: 31 the menu and new-career screens in stills; 32 the press conference and awards night screens laid
  out with less text; 33 the kicking screens (meter, swipe hint, kickoff sheet) in stills; 34 the stadium at dusk
  from the play camera; 35 the README against today's changes; then the seventh stock-take.

- Change 31 (08:05), the menu and new-career screens in stills at 320 wide. Menu: the Season card with no season
  saved still said "seven games" (a season has been ten since the league grew): corrected; "Milestones · 12 of 12"
  ran to two lines in its button and reads "Milestones 12/12"; the training camp card ran to three lines and reads
  "Three short drills · 9 of 9 stars" once any star is earned. New career: each build's four ratings were a line of
  text; they are four small bars with the number beside each (scaled 50 to 100, the chosen build's in the accent
  color), and the build's overall sits at the right of its name (`.abs`). Audit empty at 320x568 and 390x844;
  careers at both positions, camp and exhibition clean; fingerprint unchanged.
  Next: 32 the press conference and awards night screens; 33 the kicking screens in stills; 34 the stadium at dusk
  from the play camera; 35 the README against today's changes; then the seventh stock-take.

- Change 32 (08:25), the press conference at 320 wide. The question screen already read well (reporter card, an
  answer a card with its tone chip); the paragraph under it explaining what the tones do is now a legend of the tone
  chips themselves with an arrow each: Humble and Team first, trust up; Confident and Trash talk, hype up and trust
  down unless you play like it; a callout follows you into the next game (`.tlg`). On the summary screen the line
  "Coach trust +6 (now 54) Hype +1 Followers +4" is three tiles, each with the change large and the new total
  under it (`.fx3`). Looked at in stills for a humble and a trash-talking set of answers. Audit empty at 320x568
  and 390x844; careers clean; fingerprint unchanged. NOT looked at: awards night (it needs a finished season; the
  audit walks it, and it was left as it is).
  Next: 33 the kicking screens in stills; 34 the stadium at dusk from the play camera; 35 the README against
  today's changes, and awards night in a still; then the seventh stock-take.

- Change 33 (08:40), the kicking screens at 320 wide. The hint over the meter ("45 yards · swipe up, or stop in the
  green") wrapped with one word left on a second line, on every kind of kick. It is two short lines by design: what
  is being kicked in bold, and under it "Swipe up, or stop in the green" (`kickHint`). Seen on a field goal and a
  punt; the kickoff and the extra point use the same code and were not seen in a still. The meter, the Kick button
  and the play tag were right. The kickoff sheet was audited in change 29.
- Change 34 (08:45), the stadium at dusk from the play camera, nothing changed: stands, ribbon boards, the video
  board, routes and letters all read at 390x844.
- Change 35 (08:50), the README: a paragraph for today's screen work and the benches, and the rough test player in
  the testing section. Awards night was NOT looked at in a still (it needs a finished career season).
- Seventh stock-take (08:50), after thirty-five changes. Changes 31 to 35: menu and new-career, the press
  conference, the kick hint, a dusk check and the README. The day so far: every screen redrawn or checked, the
  replay and cutscenes made lighter, four bug sweeps (one fault, today's own, fixed). What is left is small:
  (a) awards night and the offseason screens (contract, trade, retirement) in stills; (b) the extra point and
  kickoff hints in a still; (c) the 2D classic view has had no look today; (d) the settings switches on a
  controller (focus ring) have not been tried; (e) the bundle and the live site should be compared once at the end.
  Next five: 36 the offseason screens in stills after a whole career season; 37 the classic 2D view, one game and
  its screens; 38 controller focus on the new switches, cards and tiles; 39 extra point and kickoff hints in a
  still; 40 a last full regression (all modes, both sizes, the three sweeps) and a check of the bundle; then the
  eighth stock-take.

- Change 36 (09:10), the offseason screens at 320 wide, after a whole test season as a quarterback. Awards night
  (a card an award, nominees, then the winner with team and line, yours ringed with its XP) and the contract offers
  (a card a team with its color, terms and rating) read well and were left alone. The hub's "Season complete" card
  had its facts in one paragraph: they are three tiles (your team's record, the champion, the bonus XP), the honors
  as chips, and the rival line and your season line under them (`.sdn`). The button "Your contract is up · see the
  offers" ran to two lines: it is a short note and "See the offers". The contract flow was then run through twice
  more by the test player (two receiver seasons, one quarterback season with a re-signing). Audit empty at 320x568
  and 390x844; fingerprint unchanged. Not looked at in stills: the trade and retirement screens (audited only).
  Next: 37 the classic 2D view; 38 controller focus on the new switches, cards and tiles; 39 extra point and kickoff
  hints in a still; 40 a last full regression and a check of the bundle; then the eighth stock-take.

- Change 37 (09:30), the classic 2D view, nothing changed: switched on in Settings, an exhibition and a career game
  played through with it and audited at 320x568 (clean), the field looked at in a still with a broadcast card and a
  toast up together (they stack as in 3D). Switched back to 3D afterwards.
- Change 38 (09:35), controller focus on today's controls, nothing changed: the controller's ring moves between
  buttons, inputs and selects, so every screen was scanned for anything tappable that is not one of those (Settings,
  How to play, camp, the career tabs and saves, the season tabs, exhibition set-up, the play-call sheet, the pause
  sheet): none. The switches are buttons. Not tried with a real controller.
- Change 39 (09:40), the extra point and kickoff hints, nothing changed: both seen at 320 wide on two lines (217 by
  43 px, the same as the field goal's), the kickoff in a still.
- Change 40 (09:55), a last full regression. Menus and all four modes audited at 320x568 and 390x844: empty.
  Fingerprint unchanged; six simulated games in range (5.0 yards a carry, 56% complete, 40.2 points). The rough test
  player: exhibition, quarterback and receiver careers, a rigged season through a playoff overtime: clean. The
  single-file bundle loaded on its own, gave the same fingerprint and played an exhibition and a career game. One
  fault in the test tool, not the game: the rough player counted a game as over at the final whistle and moved on
  while the closing cutscene was still playing, so the next test's screen was replaced by the result sheet; it now
  waits for the result screen.
- Eighth stock-take (09:55), after forty changes. Changes 36 to 40: the finished-season card, and four checks that
  found nothing in the game to fix. The queue of known weak spots is empty. What remains is taste and depth, which
  are the owner's to steer, and three things only a person with the device can judge: a real controller on the new
  switches, sound on a phone speaker, and the frame rate on an actual phone. From here the loop does lower-yield
  work: 41 the trade and retirement screens in stills; 42 the hall of fame and milestones screens in stills;
  43 team editor (names and colors) at 320 wide; 44 rain and snow games through the rough test player; 45 a second
  look at the play-call sheet's Special tab and the two-point sheet; then the ninth stock-take.

- Change 41 (10:05), the trade and retirement screens at 320 wide. A trade is two taps on the hub's Career row
  (the button turns to "Confirm trade" with a line saying which team and what place): read well, left alone. The
  retirement screen ("Career so far") had two lines of facts as text: the career's titles, honors, XP and salary are
  four tiles, and the five parts of the hall of fame score are chips with the points each gives (`.fmp`).
- Change 42 (10:10), milestones and the hall of fame at 320 wide. Milestones (twelve cards two across) read well,
  left alone. The hall of fame's plaques sat flush against each other and against the line above: they have room
  between them, and each one's seasons, games, titles and retiring age are chips under its line. Audit empty at
  320x568 and 390x844; careers clean; fingerprint unchanged.
  Next: 43 the team editor at 320 wide; 44 rain and snow games through the rough test player; 45 the Special tab and
  the two-point sheet; then the ninth stock-take.

- Change 43 (10:30), the team editor at 320 wide: laid out well (team card, four fields, two color wells, the list
  of teams). One wrong label: opened from a career it said "‹ Settings" on a button that goes back to the career;
  it says "‹ Back" there and "‹ Settings" only when opened from Settings.
- Change 44 (10:40), rain and snow through the rough test player, nothing changed: `X.exh(n, ql, wx)` can now force
  the weather; six games each in rain, snow and clear weather on random teams, two-minute quarters: no errors, no
  bad numbers, an onside kick among them.
- Change 45 (10:50), the Special tab and the after-touchdown sheet at 320 wide. Special (field goal, punt, kneel,
  spike) reads well, left alone. After a touchdown the two choices were stacked and the second ran to two lines:
  they are two buttons side by side, as on the fourth-down sheet ("Kick it · extra point, 1" and "Go for two · one
  play from the 2"); a two-point try was then played through. The drive summary said "1 yards" for a one-yard
  drive: singular now, in the toast and on the scoring list. A toast still showing when you leave a game is cleared
  with the rest. Audit empty at 320x568 and 390x844 (a first run in a page where a game had just been played by hand
  showed a card and a toast caught mid-fade: leftovers of the test, gone on a fresh page); fingerprint unchanged.
- Ninth stock-take (10:50), after forty-five changes. Changes 41 to 45: retirement and hall of fame laid out, a
  wrong back label, a clumsy sheet and a plural. The finds are getting smaller, which is the point of this stage.
  Next five: 46 the draft and combine screens in stills; 47 the saves list with eight careers at 320 wide; 48 the
  practice mini-games from the career hub; 49 the coin toss, intro and quarter-break cards in stills; 50 a full
  regression and the day's summary notes in the roadmap; then the tenth stock-take.

- Change 46 (11:10), the combine and draft at 320 wide. The combine screen (two workout cards, skip) reads well.
  Two faults in the draft cutscene: (1) its caption said "pick 18 of 8", a leftover from the eight-team league: it
  counts the league's teams now ("pick 11 of 32"); (2) the stage board is 13 yards wide and a phone held upright saw
  only its middle in the close shots, so a long team name ran off both edges ("HIGHLANDER"). The board is drawn
  narrower on an upright screen (down to half, by the camera's aspect) and its lines are written pre-stretched and
  sized to fit, so the letters keep their shape (`boardFit`, `boardLines` in `render3d.js`); landscape is unchanged.
  The hall of fame ceremony uses the same board and gets the same fit (seen with a long name; its angled shot still
  trims the first letter of "HALL OF FAME" a little). The draft order list after it reads well. Audit empty at
  320x568 and 390x844; fingerprint unchanged.
  Next: 47 the saves list with eight careers; 48 the practice mini-games; 49 the coin toss, intro and quarter-break
  cards in stills; 50 a full regression and the day's summary notes; then the tenth stock-take.

- Change 47 (11:25), the saves list with eight careers at 320 wide, nothing changed: eight cards (badge, name,
  position, rating, team, where the season stands, Play or Continue, Delete), long double-barrelled names fit, the
  one being played is marked, and at eight the New career button gives way to a line saying eight is the most.
- Change 48 (11:30), practice from the career hub, nothing changed: six reps start at once on the play-call sheet,
  the result sheet is four lines and the coach's trust. Played through by the test player.
- Change 49 (11:35), the coin toss at 320 wide, nothing changed: the captains and the referee at midfield over a
  sheet with Heads and Tails side by side. The quarter-break card was seen in change 22.
- Change 50 (11:45), a full regression, nothing changed: menus and all four modes audited at 320x568 and 390x844,
  empty; fingerprint unchanged; the rough test player through three exhibitions and six career games, clean.
- Tenth stock-take (11:45), after fifty changes. Changes 46 to 50: the draft cutscene's two faults, and four checks
  that found nothing. Every screen and sheet in the game has now been looked at in a still at 320 wide today.
  The loop goes on in the same way, with what is left to look at: 51 the stadium and field in snow and rain from
  the play camera; 52 a receiver's game from his own camera (routes, the Call button, the job card); 53 the
  quarterback's pad on a pass (letters, power bar, Pump) at 320 wide; 54 the defense pad and the tackling prompts;
  55 a whole-career run of three seasons at each position; then the eleventh stock-take.

- Changes 51 to 55 (11:55 to 12:20), five checks, nothing in the game changed. 51: the field from the play camera
  in day snow and night rain at 390x844 (dusted turf, streaks, routes and letters all readable). 52: a receiver's
  game at 320 wide: the sat-out drive (the sideline card, Skip drive and Fast fwd), the job card and Ready button
  before the snap, and himself tagged "You" inside the frame once the camera settles. 53: the quarterback's passing
  pad at 320 wide with the power bar up (five letters, Pump, Away, "Touch 62"): fits. 54: the defense pad (Sprint,
  Dive, Switch, Hit, Strip): audited, not seen in a still (the pane returned an old frame). 55: whole careers:
  a quarterback through three seasons (30 games, 5,530 yards, 29 touchdowns, 14 interceptions, seven trophies, two
  honors, a contract renewal each year), the hub's four tabs audited afterwards; a receiver through two seasons
  (22 games, 99 catches, 1,654 yards, 21 touchdowns). No errors.
- Eleventh stock-take (12:20), after fifty-five changes. Five checks, no finds: the game is in a settled state.
  The loop continues with whatever is still unlooked-at or worth a second pass: 56 Season mode's roster and team
  tabs with a season half played; 57 a long game (five-minute quarters) through the rough test player; 58 the
  settings each switched and a play run (shadows, glow, close-up models, replays, cutscenes off); 59 left-handed
  buttons at 320 wide; 60 a full regression; then the twelfth stock-take.

- Change 56 (12:40), Season mode's Team and Roster tabs with five games played. The layout read well. The numbers
  showed a fault of football, not of layout: the team had minus 91 rushing yards. A sack's lost yards were being
  added to the team's rushing total (the college way); a player's own carries already left sacks out. Team totals
  now take a sack off net passing, as the pro game does (`addYds`). Nothing about how a play runs changed: the
  seeded run gives the same score, the same number of steps and the same trace of player positions as before, and
  only the split of one team's 160 yards moved (166 passing and minus 6 rushing became 152 and 8). Because the
  fingerprint string includes those totals it was pinned again; the old one is kept in the test browser as
  `pg.fingerprint.before-sacks`. Shows on the halftime and final sheets, the quarter-break card, Season's team tab
  and the Ground and pound milestone (80 rushing yards is no longer pulled down by sacks).
- Change 57 (12:45), long games, nothing changed: three exhibitions with five-minute quarters through the rough
  test player (20-22 in overtime, 42-31, 34-26 in overtime): no errors.
- Change 58 (12:50), the graphics settings off, nothing changed: shadows, glow, close-up models, replays,
  cutscenes and the cinematic camera all off and sharpness on Balanced, an exhibition audited at 390x844: clean
  (about 115,000 triangles a frame with everything off).
- Change 59 (12:55), buttons on the left at 320 wide, nothing changed: switched in Settings, an exhibition
  audited, the pad looked at in a still: every button mirrored to the left edge, none under the play tag.
  Audit empty at 320x568 and 390x844 after change 56; careers, season, exhibition and camp clean.
  Next: 60 a full regression; then the twelfth stock-take.

- Change 60 (13:00), a full regression, nothing changed: menus and all four modes audited at 320x568 and 390x844,
  empty; fingerprint as pinned in change 56; the rough test player through three exhibitions and six career games,
  clean; six simulated games at 4.7 yards a carry, 62% complete, 3.1% intercepted, 46.8 points (the last two at
  the top of their ranges on six games: worth a longer run before reading anything into them).
- Twelfth stock-take (13:00), after sixty changes. Changes 56 to 60 turned up the first fault of football rather
  than of layout in some time (sack yards counted as rushing), found by reading a stat screen as a fan would. So
  the next five read the numbers: 61 the box score's conventions (who is credited after a fumble, kneel-downs,
  spikes); 62 the simulation over forty games against its ranges; 63 the drive summary and scoring list wording
  against how a broadcast says it; 64 the standings' order and tie-breaks; 65 awards and leaders: do the right
  players win them; then the thirteenth stock-take.
- Change 61 (13:15), the box score after a fumble. A lineman had "1 car, -8 yds" on Season's roster tab: when the
  offense got its own fumble back, the man who fell on it was credited with the carry (or the catch) and the whole
  play's yards. The play now belongs to the man who fumbled; a quarterback stripped before he threw is a sack, with
  its yards off net passing; a recovery run in for a touchdown stays the scorer's (`addYds`). Checked in sixteen
  rainy exhibitions with 25 fumbles: no lineman with a carry or a catch. The seeded run is unchanged in every part,
  totals included. Audit empty at 320x568 and 390x844; careers, season, exhibition and camp clean.
  Next: 62 the simulation over forty games; 63 drive summary and scoring wording; 64 standings order and
  tie-breaks; 65 awards and leaders; then the thirteenth stock-take.

- Change 62 (13:30), forty simulated games (three-minute quarters), nothing changed. Against the ranges: 4.86 yards
  a carry, 61.3% complete, 1.8% intercepted, 3.9% sacked, 42.2 points a game combined: all inside. Two things the
  ranges do not cover, measured and left for the owner because changing them changes how the game plays: computer
  teams run on 28% of their snaps (the pro game is nearer 42%), and a completion averages 16.5 yards (nearer 11
  there). Both follow from short quarters and a pass-first set of playbooks; more running would mean fewer points.
- Change 63 (13:35), the wording of the drive summary and the scoring list, nothing changed: "Touchdown drive ·
  5 plays · 76 yards · 0:59" and "Q2 · Touchdown · 12-yd pass from Carter to Rhodes (kick good)" read as a box
  score does.
- Change 64 (13:40), the standings' order, nothing changed: teams rank by wins (a tie counts half), then point
  difference, and the note under the table says so. The pro game breaks a tie on head-to-head and division record
  first; that would change who makes the playoffs, so it is left for the owner.
- Change 65 (13:50), awards and leaders. The statistical title at your position goes to the league's leader, but
  All-League at your position, when you did not win it, went to a made-up name: the passing champion could be left
  off the All-League team. It now goes to the leader at your position, and the nominees are the next two (the
  leaders table is the record for both). Seen after a receiver's season (Vega: receiving title and All-League)
  and a quarterback's (the test player won both). MVP and Offensive Player of the Year, when not yours, are still
  made-up names from around the league. Audit empty at 320x568 and 390x844; careers clean; fingerprint unchanged.
- Thirteenth stock-take (13:50), after sixty-five changes. Changes 61 to 65: two stat-sheet faults fixed (a
  fumble's credit, All-League), three checks, and two questions of balance written down for the owner (run share,
  tie-breaks). Next five: 66 the career leaders board: are the other names' numbers plausible for ten games;
  67 the game grade: what earns an A+ and whether a bad loss can; 68 quarterback rating or the stat line's order
  against a pro box score; 69 the play-by-play toasts' wording (first down, loss, no gain); 70 a full regression;
  then the fourteenth stock-take.

- Change 66 (14:00), the career leaders boards after a ten-game season, nothing changed: the leaders' numbers are
  what ten games of three-minute quarters would give (passing 1,941 yards and 13 touchdowns, rushing 856, 7.5
  sacks, 3 interceptions, 70 tackles), the test player sat where his own line put him, and the rate boards (passer
  rating, completion percentage) keep their minimum attempts.
- Change 67 (14:10), the game grade. It is goals met (two each), a win (one) and the stat line (up to three), out
  of ten; nothing in it counted against a quarterback's interceptions, so a three-interception day with the yards
  and the goals was an A+. Each interception now takes a step off, three at most (`gradeOf`). Eight test games
  graded A-, A+, A+, A+, C+, A-, F, A; the three with an interception were the A-, the C+ and the F. The grade
  feeds the season average the awards use and the coach's trust, so a careless quarterback earns both more slowly.
  It does not touch how a play runs: fingerprint unchanged.
- Change 68 (14:15), the stat line's order, nothing changed: completions/attempts, yards, touchdowns,
  interceptions, then carries; catches, yards, touchdowns, targets: the order a pro box score uses.
- Change 69 (14:15), the play-result wording, nothing changed: "+7 yards", "+1 yard", "No gain", "Loss of 3",
  "Sack!", "First down" read as they should.
- Change 70 (14:25), a full regression: menus and all four modes audited at 320x568 and 390x844, empty; careers at
  both positions, the rough test player through two exhibitions and three career games: clean; fingerprint
  unchanged.
- Fourteenth stock-take (14:25), after seventy changes. Changes 66 to 70: one more fault of football fixed (the
  grade ignored interceptions), four checks. Three hours remain. Next five: 71 the coach's messages and the
  headline after a game: do they match what happened (a loss with a great line, a win with a poor one); 72 the
  commentary index: any line whose trigger cannot fire; 73 the README's controls table against the keys the game
  binds; 74 the roadmap's How to test section brought up to date with the day's tools; 75 a full regression and
  the bundle on its own; then the fifteenth stock-take and the day's summary.

- Change 71 (14:30), the coach's message and the headline after a game, read against the rules that pick them. They
  follow the grade, the result and the weakest part of the stat line, and fit what happened. One slip of grammar:
  after a single interception the coach spoke of "the interceptions"; he says "the interception" for one.
- Change 72 (14:40), the commentary index against the code, nothing changed: all 678 recorded lines belong to a
  call the game can make (the numbered down-and-distance calls and the quarter-end lines are built from parts), and
  every line the game asks for by name was recorded.
- Change 73 (14:45), the README's controls table against the keys the game binds: three rows were missing (pump
  fake and slide, B and N, LT and Y; pass protection, O, LT; fast forward and skip while watching a drive, F and K,
  A and B). Added.
- Change 74 (14:50), the roadmap's "How to test" now covers the rough test player, the fingerprint pinned on
  2026-11-14 and why, and what a stepped test leaves behind. Audit empty at 320x568; careers clean; fingerprint
  unchanged.
  Next: 75 a full regression and the bundle on its own; then the fifteenth stock-take and the day's summary.

- Change 75 (15:00), a full regression and the bundle on its own, nothing changed: menus and all four modes
  audited at 320x568 and 390x844, empty; the rough test player through exhibitions, careers at both positions and a
  rigged season; the single-file bundle loaded alone, gave the pinned fingerprint and played an exhibition and a
  career game.
- Fifteenth stock-take (15:00), after seventy-five changes. Changes 71 to 75 were one word of the coach's, the
  README's controls and the test notes. With two and a half hours left the loop reads the rules of the game itself
  against the pro game: 76 where a missed field goal is spotted; 77 the clock: what stops it and what does not;
  78 penalties: yardage and whether the down is replayed; 79 the kickoff and punt touchback spots; 80 a full
  regression; then the sixteenth stock-take and the day's summary at 17:30.
- Change 76 (15:15), a missed field goal. The other side took over at the line of scrimmage (or its 20). The pro
  rule gives it the ball at the spot of the kick, seven yards behind the line, or at its own 20 if that is better:
  done. A miss from the 21 (a 38-yard try) now hands over the ball at the 28, not the 21, so a long miss costs
  what it should. Seen in play: a miss with the line at the 79 gave the ball at the 72; one going the other way at
  the 34 gave it at the 41. The seeded run has no missed field goal in it and is unchanged in every part; thirty
  simulated games came out at 4.64 yards a carry, 59.9% complete, 2.1% intercepted and 44.1 points, inside the
  ranges (a first batch of eight had read 49.9 points: batches of five range from 35 to 55, so short runs prove
  little). Audit empty at 320x568 and 390x844.
- Changes 77 to 79 (15:15), the rules read in the code, nothing changed. 77: the clock stops for an incompletion,
  a ball carrier out of bounds, a score, a change of possession, a penalty and a time out, and runs after a tackle
  in bounds (thirteen seconds come off, eight in the hurry-up, scaled to the short quarters). 78: holding is ten
  yards from the old spot (half the distance near the goal line) and the down is replayed; defensive fouls that
  carry one give an automatic first down; roughing is fifteen. 79: a punt into the end zone comes out to the 20;
  a kickoff touchback is spotted at the 25. The pro game moved that to the 30 and then the 35 with its new kickoff
  formation, which this game does not have: left at 25, for the owner to say.
  Next: 80 a full regression; then the sixteenth stock-take.

- Change 80 (15:30), a full regression, nothing changed: menus and all four modes audited at 320x568 and 390x844,
  empty; fingerprint unchanged; the rough test player through four exhibitions and six career games, clean.
- Sixteenth stock-take (15:30), after eighty changes. Changes 76 to 80: one rule put right (the missed field
  goal's spot), three sets of rules read and found sound. Questions for the owner, collected from the day; each
  would change how the game plays, so none was touched:
  1. Overtime is one period of sudden death ("next score wins"). The pro game now gives both sides a possession.
     Changing it also means the overtime banner and, probably, new booth lines.
  2. A kickoff touchback is spotted at the 25. The pro game uses the 30 or 35 with its new kickoff formation.
  3. Standings break a tie on point difference. The pro game uses head-to-head and division record first.
  4. Computer teams run on 28% of snaps and a completion averages 16.5 yards (the pro game: about 42% and 11).
     More running means fewer points with three-minute quarters.
  5. MVP and Offensive Player of the Year, when you do not win them, go to made-up names rather than to the
     league's leaders.
  6. A quarterback's interceptions now lower his game grade (change 67): say if that is too harsh.
  Things only a person with the device can judge: a real controller on the new switches, sound on a phone
  speaker, the frame rate on an actual phone.
  Next five: 81 the extra point, the two-point try, the safety and the end-zone interception read against the pro
  rules; 82 the two-minute warning and the hurry-up; 83 the challenge: what can be challenged and what it costs;
  84 fair catch and muffed punt; 85 a last regression; then the day's summary.
- Change 81 (15:35), four more rules read in the code, nothing changed: the extra point is kicked from the 15 (a
  33-yard kick); the two-point try is one play from the 2; an interception downed in the end zone comes out to the
  20; after a safety the side that scored takes over near its own 35, standing in for the free kick.

- Changes 82 to 84 (15:45), more rules read in the code, nothing changed. 82: the two-minute warning stops the
  clock at 2:00 of the second and fourth quarters (not in overtime, and not when a quarter is two minutes or less);
  the hurry-up takes eight seconds between plays instead of thirteen, for a side level or behind late in the game
  and for anybody in the last minute of the half. 83: a challenge is of the spot on a close first down; each side
  has two, a wrong one costs a time out, and an overturned spot can take a first down away or turn the ball over on
  downs. 84: a fair catch gives the ball where it lands with no return; a muffed punt is a live ball either side
  can recover.
  Next: 85 a last regression; then the day's summary.

- Change 85 (16:00), dark team colors on tiles and cards. The color bar on a team tile and down the edge of a
  player card was the team's color on a dark panel: for the three darkest teams (near-black, deep navy, charcoal)
  it could not be seen. Both have a faint light edge now, as the standings dots got in change 27. Looked at on the
  exhibition team grid; audit empty at 320x568 and 390x844; fingerprint unchanged. (The regression planned as 85
  was run as change 80, forty minutes earlier, with nothing changed since but this.)
  Next: 86 onwards, small visual passes until 17:30; then the day's summary.

- Change 86 (16:30), the draft order screen. What the screen is for (which team took you, the contract, the bonus,
  where you open) was a paragraph under a 32-row table, a long scroll down. It is first now: the pick and team,
  four tiles (the deal's length, pay a season, the signing bonus, the coach's trust), where you open, and Report to
  camp; the first round follows under its own heading with each team's color beside its pick. Played on from it
  into a first game as a receiver. Audit empty at 320x568 and 390x844; fingerprint unchanged.

- Change 87 (17:00), the last regression of the day, nothing changed: menus and all four modes audited at
  320x568 and 390x844, empty; fingerprint as pinned; the rough test player through four exhibitions, six career
  games and a rigged season to the championship game (runner-up); the single-file bundle loaded alone, gave the
  pinned fingerprint and played an exhibition and a career game. The test browser's settings were put back and its
  test careers and season cleared.
- The day, 2026-11-14, in short (87 changes, artifact versions 110 to 135, 47 commits on main):
  Screens redrawn with pictures, tiles, chips and switches in place of lines of text, nothing removed: Settings,
  the pause sheet, How to play, training camp, the halftime and final sheets, scoring plays and leaders,
  exhibition set-up, the playoff bracket, the career hub's header and finished-season card, the new-career builds,
  the press conference, the retirement screen, the hall of fame, the draft screen, the after-touchdown sheet.
  On the field: the rain's reflection, the benches (uneven, turned, one or two on a knee), the stage board in the
  draft and hall of fame cutscenes fitted to an upright phone, dark team colors given an edge.
  Lighter to draw: cutscenes and the instant replay no longer swap in the close-up model for the benches (replay
  612,000 triangles to 499,000; cutscenes 537,000 to 231,000).
  Football put right: sack yards come off net passing, not rushing; a recovered fumble's play belongs to the man
  who fumbled; a missed field goal is spotted where it was kicked from; a quarterback's interceptions lower his
  grade; All-League goes to the league's leader at the position; the draft is "of 32"; a season is "ten games".
  Asked for during the day: up to eight saved careers; `js/online.js` and `docs/ONLINE.md` set up for multiplayer
  and chat, nothing connected.
  Tested: `tools/chaos.js`, a rougher test player (fourth downs, two-point tries, onside kicks, challenges, ties
  into overtime, whole seasons); every rare ending seen; one fault of the day's own found and fixed (the final
  sheet's score after a playoff settled past four overtimes).
  For the owner: the six questions in the sixteenth stock-take (overtime, the kickoff touchback spot, tie-breaks,
  how much the computer runs, made-up award winners, the interception penalty on the grade), the decisions in
  `docs/ONLINE.md`, and three things only the device can show (a real controller on the switches, sound on a phone
  speaker, frame rate on a phone).


### After the loop, 2026-11-14 evening: the owner's go-ahead on the six questions

The owner, shown the six questions of the sixteenth stock-take: "U can proceed tho i give u full permission". All
six were done as the pro game has them; the choices where there was one are mine and are marked.

- Overtime: both sides get the ball (`otCheck`, `G.otS` in `game.js`). The side that wins the toss has its
  possession; if it scores, the other side gets one to answer. The game is over as soon as the second side is ahead
  (a touchdown that beats a field goal, or a score by its defense), or the first side is ahead once the second has
  had the ball. Level after both, the next score wins. A regular-season period that runs out level is still a tie;
  a playoff game still plays on. The banner reads "Both sides get the ball"; the booth's overtime line said nothing
  about sudden death and was kept. The milestone "Sudden death" is named "Overtime". Checked over 58 overtimes
  (one- and three-minute periods): a field goal answered by a touchdown ended it at once, a touchdown and its kick
  answered by a failed possession ended it, a field goal each went on to the next score or the end of the period;
  in none did the first side win before the other had the ball.
- Kickoff touchback: the 35 (my choice between the 30 of 2024 and the 35 of 2025: the current rule). A punt into
  the end zone still comes out to the 20.
- Computer play calling: about even run and pass on first down, a little under on second and long, mostly runs on
  short yardage, seldom on third and long (it was 30% runs on first and ten). Teams now run on 37% of snaps, up
  from 28% (the pro game is about 42%; the two-minute drill and playing from behind hold it under). A career
  quarterback's coach still calls passes at about the old rate (55 attempts in four test games).
- Together, measured over 35 simulated games: 4.63 yards a carry, 58.1% complete, 1.9% intercepted, 41.7 points a
  game, inside the ranges. With the touchback moved and the old play calling it was 49.9 points; the two changes
  balance each other.
- Standings: level on record, the side that won more of their meetings ranks first, then the better record inside
  the division, then point difference (`better`, `L.h2h`, `dw` / `dl` in `league.js`). Seen in a test season:
  two sides level on record, the one that had beaten the other placed first with the worse point difference. A
  season saved before this has no meetings on record and falls back to point difference until the next one starts.
- Awards: MVP, when it is not yours, goes to the league's best passer and Offensive Player of the Year to its best
  runner or receiver (the same seeded lines the leaders boards show), with the next two as nominees.
- The interception penalty on the grade stays as it went in (change 67).
- The fingerprint was pinned again, since play was meant to change (the old one is `pg.fingerprint.before-rules`
  in the test browser). Audit empty at 320x568 and 390x844; careers at both positions, a rigged season through the
  playoffs, exhibition and camp clean.
- Not done: multiplayer and chat still need the owner's account and choices (docs/ONLINE.md); nothing was signed
  up for.

- Later the same evening, the owner: "a dive is not a dive, also when ur already running as a qb still allow me to
  throw to people".
  The dive (my reading: the Dive button did not look like one). It was a body bent forward at half height for a
  third of a second, and then the "lost his footing" stumble, standing. It is a dive now (`render3d.js`, the
  `p.dive` branch and a new one after it): he leaves his feet, is laid out level with both arms stretched at the man
  or the ball and his head up, and comes down on his chest; after a miss he lies face down where he landed and
  gets up through a knee over the last third of a second the game already holds him out for. Every dive uses it
  (yours, the computer's, a dive on a loose ball). How far and how fast a dive goes, and how long a miss costs, are
  unchanged. Looked at in three stills taken off the 3D canvas itself (flight, landed, rising); the pane's own
  screenshots ran a frame or more behind and could not be trusted for this.
  The quarterback on the run (my reading: the letters went away as he reached the line). A pass was allowed until
  he was a foot past the line of scrimmage; it is allowed until he is clearly past it (1.2 yards), which is where
  the pad changes to the runner's buttons. Behind the line he could already throw on the move, with a second finger
  on a letter or its button while the first steers. Designed quarterback runs (the draw, the zone read keeper) still
  have no one running a route to throw to. Checked: the pad stays on the letters at 0.2 and 0.9 yards past the line
  and changes at 1.5.
  Audit empty at 320x568 and 390x844; exhibition, season, careers, camp (the tackling drill twice) clean;
  fingerprint unchanged.

- The owner, after that: "you stick to the real game of football, make sure my requests and the game are faithful
  the nfl rules and plays". So where a request and the rules disagree, the rules win, and I say so. The one thing
  shipped that evening that broke a rule was mine: letting a quarterback throw from 1.2 yards past the line of
  scrimmage. Put right, and tightened to the whole rule: a forward pass is legal only from behind the line (a foot
  of allowance for a body straddling it), and a quarterback who has been past the line may not come back behind it
  and throw (`canPass`, `ps.past`). Checked: letters at 3 yards behind and 0.2 past; runner's buttons at 0.9 past;
  no letters after coming back to a yard behind. He can still throw on the move anywhere behind the line. The dive
  stays: it changed how a dive looks, not what it does. Audit empty at 320x568; exhibition, careers, camp clean;
  fingerprint unchanged.

- The playbook against the rules and against real play design (the owner: "yes", to the offer of that audit).
  A check was written for it, `node tools/playcheck.js`: seven men on the line in every formation, only the two
  ends of the line and the men behind it eligible, every route and role a play names in its formation.
  Found: six of the nine formations had eight men on the line (Singleback, I-Form, Pistol, Gun Trips, Gun Slot,
  Jumbo). The flanker stood on the line outside the tight end, which covers the tight end and makes him
  ineligible; fifteen plays threw to him (and Jumbo PA to the second tight end, covered by the split end). The
  flanker (in Jumbo, the split end) is a step off the line now, so each formation has seven on the line and the
  tight end is its end. Counted at the snap over a played game: seven on the line on all 68 snaps, eight
  formations.
  Three passing concepts did not match their names: Snag had the outside man on the corner and the slot on the
  snag (it is the outside man who sits inside, the slot who runs the corner over him); Drive had its shallow cross
  and its dig coming from opposite sides (they come from the same side, the dig behind the cross); Mills had the
  slot on the post and the outside man on the dig (the post is the outside man's). RPO Bubble's slot ran a flat
  route, not a bubble. All four corrected. The other plays were read and left: the runs, the quick game, the
  screens, the bootleg and flood off play action, smash, dagger, levels, post-wheel, four verticals, the double
  moves; and the thirteen defensive calls (their coverages are what their names say: two, three and four deep,
  man with one or two deep, the five- and six-man pressures).
  Motion: the man sent in motion could be an end, which leaves six on the line at the snap. Only a man already off
  the line goes in motion now.
  Play was meant to change, so the fingerprint was pinned again (`pg.fingerprint.before-formations`). Measured over
  70 simulated games: 4.3 yards a carry, 56.7% complete, 1.8% intercepted, run share 39.5%, 37.5 points a game
  combined. That is under the 40 to 46 written down in the morning, which was measured on the pass-first game;
  with the running game nearer the pro share, scores are about a tenth lower. The range in "How to test" now reads
  35 to 44. Audit empty at 320x568 and 390x844; exhibition, season, careers and all three camp drills clean.

- The owner, with the last of the week's usage: "work hard and use it for major bug fixes, major ui improvements or
  more ... i expect character improvements model wise as well visually". The player model, looked at close from
  eight angles first (stills taken off the 3D canvas):
  the hips were a near-sphere the thighs hung under, which read as a ball from behind and worst on a lineman in
  his stance. They are a yoke now, wider than it is deep, that wraps over the tops of both thighs, flat in front
  with a seat behind, cut up between the legs (`mkHips`); the thigh is a little fuller at the top to meet it.
  The boots were a size too small under those legs: longer and wider (`cleat`).
  The leg was one color from hip to ankle half the time (white socks at home, the pants' own color away): socks
  now contrast with the pants, team color under light pants and white under dark (`sockFor`), with two bands round
  the top of the sock baked into its shading. A career player's own sock color still wins.
  Same parts, same joints, same number of draws; both the gameplay model and the close-up one, since they share
  the recipes. Audit empty at 320x568 and 390x844; exhibition, careers and camp clean; fingerprint unchanged.

### From the owner's phone, 2026-11-16

- The owner, away from the Mac: "it feels good on my iphone 16 pro max, i just want to make the characters model
  better and better, more realistic, and the field, add more small details throughout ... no regressions".
  Stills of the model from four sides (`PG.r3d.modelStrip()`, new: the whole figure, large; `{ far: true }` for the
  gameplay model) and of the stadium from seven pinned cameras first. What changed:
  The helmet is held on: a chin cup with a strap up each cheek into the shell, and a bumper at the back of the
  neck (`chinStrap`, white on every helmet, the part `chin`). The jersey has a collar in the trim color on both
  models (`collar`; the near model's was in the shoulder pads' geometry and so in the jersey color). Tape over the
  sock from the shoe up, the way most players spat their ankles (`ankleTape`, the part `tape`, white). The
  gameplay model's hand is a mitt with a thumb instead of a ball (`mitt`), and it has the knee pad the close one had.
  The elbow is a shade wider than the forearm that turns in it (the two surfaces cut each other in a ragged line).
  The shading where the leg leaves the hips is lighter: a hard band there drew a pair of briefs on him.
  Officials and bare heads hide the strap and the tape (`REF_HIDE`).
  The field: scuffed, duller turf between the numbers, thickest at midfield and in front of each goal; the league's
  shield on both 25s; a cross at each kickoff spot and the short line at each 2. The ground between the turf and
  the wall was the bare dark ground the benches stood in: it is an apron of turf now. The wall at field level has
  padding in the home side's colors with boards on it (`padsCanvas`, painted in `paintCrowd`, dimmer at night).
  The light towers carry banks of round lamps instead of a white slab. The goal posts are goosenecks: a padded
  post behind the end line curving forward to the crossbar, with a ribbon on each upright that streams in the wind.
  The sidelines (all one mesh, `mergeC`): benches with a back and a foot rail, tables with two coolers and cups,
  equipment trunks, a kicker's practice net, pylons with a white band. The ball is a football's shape (it was a
  squashed sphere), with its two stripes and laces with stitches. The crowd shader draws concrete stairs up each
  aisle and a portal in each section. The top of the upper deck has a fascia with a strip of lights.
  Cost: three new body parts (three draws each model), about twenty draws of scenery; 106 draws and 158k
  triangles in the close sideline view against 95 and 141k before. Fingerprint unchanged against the code before
  the change, run side by side; `H.sim`, `H.exh`, both careers, the three camp drills and the chaos player clean;
  gait, tackles, the catch and the helmet's aim identical to before (the block test varies run to run on the old
  code too); whole games drawn at night in the clear, by day in the rain and at dusk in the snow, every pose finite.
  The audit at 320x568 and 390x844 found no contrast problem against the new stadium, but five team buttons at
  43.4 pixels to touch: the same on the code before the change, so a matter of how this machine (Linux, headless
  Chromium) measures the type, not of this change. `.tm` and the arrows beside it have a 44-pixel floor now, so
  the buttons cannot come out short on any machine.
  Audit run again after that: empty at 320x568 and 390x844.


### From the Mac, 2026-11-16

- The owner, back at the Mac after the phone session: "continue that and just make the game better, research".
  Pulled the cloud session's four commits first; checked here: fingerprint unchanged, audit empty, no errors.
  The model, looked at large (`modelStrip`) and in play: the jersey ended in a low curve between the legs and the
  pants started under it as two tubes, so he looked to be in a bodysuit. The uniform rule is the other way round
  (jerseys tucked into the pants; sources: the NFL uniform code as summarised by Dummies, and ESPN's piece on
  uniform inspectors). Now the jersey narrows into the waist (`TORSO`, no flare) and the pants come up to it and
  round over it, narrower at the waist than at the hips, with a belt shaded in at the top (`mkHips`, `SHADE.hips`;
  no extra draw). Home and away, near and far models, looked at from four sides and in play from eight cameras. A
  lineman in his stance is still big from behind: that was so before this change and is left.
  Socks checked against the same rule (white from the shoe to mid-calf, team color above, meeting the pants below
  the knee): they already were. Fingerprint unchanged; audit empty at 320x568 and 390x844; exhibition, season,
  careers, camp and the rough test player clean.

- Grass stains, after Madden's own notes on its 2025 models (uniforms that get dirtier with the conditions; EA's
  Madden 26 presentation deep dive). Each player (by team and number) picks up turf every play he goes to the
  ground: most on the thighs and knees, then the socks, a little on the seat and the jersey. Green-brown on a dry
  field, mud in the rain, wet grey in the snow; a wet field soils faster. It is drawn by tinting his parts when the
  next play is set (`DIRT`, `dirtied`, a per-part color in `colorFigure`), so it costs nothing per frame and is
  render-only: simulations and the fingerprint never see it. Officials, the cutscene cast and the benches stay
  clean. Seen after a half in the rain: the back who had been tackled had muddy thighs under a cleaner seat, a
  receiver who had not was clean. Fingerprint unchanged; audit empty at 320x568 and 390x844; exhibition, season,
  careers, camp and the rough test player clean.

- The owner, after research on Madden's Superstar mode (the 2023 return and the 2025 rework: live player grading,
  Sphere of Influence relationships, Game Day Beats stories): "add proper teammate chemistry, and live play grade
  proper, also add more social media comments that are different and make social even better". Built:
  Live play grade (`gradeSnap`, `GRP` in game.js): after every career snap the player is part of, a letter and the
  reason under the stat line for three seconds (`#pgr`), and a running grade on the stat line itself. A quarterback
  is graded on what he did with the ball: a touchdown A+, a completion by yards, whether it moved the chains and
  on which down, a throw-away C+, a miss to an open man D, a ball into coverage C-, a sack he held into D, an
  interception or fumble F, a scramble by what it got. A receiver: the catch by yards and the sticks, a drop (a
  catchable ball, `ps.cpT`, not caught) D, a contested ball broken up C, and on a pass not thrown to him, whether
  he got open (his separation as the ball left, `ps.meOpen`). Handoffs he is not in, a receiver's run plays and
  snaps he sat out are not graded. The result screen shows the game's snap grade, how many snaps, the best and
  the worst. It is shown beside the old game grade, which is unchanged.
  Teammate chemistry (`partner`, `chemHtml`, `gameMates` in career.js; `chemOf` in game.js): with the teammate the
  feed already had, a receiver's quarterback or a quarterback's top receiver. Those feed teammates now line up on
  the field under their own names and numbers (they were random each game). 0 to 100, 50 when you meet; it grows
  with completions, yards and touchdowns between the two and falls with interceptions and drops, more slowly the
  higher it is (a receiver reached 77 after two test seasons). In a game it tilts the computer quarterback's read
  toward his receiver (the old bonus at 50, up to half again at 100) and moves the catch chance on a ball between
  them by up to five points either way. New teammates, and new chemistry, after a trade. A card on the hub, a line
  on the result screen.
  Social (`extras` in media.js): new voices (stat accounts, local radio, former players, an opposing player) and
  posts for what the week was, which until now only the press conference used: a win or losing streak, a road win,
  primetime, the playoffs, rain or snow, playing hurt, a rookie's first weeks, a promotion to starter, chemistry
  (a connection that clicked, or misfired), the snap grade on tape. Stat accounts' posts carry fan replies. Each
  account posts once a week, and every line is dealt from the week's deck like the rest.
  Play outside careers is untouched: fingerprint unchanged. Audit empty at 320x568 and 390x844 (the grade chip and
  the hub card included); exhibition, season, careers (whole seasons at both positions), camp and the rough test
  player clean.

- The owner: "improve socials even more". Done in the feed's drawing, kept to his taste (more pictures, less text):
  players post with a face, the helmet and shoulders from the uniform portrait, cropped to the avatar (teammates,
  the rival, opposing players, your own account and the profile at the top of the Social tab). Counts under a post
  are small icons, and the heart can be tapped to like a post (saved with the career). Posts carry cards: the
  reporter's final is a scoreboard (two team badges, the winner's score bright), the stat accounts' line is big
  figures, the team account posts a player-of-the-game card with your picture in the kit you wore, a fan poll each
  week (grade the day, or call the next game) answers with bars once you vote, a follower milestone (10K, 25K, 50K,
  100K, 250K, 500K, 1M and on) gets a post of your own, and "Post a photo" joins the weekly posts (your picture on
  the team's colors with your number behind).
  The audit no longer counts what is inside a folded week (it is not on screen), nor a control that has scrolled
  under a bar pinned to the bottom while the list can still scroll it out. A portrait is no longer drawn from a lost
  WebGL context (it read back noise, or an old picture, and was kept): no picture instead. Fingerprint unchanged;
  audit empty at 320x568 and 390x844, a page with every card type included; whole seasons at both positions,
  exhibition, season and the rough test player clean.

- The owner: "make it so if u are a wide receiver, when ur running or doing whatever, that u can see the lines of the
  route on the field". The route was painted already, but at 45% and thin, from where the route began, so in play it
  hardly showed. Now a career receiver's route is drawn bright and thick from where he is to where it ends, with a
  white dot on each cut still to come and an arrow at the end (past the last cut of a route that keeps going, an arrow
  the way it goes); the part already run is a faint trail. It shows before the snap and through the route until the
  ball is thrown, the catch, or he goes down; on a run play (he blocks) no route is shown, on an option it is.
  Steering through a cut with the stick now counts it as run (within a yard and a half of it, or past it along the
  stem): before, letting go of the stick sent him back to a cut he had already gone by. Fingerprint unchanged
  (careers only); audit empty at 320x568 and 390x844; a receiver season, careers and the rough test player clean.

- The owner: "make the ui better overall everywhere". Toured every screen at 390x844 (menu, settings, how to play,
  exhibition, season hub, camp, milestones, hall of fame, career hub and tabs, play calling, the field, the result
  sheet). Most read well already; fixed what did not. The live snap-grade chip stacked its letter over its words: a
  global `.mid` rule (the score bug's middle) caught the chip's "mid" grade class, so the chip's classes are now
  g-hi, g-ok, g-mid, g-lo and it is one line. Milestone and career trophy tiles carry a round mark, a check when
  earned and a lock when not, and the milestones page has the progress bar the trophies had. Career abilities with no
  slot open show a small lock and "Opens at 74 OVR" in place of a dead "Locked" button, and the heading says "no slot
  open yet" instead of "0 of 0 slots used". Hall of fame cards show the player in the kit he retired in (found by
  the team's name; new entries also keep the team and the look), and "1 games" is "1 game". The small division
  cards in the standings name their two figures (W-L, PF-PA), which both read "0-0" before a game. A long toast
  wraps inside the screen instead of running off its side at 320 wide. Fingerprint unchanged; audit empty at
  320x568 and 390x844 (the hall, the milestones and a long toast included); whole seasons at both positions, a
  receiver career and a season with the rough test player clean.

- The owner: "don't leave a lot of empty space though". Measured every screen at 440x956 (his iPhone 16 Pro Max): the
  menu, training camp, milestones, the hall of fame, the press conference (question and summary), the combine, the
  40-yard dash and awards night left 300 to 550 pixels empty under their content. Those screens are now a column
  (`.menu.fill`) whose main cards grow into the room (they never shrink: a short phone scrolls as before), with
  bigger badges, icons and type above 760 and 880 pixels of height. The press conference asks its question on the
  team's step-and-repeat wall (its short name and name, faint, tiled over a dark wash of its color, the colors
  worked out in code so the audit can read them), answers below near the thumb; the summary's wall carries the
  three results in large figures. The combine's two workouts have a faint stopwatch and football; the dash's tap
  pad fills the screen with faint yard lines; the hall shows dashed open spots up to three. The rest of each of
  those screens is now under 80 pixels (the bottom margin). Audit empty at 320x568, 390x844 and 440x956;
  fingerprint unchanged; a receiver season, careers and a season with the rough test player clean.

- The owner, on the stretched cards: "i mean fill the space but don't just yk make it look bad by expanding it,
  properly do it so it looks good expanded". The cards are back to their own size, and the room a tall phone has is
  given to real things. A hero (`PG.hero` in game.js): a large picture of a player (render3d `portrait` takes a
  width now; 600 pixels wide for a sharp picture) standing in a pool of his team's color with a caption, between a
  screen's title and its cards, sized by the room left and gone under 720 pixels of height. The menu shows your
  career player (or your season's team, or your team in the settings); the camp a player in the practice whites;
  the combine you in a plain gray workout shirt; awards night you, giving way as the winners are revealed; the hall
  the best career whose team is still in the league, under a strip of its figures (enshrined, retired, best case,
  70 to get in). The camp's drills each carry their star bar (the best score against the three marks); milestones
  carry a drawing each and the day they were earned. The press conference shows you behind a lectern with the
  team's short name and four microphones, in front of the team's wall, the question above you and the answers
  below; the summary's wall has you at the podium over the three results. Audit empty at 320x568, 390x844 and
  440x956; fingerprint unchanged; whole seasons at both positions, a receiver career and a season with the rough
  test player clean.

- Tonight, round 1 (01:50): both feet in. A pass caught with the receiver already over the sideline or the end line
  used to count, and he was then ruled out of bounds with the ball. Now a ball caught out of bounds is incomplete
  ("Caught out of bounds"), and a catch whose next steps carry him over the line (his position 0.3 s on) needs a toe
  tap: made more often by sure hands (0.5 + 0.3 a yard inside + 0.012 a point of catching over 70, held to 25-95%),
  "Toe tap · both feet in" when he does, an incomplete "Only one foot in" when he does not. No force-outs (the NFL
  dropped them in 2008). The career play grade knows both: "Toe tap at the line" (A-) and "One foot in" or "Stepped out
  before the catch", and neither counts as a drop against chemistry. The toe-tap pose in render3d was already there.
  Measured over 16 simulated games: 12 of 429 catches came down to the line, 10 toe taps, 1 one foot in, 1 out.
  A test-only tally `window.PG_FEET` (only under the harness's PG_TEST). Play changed, so the fingerprint was
  re-pinned; the old value is kept in pg.fingerprint.before-feet. Audit empty at 320x568, 390x844 and 440x956; whole
  seasons at both positions, a receiver career, exhibitions and a season with the rough test player clean.

- Tonight, round 2 (02:23): the league's numbers against the NFL's. Measured over 16 to 40 simulated games (3-minute
  quarters, so per play, not per game): 63% of completions were thrown behind the line (NFL about 20%) at 0.6 air
  yards a catch (NFL about 6) with 15 yards after the catch (NFL about 5.3), and a quarter of them gained 15+ after
  the catch. Three causes, three fixes in game.js:
  1. The quarterback's read (qbAI) went to whoever was most open, depth counting for almost nothing, so the back in
     the flat won. Now openness counts to 5 yards of room (was 7), depth 0.16 a yard (was 0.05), a man past the sticks
     gets a bonus (1.6 on third or fourth down, 0.6 earlier), a dump-off behind the line a penalty.
  2. Defenders more than nine yards from where a throw comes down stood still until the catch, then waited up to
     0.85 s more. Now everybody breaks on the throw (defAI: the far ones rally toward a spot five yards past the
     landing point, the tackling angle) and a catch costs them no extra beat (openField's new `rallied` flag).
  3. A computer runner's juke cut the tackle chance to 0.22 and he juked on most catches. Now a juke you make keeps
     0.22; the computer's works as well as he is elusive (0.45 for a 75, held to 0.3-0.65) at 1.8 a second (was 2.5).
  The contested-ball interception chance came down from 0.38 to 0.30 (deeper reads meant more contested balls and
  picks at 4%). Front-seven speeds closer to the combine's ratios were tried and taken out again: they cut the run
  game to 3.3 a carry and barely moved yards after the catch.
  After, over 40 games: 4.46 a carry (NFL 4.4), 64% completions (65), 4.9 air yards a catch, 28% behind the line,
  5.0% sacks (about 6.5), 3.0% interceptions (2.2), 0.51 points a play (0.53 before; NFL about 0.37). Still off:
  10.6 yards after the catch, from loose coverage (the nearest defender is 4.8 yards away at the catch against
  about 3); it is the next item. Play changed: fingerprint re-pinned, the old value in pg.fingerprint.before-reads.
  Also the like button's touch area was 43 px wide with a short count: 44 now. Audit empty at 320x568, 390x844 and
  440x956; whole seasons at both positions, careers at both, exhibitions and a season with the rough player clean.

- Tonight, round 3 (02:52): yards after the catch, part 2. Measured first: by coverage and role (backs out of the
  backfield are 8 yards clear in zone and 6 in man; slot receivers in man are 2.5 yards off yet still ran 11 more),
  and with a test tally of tackles after a catch (`window.PG_TKL` under PG_TEST): 70% of tries made against the
  NFL's 85 to 90%, 15% of completions went for touchdowns (about twice the league's), and the receiver ran 8.2
  yards before anybody reached him (NFL about 3 to 4).
  Two changes in game.js: an open-field tackle after a catch is surer (+0.14 on the chance; measured 79 to 84% made
  across runs; the run game, at 4.1 to 4.5 a carry, was left alone), and on the throw only the man on the receiver
  and anybody within four yards play the ball, the rest take the angle to where he will be half a second after the
  catch (he keeps running) instead of to where it lands. `ps.cy` keeps the catch spot.
  After, over 30 games: 65% completions, 9.3 yards after the catch (10.6 before, NFL about 5.3), 1.6% interceptions,
  4.1 a carry, 12% of completions for touchdowns. What is left is how plays develop, not one number: at the catch the
  three nearest defenders are mostly linemen (490 of 921), the coverage men are farther; the receiver still runs about
  8 yards before the first hand. Moved to the end of tonight's list as its own item. Play changed: fingerprint
  re-pinned, the old value in pg.fingerprint.before-tackles. Audit empty at 320x568, 390x844 and 440x956; whole
  seasons at both positions, careers at both, exhibitions and a season with the rough test player clean.

- Tonight, round 4 (03:23): a record book. The league's single-game and season marks for a quarterback (passing
  yards, touchdown passes, completions) and a receiver (receiving yards, catches, touchdown catches), kept on the
  device across careers like the hall of fame (pg.records.v1). They start where the real game's stand: the
  single-game records as they are (554, 7, 45; 336, 21, 5), the season records scaled from seventeen games to this
  league's ten (3,220, 32, 275; 1,155, 88, 14), held by invented men on the league's teams, "before your time".
  Season marks count the regular season only (a new `C.reg` tally, started from the season so far for a career
  begun before it). When a career player passes one: a live broadcast card the moment it falls in the game, with
  the crowd ("League record", past the holder's figure: game.js highCheck, the marks handed over as `recs`), a
  line in the XP sheet (+500), a note on the result sheet, and a post from the league's account with the figures
  as a stat card. The stats tab has the book: the figure, who holds it (you in the accent color), and for each
  season mark a bar of your season so far against it. Checked by lowering marks in a test (each moment fired); at
  the real marks no record fell in a whole season at either position, as it should be. Play outside careers is
  untouched: fingerprint unchanged. Audit empty at 320x568, 390x844 and 440x956; whole seasons at both positions,
  careers at both, an exhibition and a season with the rough test player clean.

- Tonight, round 5 (03:52): the form tackle as a paired motion. Most of it was there (the tackler bends to the hit,
  hands round the runner's hips, rides him down and lies across his legs; the runner falls away from the hit). What
  was missing was the drive: both men dropped straight down where they met. Now a tackle carries the pair on through
  the hit together before they are down, half a yard to 0.8 (longer the faster the tackler came in), along the line
  from the tackler to the runner, drawn on both figures over the first 0.6 of the fall so the wrap holds (render3d,
  the fall in pose; the vector kept per play in a WeakMap, off the game's state). Measured in games with the
  poseOf hook: both figures move by the same amount and the gap between them holds at the wrap distance (about a
  yard, as before); the men diving onto the pile follow the runner's drawn body. Drawing only: fingerprint
  unchanged. Audit empty at 320x568, 390x844 and 440x956; whole seasons at both positions, careers at both,
  exhibitions and a season with the rough test player clean.

- Tonight, round 6 (04:22): injuries, the rest. A shaken-up player (shaken() in game.js, about 0.8% of tackles,
  unchanged) used to stay down for a moment under a banner. Now, with cutscenes on, it is a short scene
  (SCENES.injury, 7 to 8 s, tap to skip): two trainers in team gear jog out (from about ten yards, already on their
  way) and kneel over him; then he is helped up and walks off to his sideline with an arm over each of their
  shoulders, three of his unit clapping him off, the crowd applauding. About one in six is the cart: a white cart
  with a stripe in his team's color drives out with a driver at the wheel, he is lifted onto its padded bed (the
  camera cuts as he is) and is driven off lying lengthways. The caption names him and who comes in; the booth line
  is the old one. render3d: new actor poses 'aid' (a trainer kneeling over him, reusing the bench kneel) and 'sit'
  (the driver), arms for a walk ('over' his shoulders, 'L'/'R' round his back) laid over an ordinary walk, a lying
  actor that starts down (p.lying), the cart prop, the scene camera (low on him, then wider following him off), and
  team gear (HOOD) now in the actor's own team's colors (the one existing use is team 0, so unchanged). Without
  cutscenes the banner says it as before ("carted off" for the cart). Also found by the audit and fixed: the watch
  pad's fast-forward and skip buttons, stacked, had touch areas overlapping by 5 px; now 45 px each and they meet.
  Play unchanged: fingerprint the same. Audit empty at 320x568, 390x844 and 440x956 (the scene itself looked at, both
  endings run to the end); whole seasons at both positions, careers at both, exhibitions and a season with the rough
  test player clean.

- Tonight, round 7 (04:52): a roof over the roofed stadiums. The eleven cities with one (data.js CLIM 'dome') already
  played indoors (no rain or snow, the lights on: env.roof) under an open night sky with stars and the four corner
  light towers. Now render3d's buildRoof() puts a shallow vault over the bowl, from its rim (55.6 yards up) to a crown
  44 higher over midfield, its underside dark steel ruled into panels by lighter trusses (a canvas texture), and a
  ring of lights hung under it round the field (a catwalk with 30 lamp banks and soft glows). applyEnv shows it when
  the env says roof and then hides the corner towers, the stars and the clouds and darkens the fog to the roof's;
  outdoors everything is as it was. The env key now includes the roof, so a change between games redraws. Seen in
  play from the game camera (the roof overhead, the lamps along it) and from a wide shot; switched back to an open
  stadium the stars and towers return. Exhibitions take their weather from the settings and stay outdoors; seasons
  and careers get the home city's. Drawing only: fingerprint unchanged. Audit empty at 320x568, 390x844 and 440x956;
  whole seasons at both positions, careers at both, exhibitions and a season with the rough test player clean.

- Tonight, round 8 (05:23): an all-star game. The real league's is a mark, so this one is plainly the All-Star
  Game: the Union All-Stars (UNI, blue) against the Frontier All-Stars (FRO, red), the two conferences. A career player
  who won an honor on awards night, or averaged better than a B over the season (6 points a game: more men make the
  all-star game than the All-League team, as in the real one), is invited (C.po.star, decided in closeSeason). After
  awards night the invitation comes up (and waits on the hub as a button if put off): the two sides as badges, you
  in your conference's all-star kit as the hero, your honors, and Play or Not this year. The game is a career game
  with the two all-star sides at 93, under a roof, your usual quarter length; it counts for no standings and no
  season line. After it: a result sheet over the field (the grade, the line, half the usual stat XP, 400 for
  playing, 250 if your side won, and 600 and an award for the game's MVP, a winning day of 6 points or more), and
  C.allstars counts your selections. The two sides are added to the team list as the game starts and taken off
  when you leave the result sheet (or quit), so tables, pickers and the schedule never see them; they are marked
  custom, so the booth leaves their names out. Test players: H.playCareerGame and X.career now play the all-star
  game when invited. Checked: invited from awards night and from the hub, played through by the test player with
  every number finite, 34 teams while the result shows and 32 after, back to the hub; a whole season by the rough
  player with no problem. Play outside careers untouched: fingerprint unchanged. Audit empty at 320x568, 390x844
  and 440x956 (the invitation, the result and the hub button included); whole seasons at both positions clean.

- Tonight, round 9 (05:52). First the yards-after-catch item, part 3: measured the first second after a catch over
  ten games (the nearest coverage man, not a lineman, at 0, 0.3, 0.6 and 1 s): 6.5 yards off at the catch, closing at
  only 2.6 yards a second (5.3 by a second in), moving at 5.7. Tried a wider pickup for the underneath zones (11.5
  yards from the spot instead of 8.5): separation at the catch 6.5 to 6.3, yards after the catch unchanged, so it was
  taken out again, not shipped. What is left is the quarterback's read: he throws only to a man with 1.3 to 2.7
  yards of room (qbAI's `need`) and the most open man scores best, so catches are made in open grass by design; the
  league throws into windows of about 3. Changing that moves the whole passing game and wants a session of its own
  (left open on the list, with these numbers).
  Then the next realism item, added to the list and done: the clock on a runner out of bounds. It stopped for good
  every time, all game. NFL timing: it stops and starts again on the referee's signal once the ball is set, except
  in the last two minutes of the first half (and of an overtime period) and the last five of the game, when it stays
  stopped until the snap. lateClock() in game.js; outside those windows the runoff is three quarters of an in-bounds
  tackle's (the ball is set a moment later). Measured over twelve games: early in a half the clock ran after 8 of 9
  plays out of bounds (the other stopped for another reason), late it stayed stopped on all 13. Play changed:
  fingerprint re-pinned, the old value in pg.fingerprint.before-oobclock. Audit empty at 320x568, 390x844 and 440x956;
  whole seasons at both positions, careers at both, exhibitions and a season with the rough test player clean.

- Tonight, round 10 (06:22): the kickoff landing zone. Under the current kickoff rules a kick has to come down in
  the landing zone (from the receiving team's 20 to its goal line); one that lands short of it is not returned, and the
  receiving team takes the ball at its own 40. The touchback at the 35 was already in, and the computer's kickoffs
  always come down in the zone, but your own swiped kickoff could land as far out as their 36 and be returned like any
  other. Now (kickoffBy: k.short) a kick landing more than 20 yards out is "Short of the landing zone", their ball at
  their 40, no return. Checked with a weak synthetic swipe: it came down at their 26 and the ball went to their 40.
  Computer kickoffs untouched: fingerprint unchanged. Audit empty at 320x568, 390x844 and 440x956; whole seasons at
  both positions, careers at both, exhibitions and a season with the rough test player clean.

- Tonight, round 11 (06:52): the pocket, measured and not shipped. Sacks in simulated games run at 4.3 to 5.4% of
  dropbacks against the league's 6.5 to 7%, and penalties at 3.5% of plays (the league's is about 8%, but several of
  the game's flags are only called in watched games, so the simulator undercounts them and that number is not a
  fair comparison). The quarterback (qbAI) throws as soon as he may: 99% of balls inside 2.2 s of the snap, an
  average of 1.45 s against the league's 2.8, almost never a scramble (0.1% of dropbacks) or a throwaway (1 in 687).
  Tried, in turn, over 20 to 24 games each: a progression (3.6 yards of room wanted at the top of the drop, coming
  down to 1.3 late): time to throw 1.53, because men are already 3.6 clear at 1.4 s; his first read moved to 1.9 s
  (feet set): sacks 21.8%, nearly all (74 of 75) by blitzing linebackers nobody blocked, arriving at 1.7 s; pass
  blocks held longer (2.2 to 4.6 s): no change, the blitzers are free; a hot throw when a blitzer comes free inside
  7 yards: sacks 3.6%, but interceptions 4.6%, 10.3 yards an attempt and 0.59 points a play, all further from the
  league. So it was all taken out again; nothing in play changed this round.
  What it shows: the quarterback's timing, the protection (backs and tight ends picking up blitzers, a slide), the
  hot read and the coverage tightness (round 9) are one system; tuning one knob a night moves the others the wrong
  way. Added to the list as one item for a session of its own, with these numbers.

- Tonight, round 12 (07:22): the computer's fourth-down calls. It went for it only when desperate late, or on 4th
  and a yard or less outside field goal range; everything else was a punt or a kick, so 4th and a yard inside the
  other side's 35 was always a field goal (4 of 4 in the sims). Now callPlan follows the modern chart: go on 4th and 1 from its own 35 on
  (field goal range included), on 4th and 2 or 3 between its own 45 and the edge of range, on 4th and goal from the
  2, and, two scores down in the second half, on 4th and 4 or less past its own 40; ahead in the last five minutes,
  or with a half about to end, it kicks. Measured over 24 sim games: fourth downs went 13% go / 62% punt / 25% kick
  before, 18% / 53% / 29% after (the league goes for it on about 17 to 18% of fourth downs). Seen on screen: a 4th
  and 1 at the offense's own 44, converted. Play changed: fingerprint re-pinned, the old value in
  pg.fingerprint.before-4th. Audit empty at 320x568, 390x844 and 440x956; whole seasons at both positions, careers
  at both, exhibitions and a season with the rough test player clean; the playbook check passes.

- Tonight, round 13 (07:53): the kicking game by the numbers. Measured over 16 sim games first: punts went 44.5
  yards gross and 37.8 net (the league: about 47 and 42), 13% touchbacks (about 8%), and not one fair catch, because
  a punt nobody returns live was always run back 0 to 9 yards; field goals from 50 and beyond were coin flips, since
  the computer's strike was drawn evenly from 0.55 to 1 against a bar that rises with distance.
  Now, in doKick: from his own 38 on, the computer's punter hangs it 3 to 15 yards short of the goal line instead of
  kicking it as far as he can (the coffin corner), and a punt nobody returns live ends the league's way: a fair catch
  about a third of the time, downed or out of bounds about one in seven (most of those short of the goal line), the
  rest returned about nine yards and now and then many more; one coming down inside the 10 is mostly downed or fair
  caught, and the nearer the goal line, the likelier it bounces in for a touchback. The result line says "Fair catch"
  or "47 yards, downed". The computer's leg is a little stronger (0.7 to 1). Field goals: cpuFg() draws make or miss
  from the league's rates by distance (about 97% at 30, 90% at 40, 78% at 50, 68% at 55, 50% at 60; rain and snow
  take some off) and hands doKick a strike to match, so the flight, the upright and the miss side are unchanged.
  Your own kicks, on the meter or by swipe, are untouched. After, over 32 games: punts 43.8 gross (more of them from
  short fields, which this league's offenses reach more often than the real one's), 41.0 net and 43.8 net from a
  team's own 35 or deeper, 4% touchbacks, 42% fair catches, 18% downed; field goals 8 of 11 from the 40s in clear
  weather. Seen on screen: "Punt · Fair catch" at the 20. Play changed: fingerprint re-pinned, the old value in
  pg.fingerprint.before-kicking. (Round 12 had stored its pin JSON-encoded twice; both values are plain strings now.)
  Audit empty at 320x568, 390x844 and 440x956; whole seasons at both positions, careers at both, exhibitions and a
  season with the rough test player clean; the playbook check passes.

- Tonight, round 14 (08:23): the list was done, so the next realism item was added and done: the two-point chart.
  The computer (and a career's coach) went for two only in the last 60% of the fourth quarter, at a lead after the
  touchdown of -2, -5, -10, -13, +1, +5 or +12: over 30 sim games, 2 tries in 134 touchdowns (0.07 a game; the league
  is about one in two games). Now wantsTwo() follows the modern chart: in the third quarter at -2, -5 and +1; from
  the fourth on, all of it, at -2, -5, -8 (the "down 14" play: make it and the next touchdown and kick wins, miss it
  and two still ties), -10, +1, +4, +5 and +12 (-13 is a kick now, as the newer charts have it). The quick try's
  success went from 45% to 48%, the league's rate. Over 120 games after: 32 tries in 494 touchdowns (0.27 a game),
  13 made. Seen on screen: a game summary with "15-yd pass ... (two-point try good)", a try down 5 in the third
  quarter. Play changed: fingerprint re-pinned, the old value in pg.fingerprint.before-two. Audit empty at 320x568,
  390x844 and 440x956; whole seasons at both positions, careers at both, exhibitions and a season with the rough
  test player clean; the playbook check passes. Noticed on the way: two teams can carry a player of the same
  surname (both leading rushers were "Moreau" in one game), which reads oddly in the leaders; a polish item, not
  touched.

- Tonight, round 15 (08:53): surnames. There were 30 for the 48 men in a game, so at least 18 repeated in every
  game, on the same team too ("2-yd pass from Dalton to Dalton"). Now data.js has 180 (the original 30 kept first,
  ordinary surnames, none recorded by the booth, which says no player names), and mkRoster() hands them out so no two
  men on the field share one: the second side's roster is drawn with the first side's names taken. freeName() makes
  one draw, as pick() did, then walks along the list to the next free name, so the game's generator runs exactly as
  before. A career's own name and its named teammates go in after the rosters, so a pass after them moves any
  generated man sharing a surname with them to the next free one, with no draws; an injured man's replacement also
  takes a free one. Measured: 0 repeats in 40 sim games, and 0 across a QB season (10 games) and a WR season (12
  games, the playoffs included). A season saved before this keeps its roster as it was. Seen on screen: the leaders on
  a game summary, six different names. Play untouched: fingerprint unchanged. Audit empty at 320x568, 390x844 and
  440x956; whole seasons at both positions, careers at both, exhibitions and a season with the rough test player
  clean; the playbook check passes.

- Tonight, round 16 (09:22): overtime's length and timeouts. An overtime period was a full quarter every time, and
  each side went into it with whatever timeouts it had left from the fourth. NFL rule: a regular-season overtime is
  one ten-minute period with two timeouts a side; a playoff overtime is fifteen-minute periods, with three timeouts a
  side for each pair of them. Now advance() sets the period to two thirds of a quarter in the regular season (2:00 at
  3-minute quarters) and a full quarter in the playoffs (mustWin), and gives fresh timeouts at the start of overtime
  (and of a playoff game's third period). Checked over 8 games forced to overtime: 2:00 and 2 each in the regular
  season, 3:00 and 3 each in the playoffs, every game ending properly. Seen on screen: "OT 2:00" with two timeout dots
  a side. Fingerprint unchanged (its sim has no overtime). Audit empty at 320x568, 390x844 and 440x956; whole seasons
  at both positions, careers at both, exhibitions and a season with the rough test player clean; the playbook check
  passes.

- Morning, 2026-11-16 (11:35), the owner's go-ahead after the status check: two console errors fixed, both found
  only by test runs. The 40-yard dash's clock kept ticking when another screen replaced it mid-race (the audit does
  this), throwing about sixty errors a second, and its space-bar listener stayed behind; now the tick stops the
  clock and drops the listener once the dash is gone. The booth's opening lines asked for a team's voice key about
  two seconds into the intro; when the game was already over by then (only instant test games), the All-Star sides
  had been taken off the team list and the lookup failed; vk() now treats a missing side as a renamed one (no
  name said). Each was reproduced on the old code first (31 errors in half a second for the dash; one for the
  booth, the All-Star sides removed while the intro was up) and gone with the fix; a full dash still finishes and
  scores (4.11 s, grade 100). Fingerprint unchanged; audit empty at 320x568 and 440x956 with no console errors;
  sims, exhibitions, careers at both positions, a QB season, the three drills and the rough test player clean.

- 2026-11-16 (12:10), the owner: "i want online play and global chat with free options". He chose Firebase's free
  Spark plan for the chat, phone to phone (PeerJS) for head to head, a name only, and the word filter with slow mode,
  mute and report, and deleting and banning from the console (docs/ONLINE.md). Built: an Online entry on the main menu
  and its screen (js/online.js): the name with its own colored badge, the global chat (the last fifty lines, the
  number online), a composer, mute and report on other players' lines, and unmute. The chat connects only while the
  screen is open and lets go in the background (the free plan's limit is 100 phones at once). Libraries load on
  first use from cdnjs with their integrity hashes. docs/firebase-rules.json is the database's rules: signed-in
  devices only, a line's own id, 1-16 character names, 1-140 character lines, the server's own one line per 2.5
  seconds, bans, write-once reports. Tested end to end against Firebase's local emulator (a demo project, no
  account): live with "1 online", sending, no name refused, a bad name refused, slow mode in the screen and in the
  database, a forged id, a 141-character line and reading the ban list all refused, another player's slur drawn as
  dots, a report stored with the line and both ids, a mute hiding a player, a line deleted as the owner vanishing at
  once, a ban blocking this device, the presence cleared on leaving. The filter: 16 disguises caught ("f u c k",
  "sh1t", "kill yourself") and 17 ordinary lines passed ("assistant", "Dickens", "music until"). Until the owner
  pastes the project's public config the screen says "Not set up" and has no composer. The audit now cuts a control
  in a list that scrolls inside the screen (the chat log) to the list's box, as a finger can only reach it there;
  page-level scrolling is judged as before. The service worker now caches only the game's own files, cdnjs and the
  fonts, so the chat and the matchmaking server are never answered from an old copy. Fingerprint unchanged; audit
  empty at 320x568 and 440x956 (the Online screen live, not set up, with a line's actions open and scrolled); sims,
  exhibitions, careers at both positions and the three drills clean, no console errors.

- 2026-11-16 (afternoon): the owner made the Firebase project from his phone (anonymous sign-in on, a Realtime
  Database in locked mode, docs/firebase-rules.json published) and pasted its public web config, now in js/online.js.
  Checked against the real project from the test page: signed in anonymously, live with "1 online"; a forged line,
  a line without its slow-mode stamp, reading or writing the ban list and reading the whole database all refused, so
  the published rules are the right ones; one line posted through the screen ("Setup check: Chat is open. Say hi!",
  his to delete); leaving the screen closed the connection. No console errors.

- 2026-11-16 (afternoon, "keep improving things bug fix and test more"): a test sweep (fingerprint, 30-game sims,
  the rough player in exhibitions, snow, careers at both positions and playoff-tie seasons, the three drills, the audit
  at 320x568 and 440x956, leaving a game from the pause sheet at random moments in all four modes, a hand-played
  drive at 440x956) and three fixes. 1: a damaged save (cut off, a number, null, or a list where a table belongs)
  crashed the Hall of Fame screen and would have crashed the record book; `load` now reads any save of the wrong
  kind as none (checked with six kinds of damage on every key: every screen opens, no errors). 2: playoff overtime
  re-kicked with a new toss at the start of every period; now the second and fourth periods carry on with the same
  ball, down and distance (ends changed), the third starts with a kickoff to the side that lost the first toss, and a
  period running out no longer ends the game while the second side's guaranteed possession is still to come or under
  way. 3: the two-minute warning now comes in the regular season's overtime period and in the second and fourth
  playoff periods (when the period is longer than two minutes). Fingerprint unchanged; X.bad empty; no console errors.

- 2026-11-16 (evening, "i need there to be a difficulty slider, and for the passing and throwing to be improved if
  possible, i don't want the controls changed though for throwing"). Difficulty: the three-button choice became one
  slider with five steps, Rookie, Starter, Pro, All-Pro, Legend (Exhibition, New season, Career settings; shared code
  `diffSlider`/`bindDiff`/`lvlOf` in game.js). It sets the opponent's ratings (-6, -3, 0, +5, +9) and, new, how the
  computer plays against you (`hard()`): how fast its defenders react to your throw (30% slower at Rookie, 30%
  faster at Legend), how often they hold on to a ball they reach (35% either way), and its quarterback's accuracy
  (25%). Training camp keeps its own scale. Old saves keep their level (old Pro is Pro, old All-Pro is All-Pro);
  the slider saves `dl`. The career XP bonus: All-Pro 20%, Legend 30%; "Giant killer" counts All-Pro or Legend.
  Passing: a bug. On a thrown ball the receiver ran flat out at the landing spot, arrived early on anything long,
  could not stop, and was a yard or two past it when it came down (deep balls landed 1.0 to 1.4 yards from him on
  average). He now times his run to arrive with the ball and catches it in stride (0.1 to 0.3 yards); defenders
  playing the ball do the same. The catch odds were retuned for it (base 0.83, a defender at the ball counts 0.6,
  picks 0.2) so the league stays NFL-like: 30 games, 67% completions, 2.4% interceptions, 4.3 a carry, 36.5 points.
  The throwing controls are unchanged. New tool `tools/passcheck.js`. Fingerprint re-pinned (old value in
  pg.fingerprint.before-passing); X.bad empty in exhibitions and careers at both positions; drills, season start,
  career settings and old-save levels checked; a hand-thrown 40-yard ball at 440x956 caught for a touchdown.

- 2026-11-16 (late, "improve the commentary lines and social media comments"). Booth: 15 lines rewritten and 119
  takes added (361 to 480), recorded with the same local Kokoro voices (135 new clips; the syllable check flagged
  none; every common clip decodes at its length). The most heard calls (short and good passes, runs, incompletions,
  touchdowns, sacks, picks, field goals) have more takes, and the analyst explains plays (the safety biting, a
  hat on a hat, the cutback lane, eyes on the receiver). A wording bug fixed with it: the final whistle and halftime
  calls said "the home side" wins or leads whenever your team did, home or away; they no longer say who is home.
  Pack 4.2 to 5.6 MB. Social: the thinner pools roughly doubled; fans on both sides react to how the game went
  (`shapeOf` in media.js: a nail-biter, a rout, overtime, a tie, with the score, each side's own score first) and to
  a big stat day (300 passing yards, three touchdown passes, 100 receiving yards, two touchdown catches); podium
  answers in the confident, respect and deflect tones now draw posts too (only own, team, humble, trash and
  guarantee did). Career passes `ot` to the reaction. 400 generated games: 22,787 posts, 1,432 different, none
  with a hole in it. Also: the menu figure, squeezed to about 22px when a career and a season are both saved, cut
  its name tag (audit at 440x956); it now hides under 90px (a container query). Fingerprint unchanged; audit empty
  at 320x568 and 440x956; exhibitions with the booth on and careers clean.

- 2026-11-16 (night, "it feels like i can't hit throws that should be made and feel good, i don't understand how it
  works accuracy wise improve it"). Measured with tools/passcheck.js: a wide-open receiver (3+ yards of room at the
  catch) with the ball on him (0.1 yards off) still failed to catch it about one time in five, shown only as
  "Incomplete"; the league's 66% leaned on those random misses, because nearly half of all throws arrived with no
  defender within five yards. Now: (1) the catch (resolvePass) runs from 92% with 3.2 yards of room (less 0.8 a yard
  past twenty in the air, plus or minus his hands) down to 15% with a defender on him, with no cliff; interceptions
  0.16. (2) Defenders break on the ball whenever they can get there in time (defAI), so a bullet beats the men
  closing and a floater lets them arrive. (3) A green ring on a receiver's letter, on the field and on the pad's
  button, when a throw to him now would arrive with room (`roomFor`, the same flight and reach as the play, and the
  difficulty's reaction speed). Checked: thrown at random, ringed throws were caught 20 of 20, others 34%; at Pro and
  Legend ringed throws 91 to 100%. (4) An incompletion says why: Pass broken up, Dropped, Overthrown, Underthrown or
  Off target; two new booth calls (pass.drop, pass.under, recorded). The tips explain the ring and the power. League:
  30 games, 71 to 74% completions, 1.4 to 2% picks (raised to 0.16 after), 4.2 to 4.4 a carry, 33 points. Controls
  unchanged. Fingerprint re-pinned (old in pg.fingerprint.before-catch); drills, careers, the rough player and the
  audit at 320x568 and 440x956 clean.

- 2026-11-16 (night, "i want it to be like, u could be covered super well, but if the throw is perfect and the person
  catches it then it's a catchable ball"). The perfect throw, with the same controls: every throw has a right power
  (`idealPow`: zip short, touch long, from 0.9 of the bar at six yards to 0.3 at forty-five), drawn as a white band on
  the power bar and a white arc on the letter's ring while you hold. Let go within a tenth of it and the throw's
  quality is 1, fading to 0 a quarter of the bar away (`throwQ`). Quality makes the ball tighter (error down to 40%),
  lifts the catch with a man on him from 15% to 60% (good hands count double there), and cuts picks (by up to 75%).
  After the throw the bar says Perfect, Good, Too soft or Too hard; the analyst has three new lines for a perfect
  ball caught in tight coverage (a.perfect, recorded). The computer's quarterbacks keep throwing at a half (their
  ball speed unchanged) and roll their quality by accuracy. Measured: perfect throws to random receivers 86% caught,
  75% in tight coverage; floated ones into tight coverage 23% with picks; league 75 to 78% completions (75% before,
  same sample size), 1.8% picks, 4.4 a carry, 38 points. Fingerprint re-pinned (old in pg.fingerprint.before-perfect);
  drills, careers, the rough player and the audit at both sizes clean.

- 2026-11-16 (night, "improve kickoff strength because it's so easy to have a touchback always"). Your kickoff: the
  timing bar's green was a touchback every time (and under the current rule a touchback is their ball at the 35, the
  worst deep result for the kicking side), and an ordinary swipe reached full power. Now the middle of the green
  lands about two yards short of the goal line (12% carry in for a touchback), the edge of the green about five,
  further off shorter, and a miss short of the landing zone (their ball at the 40); a kickoff swipe takes a bigger
  swing (0.55 of the screen for the length part, 3.2 px/ms for the speed part): an ordinary swipe lands at their 11
  to 19, a strong one near the goal line (15% touchbacks), only a long, quick flick goes deep into the end zone; and
  every kick varies 2.5 yards either side (`kickoffTo`). Measured on 30 kicks each: their drive starts at the 20 on
  average after a kick in the middle of the green, the 24 at the edge, 26 to 28 weaker, against the 35 on a
  touchback. Field goals, punts and the computer's kickoffs unchanged; fingerprint unchanged; the rough player, an
  exhibition with the harness player, a career and the audit clean. Test hooks: dbg.beginKickoff, dbg.kickBySwipe.

- 2026-11-16 (night, "i just can't throw good like the start, keep improving throwing and such, play the game like a
  normal player multiple tests"). New `tools/human.js`: a quarterback that throws like a person (a human beat, a
  misjudged look, uneven holds on the bar), run against this morning's version (dbf6e55, served from a scratch copy)
  and the current one, 3-minute quarters. At All-Pro the evening's changes had made it worse to play: throws arriving
  in tight coverage 22% to 38%, caught there 52% to 35%, deep 59% to 42%, points 7.5 to 4.8 a game, with "Pass broken
  up" most of the misses; the overall rate hid it. Causes: defenders broke on any ball they could nearly reach (2.5
  yards of slack), All-Pro made them react faster on top, and an ordinary throw into coverage was caught 15% of the
  time. Now: they break only on a ball they can reach (1 yard), the difficulty's reaction speed-up is 20% at the
  ends (was 30%), an ordinary contested ball 33% (perfect 70%), the white band is wider (perfect within 0.12, some
  credit out to 0.35), the bar no longer says Too soft or Too hard, open on-target balls 94%. And quarterbacks miss
  now and then (off target: behind him, at his feet, over him; 5% plus distance, pressure and a weaker arm, never on
  a perfect throw), which keeps the league near this morning's: 30 games 75 to 77%, picks 0.22. Human player, 10
  games each: Pro 77% (this morning 67), tight coverage 50% (38), deep 60% (52), points 13.3 (13.1); All-Pro 71%
  (66 to 68), tight 51%, deep 66%, picks 2.5% (5 to 9). Fingerprint re-pinned (old in pg.fingerprint.before-feel);
  drills, careers, the rough player and the audit at both sizes clean.

- 2026-11-16 (night, "i really like ... being able to see open players on the buttons ... i feel like it's the same
  players being open"). Measured over 113 pass plays with random play calls: the ring was on the running back on
  every play (fullback too), on flat, swing and drag routes 75 to 90% of the time, and on deep routes almost never
  (go 1%, seam 3%, post 6%, curl 4%); outside receivers 13 to 31%. Causes: man coverage mirrored every cut without
  losing a step, and zone defenders stood on the same landmarks every snap. Now: at a receiver's break his man keeps
  going for a beat (0 to 0.55 s: the sharper the cut, receiver against defender, and some luck; defAI), zone
  landmarks move up to 2.5 yards across and 1.5 deep each snap (not in camp), and the ring has two strengths: bright
  for a man open 4 yards or more past the line, faint for a check-down (the field ring and the pad's button). After:
  a bright ring on 63% of pass plays, spread over the tight end 41%, slot 32%, outside men 21 to 31%; the back only
  ever faint; on the same play call the first bright man is the same one 68% of the time. League 76% completions,
  1.6% picks, 35 points; the human player at Pro 77%, deep 79%. Fingerprint re-pinned (old in
  pg.fingerprint.before-breaks); careers, the rough player, drills and the audit clean.

- 2026-11-16 (night, "keep improving the throwing and catching and improving the green things on the buttons make it
  like before it was better than now"). The ring is one bright green ring again for any open man (the faint
  check-down ring is out; receivers still win at the break and zones still shift). Throwing, from 231 throws by the
  human test player at Pro and All-Pro: a third of the misses were throws off target (a miss the player did nothing
  to cause), floated balls were caught 54% against 92% for firm ones, and All-Pro picks ran to 8%. Now: your own
  throws miss their man less, by the difficulty (0.3 of the computer's rate at Rookie, 0.55 at Pro, 0.85 at Legend;
  the computer's quarterbacks unchanged); the power bar fills fast at first and slower near the top (power = hold
  fraction to the 0.6, `pwOf`), so a natural quick tap is a touch pass, not an extreme lob; the floater's slowest
  speed and highest arc are milder (0.9 and 1.35, were 0.84 and 1.45); and the harder settings add 20% to the
  computer's hands on your throws at the top (was 35%). After, 256 throws: Pro 87% with no picks, All-Pro 82%, picks
  3.6%, floated balls 72%. Fingerprint unchanged (all of it is your throws only); the passing drill 4 to 5 (3 stars);
  careers, the rough player and the audit clean. Test hooks: dbg.CHARGE, dbg.holdFor.

- 2026-11-16 (night, "i just finished a season and won the championship, not a lot of things recognize that i did win
  it, and i lost the mvp even though i considerably had a lot more of everything than second place, add a finals mvp
  as well and make that whole experience better"). The MVP bug: your MVP and Offensive Player of the Year came from
  your average game grade (8.2, or 7.5 with a playoff trip) while the other candidates were judged by numbers, so a
  far better season could lose. Now a vote (`vote` in career.js): every team's quarterback, back and receiver and you,
  scored the same way: season production against the median starter at that position, plus the team's record, and
  for the MVP a lean toward quarterbacks; your grades only break a near tie. The award cards show the winner's line.
  All-League: leading your position (receivers: the top two) puts you on it whatever the grades. New: the
  Championship Game MVP, the winning side's best man in the title game (`playerOfGame(only)` in game.js, `wmvp` on
  the result); yours is +1,000 XP, an honor in the record book and the Hall of Fame, a trophy ("Biggest stage"), and
  a card at awards night read out just before the MVP (the announcer's line recorded). The title itself: the results
  sheet says Champions with a card in the team's colors (title number, never gold) and the MVP card; the hub's season
  card is marked League champions with the MVP; the booth calls "The {team} are your champions!" (recorded for every
  team) in career and season title games (`title` on startGame); the feed leads with the league, the team, a
  trending tag, the MVP announcement, fans, the rival and an old player, and a lost final draws its own lines; the
  first podium question is about the title. Tested: a forced title season (Championship Game MVP to the
  quarterback), a forced one where you are the MVP (award, XP, trophy, record, awards night), 90 title feeds with no
  holes; fingerprint unchanged; careers, a season and the audit clean. Test hook: PG.career.vote().

- 2026-11-16 (night, "idc how u have to give me mvp on my game copy on my phone, idc how u do it"). His save is on
  his phone, which nothing here can reach, so the fix goes in the game: a one-time re-count (`recount` in career.js,
  run when the hub opens). The last finished season's MVP and Offensive Player of the Year are voted again under the
  new rules: exactly when the season is still on its closing screen, otherwise from the record book's line, games and
  team record (the other teams' records are not kept, so they count as .500). An award won is added with its XP
  (1,200 and 800), to the honors, the record book and the awards night card, with a banner, a fanfare and a note on
  the hub, once; `C.recounted` keeps it from running twice. Tested on a dominant season with the awards stripped as
  an old save would have them (both paths grant both awards, +2,000 XP, nothing on a second visit) and on an
  ordinary season (nothing granted). Fingerprint unchanged; careers and the audit clean.

- 2026-11-16 (night, the owner's screenshots at 19:23: awards night still giving the MVP to Bowen, the season card
  already the new "League champions" one). His phone was running career.js from the 19:14 push, two minutes after
  the 19:21 re-count went live: the service worker fetched with the browser's ordinary cache, and the site lets a
  copy be reused for ten minutes. The re-count had not run (it marks a season only when it does), so it will on the
  next open. Fix for every push from now: the service worker asks for the game's own files fresh each time
  (`cache: 'no-cache'`: the server answers "not changed" in a few bytes); libraries and fonts, versioned in their
  addresses, may still come from the cache, and with no connection the saved copy still plays.

- 2026-11-16 (night, "work on the crowds and stands, but also work on the textures and such"). Stands: each deck's
  four slopes now carry a seat grid measured in the world (`aSeat`, built by crowdRing in render3d.js): a seat 0.55
  yards wide everywhere (the end stands' seats had been half again as wide as the sides') and a row about a yard deep
  (rows had been twice that, so fans were tall and thin). The crowd shader: twenty-seat sections between concrete
  stairways with a handrail, tunnels into the lower bowl, a rail along the front, each row lit on its step and dark on
  its riser; fans dressed mostly in home colors with plain clothes among them and a pocket of visitors in one corner,
  shoulders, a head with hair or a cap, a little sway, and on a big play most stand, hop and raise their arms. Every
  edge is softened by the size of a pixel in seat units (hard edges sparkled as static; flat per-seat blocks, tried,
  looked like a mosaic), far off it settles to the crowd's average with a slow mottle, and a stand seen edge-on keeps
  its rows. Players: a finish per part (`partMat`, SH.rim(material, kind)): jersey cloth (an athletic mesh that fades
  where it would be under a pixel, and folds) on the torso, pads and sleeve caps; a helmet clear coat reflecting the
  ring of lights and the sky, darker below, stronger at the edges; Phong metal facemasks; satin pants. The menu and
  test models use the same. Turf: wear down the middle between the hashes. Fingerprint unchanged; the rough player,
  careers and the audit clean. Not measured: the frame rate on a phone (the test pane was hidden).

- 2026-11-16 (night, "we need to change the game name entirely to PocketFootball"). Renamed wherever a player sees it:
  the title screen (POCKET / FOOTBALL, one word that may break in two on a narrow phone), the turn-your-phone
  message, the page and home-screen titles, the manifest, the stadium video board and the sideline pads
  (POCKETFOOTBALL), the shield painted on the field (PF), the one-file build's title, the README and every file's
  header. Kept: the saved-data keys (pg.*, so every career, season and setting carries over), the internal PG
  namespace, the service worker's cache name, and the repository and web address (pocket-gridiron), until the owner
  says whether to move them. The fictional outlets in the feed ("The Gridiron Ledger") are left as they are.
  Audit empty at 320x568; the title fits.

- 2026-11-16 (night, "PocketFB for the home screen, change everything to the new name move to new address and such as
  well"). Home-screen name PocketFB (manifest short_name, apple-mobile-web-app-title). The repository renamed to
  pocket-football, so the game is at https://eddyarriaga00.github.io/pocket-football/; the old address keeps working
  through a one-page repository named pocket-gridiron that forwards to the new one (keeping any ?query and #hash).
  Saves carry over: they belong to the site (eddyarriaga00.github.io), not the path. The one-file build is now
  pocketfootball.html (the same single-file copy), the service worker's cache pocketfootball-v1. Kept on purpose:
  the saved-data keys (pg.*) and the code's PG namespace, which no player sees.

- 2026-11-16 (night, "i dont care about the old links honestly u can remove them etc, anyways lets keep improving the
  textures and visuals of the game"). The forwarding repository at the old address was deleted (it was today's,
  one commit); /pocket-gridiron/ now 404s, by the owner's choice. Visuals: every player part is darker near the turf
  and a touch brighter at the head (world height in the rim patch, vGroundY), so men stand on the grass instead of
  floating evenly lit; the apron beyond the field's pad is turf (a canvas with long mown bands and grain) instead of
  one flat dark green; each sideline's team area (between the 30s, outside the border) is outlined in white with
  the turf inside worn darker; the football is pebbled leather, darker at the tips, with a soft sheen. Also: the
  test server (tools/serve.py) queues 128 connections; the default five dropped scripts when the page asked for
  fifteen at once, which showed as the 3D view not starting in the test pane. Fingerprint unchanged; the rough
  player, careers and the audit clean.

- 2026-11-16 (night, "i obviously don't want a realism look ... i want visuals and texture and more to be better
  looking but i don't want it to look more realistic ... u can research and use anything u need"). Research (three.js
  forum and NPR tutorials, stylized art-direction write-ups): cel shading in two to five bands is cheap on phones,
  shadows read better tinted than only darkened, inverted-hull outlines are the cheap outline, and a limited bold
  palette with less fine detail keeps play readable. Built as a second style, Settings → Look → Style (Classic /
  Stylized; the page reloads, saves kept; `SET.look === 'toon'`, `SH.toonOn()`): players in MeshToonMaterial with three
  bands and cool tinted shadows, a hard-edged painted highlight on helmets, no cloth noise; an ink outline round the
  big parts (the same instances again, back faces pushed out 0.018); the turf clean (grain and wear off, bolder
  mowing stripes); the crowd and the whole picture more saturated (the finishing pass 1.28 instead of 1.1). Classic
  stays the default until the owner picks. Fingerprint unchanged; the rough player, careers and the audit clean in
  the stylized look; no shader errors.

- 2026-11-16 (night, "default to new style so i can test"). Stylized is now the default: everyone who has not chosen
  gets it (`look !== 'classic'`); Settings → Style still switches to Classic.

- 2026-11-16 (night, "make default accent color white"). White is the default accent; settings saved with the old
  default (blue) switch to white once (`accV: 2`), and an accent picked after that sticks. Audit empty at 440x956.

- 2026-11-16 (night, "improve the contracts and more things improve time and events, add news to the league and more
  for socials, organize it better to not clutter with many messages to scroll up and down"). The career hub: the coach
  paragraph, the trust block and the chemistry card (each with its own note) became four tiles (XP, contract, trust
  with the role and drive share, chemistry) and one Inbox card holding whatever waits on you: the week's event, a
  contract extension, an endorsement offer, the coach's last word. Tabs: Upgrade, Season, News (new), Social, Stats.
  The next game's card carries its date (seasons open the Sunday after Labor Day, a year per season). News
  (C.lnews, newsAfter): your headline, an upset, a rout and a shootout from the week's other scores (regular season),
  the last unbeaten and the winless, a coach fired after 0-5, a stat leader (a different category each week), an
  injury around the league, two deals at the deadline (week 6), the champion and the big awards; filters All, your
  team, Around the league; a week's biggest story also goes into your feed from the League Wire. Contracts: a Season
  tab card (pay, years left, market value, career earnings, the incentive); an extension offered once in the last
  year of a deal when you are playing well (a B-plus over three games, trust 60), never below current pay, gone at
  season's end, with Ask for more once (likelier with trust and form); free-agency offers carry an incentive (make
  the playoffs +1,000, All-League +1,500, top three in your main stat +1,200, paid at season's end) and you can ask
  each team for 10% more once (it may raise, hold or walk away). Weekly events (about two weeks in three), one choice
  each with its effects shown: film with your partner, a hospital visit, radio, a party, a photo shoot, mentoring a
  rookie, the rival's clip, the trainer, autographs, the coach asking your idea, an agent leak, a players-only
  meeting. Social: eighteen posts a week (was 32), this week's top six first with Show all, one reply under each post
  and the rest folded. Tested: two full careers with free agency, forced extension and events, the news and offers
  screens at 440x956; fingerprint unchanged; the rough player and the audit clean.

- **2026-11-16 late: more commentary, more social variety, posts about what you did.** Asked for: "keep improving the
  comments on socials and commentary lines". Commentary: the calls that repeated most in four test games got more
  takes (third and short, second down calls, first and goal, team time-outs, team touchdowns, back catches, first
  downs, flags, kickoffs and returns, quarter ends, the two-minute warning, deep shots and more; 553 takes in all),
  and three new calls: a third-down conversion, a fourth-down conversion, a touchdown from forty yards or more.
  Social: the repeating pools grew (stat captions and their replies, the radio show, the former player, the rookie
  posts, the other team's player, the losing threads). New posts that follow your choices: the weekly event you
  accepted shows up the next game (your partner on the film session, the team account on the hospital visit, the
  radio on the interview, a fan who saw you out at the party, the photographer, the rookie you mentored, the rival
  answering, the autograph line, the reporter on the leak, the teammate after the meeting); season milestones
  (passing, receiving and rushing yards and touchdowns, tackles, sacks, interceptions) from the stat accounts; and a
  signing or extension from a reporter and fans (and your old team's fans when you leave). Hub labels at 10px, and the
  hub's tiles go two by two below 360px wide. Tested: every event post and both deal kinds generated, two full QB
  seasons and a WR season with milestones, the rough player, the audit clean at 320x568 and 440 wide; fingerprint
  unchanged (the new calls do not touch play).

- **2026-11-17: landscape on phones, the whole screen on a computer, a better controller.** Asked for: "make it work
  fully on landscape on mobile, and fully on pc, optimize controller to be better since a lot of changes have
  happened". Landscape: the "turn your phone upright" screen is gone; a phone on its side, a tablet or a computer
  gets the field across the whole screen with a narrower lens (no stretched stands at the edges) and the camera a
  little closer, the scoreboard and meters in a centered column, the menus in a centered 640px column, the play call
  five cards a page (pager and controller paging follow it), shorter sheets that stop under the scoreboard, a
  compact intro card, dialogs that scroll with their buttons whole, and the notch edge kept clear. Turning the phone
  mid-game redraws at the new size (no pause). The installed app may now rotate (manifest orientation any).
  Computer: the scoreboard and buttons a size up on big screens; keyboard badges on the buttons beside the field
  (Space, J, K, Shift...), receivers numbered 1-5 to match the throw keys; the menus and play call work from the
  keyboard (arrows move a ring, Enter picks, Esc back, Q and E tabs). Controller: the buttons beside the field show
  which button does what, with shapes on a PlayStation controller (receivers too); it takes over from the keyboard or
  the screen on any press; the d-pad moves the difficulty slider, opens the folded news weeks and replies, and the
  right stick scrolls long screens; it rumbles where a phone would buzz. Touch screens look as before. Also: two hub
  labels shortened (cut at 390 wide), and the audit now treats a card past the edge of a sideways-scrolling row as
  off screen. Tested: the audit clean at 740x360, 667x375, 1280x800 and 390x844 (menus, exhibition, career, season,
  camp); the rough player and a career sideways; rotation both ways mid-play; keyboard and a simulated Xbox and
  PlayStation controller through the play call, a snap, a run and a pass; fingerprint unchanged.

- **2026-11-17: more awards and achievements.** Asked for: "add more awards and achievements". Awards night (Career):
  Comeback Player of the Year (read out when last season graded C or worse and this one is good; wins at a B+
  average), the All-League second team (read out when you are on it: the next quarterback, the next two receivers),
  and Man of the Year every season (two or more community events accepted that season, the hospital visit, the
  autographs, mentoring the rookie, with a decent season), each with its own announcer line. Career trophies, 15 to
  31: Most valuable, Unstoppable (Offensive Player of the Year), First impression (Rookie of the Year), Back again
  (Comeback), Man of the people, Player of the Week, Weekly regular (five times), All-Star, Big numbers (2,000 passing
  or 1,000 receiving yards in a season), End zone regular (20 TD passes or 10 TD catches), Record breaker, Locked up
  (an extension), New city (a free-agency move), Franchise player (five seasons with one team), Iron man (50 games),
  Household name (a million followers). Milestones (every mode), 12 to 25: Gunslinger (300 passing yards), Half a
  hundred (50 points), Statement (win by 28), Nail-biter (win by 3 or fewer), Brick wall (win holding them under 150
  yards), Comeback (win from 14 down), Clutch (take the lead for good in the 4th or overtime), Legendary (win on
  Legend), Lifer (50 games), Full slate (finish a regular season), Perfect season (unbeaten regular season), Most
  valuable (League MVP in Career), Hall of Famer (voted in). Also: the one-file build leaves out code comments
  (tools/strip.js, checked by the parser to be the same program), which frees about 230 KB under its 16 MB limit;
  two more hub tile labels shortened. Tested: careers with the new awards forced and won, trophies and milestones
  earned, the audit clean at 390x844, the rough player, fingerprint unchanged in the game and in the one-file build.

- **2026-11-17: the NFL calendar.** Asked for: "make sure now that the schedule is similar to that of the nfl i want
  same amounts of games played and more all that to be the same, rules and more". Season and Career now play the NFL
  season (league.js, L.fmt 3): 17 games in 18 weeks with one bye (weeks 6 to 11), opponents by the NFL formula (the
  division twice, a same-conference division on a three-season rotation, an other-conference division on a four-season
  one, two same-place games in the conference from last season's standings, one same-place game across, the 17th
  hosted by each conference in turn), eight or nine home games, week 18 all division games, four primetime games.
  Playoffs: seven a conference (four division winners seeded by record, three wild cards), the first seed's bye, wild
  card 2 v 7, 3 v 6, 4 v 5, the first seed against the lowest seed left, conference championships, the final two weeks
  later on the calendar. A new bracket (four columns, seeds, the bye), a "Lost in the wild card round" finish (+100
  XP), the trade deadline after week 9, winter weather from week 12, a bye week note (and it heals a knock in Career),
  bye rows in Season's schedule. Scaled to 17 games: the league's season records (now the real game's marks; a
  ten-week mark under them goes back to the old holder), the season milestone posts, two trophies (4,000 yards / 30
  TD passes for a quarterback, 100 games for Iron man), Man of the Year at three community events. Saves mid-season on
  the ten-week calendar finish it, then move over. Rules checked: overtime (both sides get the ball, ten minutes in
  the regular season, fifteen in the playoffs), the kickoff touchback at the 35 and the two-point chart were already
  current. Quarter length stays a choice (the clock between plays is accelerated, as in console football). Tested:
  12 seasons of schedules checked game by game, 600 seasons through every playoff path, careers and a Season through
  the audit at 390, 320 wide, the rough player; play unchanged (the fingerprint differs only in the schedule, re-pinned
  as pg.fingerprint, the old one kept as pg.fingerprint.before-nfl).

- **2026-11-17: three-minute quarters by default.** Asked for: "by default quarter length should be 3 minutes like
  before". The code's default was already three minutes, but a pick was remembered: an exhibition opened at the last
  length chosen, and a career or season kept its own. Now an exhibition opens at 3 minutes every time, and each saved
  career and season goes back to 3 minutes once (C.qlV / S.qlV); a length picked after that sticks. Tested: saved 5-minute
  settings and career come back at 3; fingerprint unchanged.

- **2026-11-17: more field detail.** Asked for: "keep improving the field, add more details". Painted: a band of the
  team's second color a yard inside each end zone, the end zone names edged in that color over a dark edge; a thin
  dark edge under the yard numbers so they stay crisp far off; the lanes the ball lives in (down the middle and along
  each hash) trodden paler and flatter, most between the 20s. Built: goal post pads in the home team's color with a
  white band; yardage markers every ten yards just off the far sideline (white boxes with the number facing the field,
  orange G boxes at the goal lines; one mesh of faces on a six-number atlas, the bodies in the merged sideline mesh).
  Checked up close with the debug camera and at play distance upright and sideways; no new errors.

- **2026-11-17: ball carrier animations.** Asked for: "improve the animations". The survey found the juke was only a
  tilt of the hips, the spin only a turn, and a broken tackle not shown on the runner at all. Now the juke is two beats:
  the plant (low on the outside foot, shoulders and helmet selling the other way) and the cut (a hard lean into the new
  direction, the free arm thrown out for balance), its side read from the burst sideways; the spin goes low with the
  ball locked in both arms against the chest; and a runner who breaks a tackle stumbles through it (chest pitched
  forward, free arm flung out, a wobble at the hips) for under half a second (game.js counts it on p.shrugN, which play
  never reads). Checked frame by frame with the debug camera; fingerprint unchanged, the rough player clean.

- **2026-11-17: real motion capture for the throw.** Asked for: "research to help u here ... search for free things
  online, github repos may help, libraries and anything to help u", then "you have the okay for any file, check
  everthing and choose the best ones for my game". Researched: the CMU Graphics Lab motion capture database (free to
  use in a product, not to resell; football throws and catches, runs, cuts), Quaternius' Universal Animation
  Libraries (CC0, on a different rig and mostly not football), Bandai Namco's and Ubisoft's sets (non-commercial, or
  little sport), the three.js IK solvers (the figures already have their own). Downloaded ten CMU clips (BVH, the
  sfd158/cmu-mocap mirror) into a scratch folder, surveyed them (throws found by the speed of a hand over the head),
  drew them as stick figures, and chose 79_91: a clean overhand throw. Converted it to the figure's joints
  (tools/mocap: the arms fitted so the elbow and hand land where the thrower's did, since the figure's arm has no
  twist; the chest's turn and lean measured against the line of the throw), as the THROW table in render3d.js: the
  wind-up now eases into the real cock (shoulders closed, ball behind the ear, elbow high) as the power bar fills, and
  the throw plays the real whip, release and follow-through across the body (0.35 s in the capture, 0.32 in the game),
  the head turned back so the eyes stay on the receiver; lob and bullet still finish differently. Also from the
  captures: the juke's plant goes lower (a real hard cut takes the hips to about four fifths of standing, 78_28) and
  the running arms swing as far back as forward with the elbows bent past a right angle (09_01). A test strip,
  PG.r3d.throwStrip, draws the quarterback through the table. Checked in strips from the side and from behind and the
  stride measured; fingerprint unchanged, the rough player clean. Credit: the data used in this project was obtained
  from mocap.cs.cmu.edu; the database was created with funding from NSF EIA-0196217.

- **2026-11-17: the catch from real motion capture.** Asked for: "keep going" (after the motion-capture throw). In CMU
  34_01 (two players throwing a football to each other) the receiver takes a chest-high ball with the hands out in
  front of the chest and the elbows bent (about 70 to 80 degrees), then in a quarter of a second pulls it into the belly
  with both hands, the left hand crossing to the right, before it goes under one arm. Now a ball at chest height is
  taken that way (high balls still straighten the arms, over-the-shoulder and contested catches unchanged), and after
  every catch the receiver secures it with both hands for 0.26 s (the SECURE table in render3d.js) before the carry.
  Tried and left: the Cabbage Patch and the Twist in CMU 15_04 for touchdown celebrations; the clip is a three-minute
  mix and the dances could not be cut out reliably. Checked in the catch strips and catchTest; fingerprint unchanged,
  the rough player through a receiver's career clean.

- **2026-11-17: full 53-man rosters.** Asked for: "have full rosters with full character names and such, like normal
  nfl teams the same amount of players and such". New js/roster.js: every team carries 53 (3 QB, 3 RB, a FB, 6 WR, 3
  TE, 4 OT, 3 OG, 2 C, 4 DE, 5 DT, 4 OLB, 2 MLB, 6 CB, 2 FS, 2 SS, K, P, LS), each with a first and last name (all
  1,696 full names different, no surname twice on a team), a number inside the NFL's ranges for his position (none
  twice on a team), an age, a depth-chart place and his own rating against the team's. Made from each team's own
  seed (never the game's generator, nothing saved), the same men every game and season. Games take their starters
  from it (mkRoster: until now the starters were made up each game, surnames only), the sideline reserves are the
  team's backups in their own numbers, names and builds, and the player of the game is named in full. Season's
  Roster tab shows all 53 (starters in bold with their stat lines and the ratings they have grown), and its saved
  starters take the roster's names; Career's Season tab ends with the team's 53, you in as the starter at your
  position (the man you replace becomes the first backup, the last backup makes room) and the feed's teammates in
  their spots; a new career (or a move) takes its feed teammates from the roster. Balance over 16 computer games
  is where it was (75% completions, 2.1% interceptions, 3.9 a carry); the fingerprint re-pinned (now a team's starters
  are its own, so a matchup decides more), the old one kept as pg.fingerprint.before-rosters. The audit clean at 390,
  the rough player clean.

- **2026-11-21: movement reworked: a walk and a run are now different gaits.** Asked for: "improve running
  animations, improve walking animations, improve movement entirely". Measured real walks, jogs and runs (CMU
  captures 07_01, 08_04, 16_35, 35_17, 09_01, 09_03 with the new tools/mocap/gait.py) against the game's stride and
  rebuilt it on the numbers. Walking (under about 1.7 hip heights a second): a foot is down for more than half the
  cycle, lands on the heel with the toe up and rolls flat, the hips are highest over the planted foot, the arms hang
  nearly straight and swing about 0.45 either way, the body is upright (it leaned nearly as far as a jog). Running:
  the hips sink further under the weight and rise higher between steps (0.03 to 0.07 of their height, from 0.016 to
  0.05), the heel snaps up sooner and higher behind him, the elbows stay bent past a right angle at every speed (they
  opened out at a jog), the hands go further back than forward, the lean grows with speed. Both: the hips roll with
  each step and the shoulders tip the other way (a new chest-roll channel, CHRZ; each leg is solved from where its hip
  joint really is, so the feet still stay where they land, also under a lean into a cut), the shoulders turn against
  the hips at a walk too, the helmet stays on where he is going, the feet land nearer his line than straight under
  the hips, and he leans into a start and back against a stop, the hips sinking as he brakes. A backpedal keeps the
  chest over the toes and the hips low (it leaned back). Officials, the chain crew and the reserves who pace the
  sideline walk on the same stride (the pacers' legs were two sine waves and their feet slid). Measured (gaitTest,
  which now follows the heel and the toe separately): a planted foot moves at most 1.1 cm at a walk and 2.2 cm flat
  out, and never sinks more than 0.2 cm; strips checked from the side and the front at a walk, a jog, a sprint and a
  backpedal; fingerprint unchanged, the rough player through two games and a career clean.

- **2026-11-21: everyone a little quicker.** Asked for: "make everyone move a little quicker". One number, QUICK =
  1.07 in data.js: every position's top speed and every man's acceleration are 7% up (a career player's and a saved
  season's starters too: Season now works a starter's speed out from his rating each time instead of keeping it).
  Two things were moved with it so the game plays as it did. The thrown ball is 7% quicker, so a pass meets the
  coverage as before. Pass protection holds 21% longer, because a free rusher now closes on the quarterback sooner
  (without it sacks went from 4.3% of dropbacks to 5.6%). Over 48 computer games on the same seeds, old speeds
  against new: completions 75.6% and 75.0%, interceptions 2.7% and 2.5%, sacks 4.3% and 4.8%, 4.17 and 4.04 yards a
  carry; about 7% more plays fit in a game, so scores are a few points higher. The human-like test quarterback
  completes 92% (88% on the old speeds). The stride at the new top speed still keeps a planted foot within 2.2 cm.
  Fingerprint re-pinned (the old one kept as pg.fingerprint.before-quick); the rough player through two games and a
  career clean.

- **2026-11-21: quicker legs.** The owner on the 7% speed-up: "i meant like how quick they move movement wise increase
  that cuz it feels like they walk/run too slow": the turnover of the legs and arms, not the speed over the ground.
  The figures are drawn half as big again as life, so a stride sized for the body turned over slowly. Every step is
  now 22% shorter (CADENCE in render3d.js; a shuffle's 12%), so at the same speed the legs and arms go 22% quicker:
  about 1.9 steps a second at a walk (1.6 before), 3.6 at a jog (2.9), 4.3 to 4.7 flat out (3.5 to 3.8), close to what
  people do. The hips travel a little less far over a planted foot, so a runner is still in the air between steps.
  Officials, the chain crew and the sideline walkers follow. Drawing only: fingerprint unchanged; a planted foot moves
  at most 1.9 cm, sinks at most 0.3 cm at the very top speed; strips checked; the rough player clean. The 7% speed over
  the ground from earlier today is still in; the owner is asked whether to keep it.

- **2026-11-21: a rag doll on the falls.** Asked for: "what i need now is better rag doll physics and such". A fall
  was one pose eased to another in 0.3 s, the same for every tackle. Now (render3d.js: hitOf, ragHit, flop) a hit has
  a size (how fast the two men were closing, from their speeds a frame before the hit) and a direction (which way it
  shoves him, in his own frame). A hard hit puts him down in 0.21 s and a drag-down from behind in 0.36; a hard one
  head on lifts him off his feet first. Fifteen joints (shoulders, elbows, hips, knees, chest, helmet) are weights on
  springs: knocked backward his arms and legs are left out in front and his chin goes to his chest, knocked sideways
  everything is left on the side the hit came from and he turns as he goes down; limp while he falls, stiffening as
  he gets up. Where he lands the body bounces (higher the harder the hit, then a second small one) and the limbs are
  jolted outward and settle. The arm with the ball keeps most of its hold; the tackler and the men who pile on feel a
  share of it; a man run over is knocked the way the runner was going; a quarterback's slide and the staged falls in
  cutscenes are left alone. The poses he ends in and the solver that keeps everyone on top of the turf and out of each
  other are as they were (staged tackles from six angles: nothing under the turf, the two bodies clear of each other
  from 0.3 s). Drawing only: fingerprint unchanged; the rough player through three games and a career clean.

- **2026-11-21: gang tackles.** Asked for: "improve more, especially with multiple people tackling the same person".
  One defender tackled; up to two more near the play lay flat across the runner's chest afterwards, arms out, and
  with the tackler that made a stack three men high that the runner did not feel. Now the first man in goes high
  (chest onto the runner's, arms round him) and the second comes in beside him a beat later (0.12 s), short of the
  others, on the turf at the runner's shoulder with both hands on him. Each hits as he arrives, sized by how fast he
  was coming: the runner's rag doll takes a second and a third shove from where each man came (ragKick: added to
  what his limbs are already doing, and if he has landed he is bounced again), the tackler under them feels a share,
  and each of them has his own landing. Also on every fall: the whole body rocks away from a hit in the side and once
  more where it lands. A test for it: tackleStrip(angle, { gang: [angle, angle] }) stages one or two more defenders.
  Two-man tackles from four angles still have nothing under the turf and the bodies clear of each other; fingerprint
  unchanged (drawing only); the rough player through three games and a career clean.

- **2026-11-21: the rounding-out pass.** Asked for: "what is missing to make this a fully rounded and ready to play
  game, add those details and more". An audit of what a finished game has that this one did not, and what was built:
  - **Kickers and punters.** Field goals, extra points, punts and kickoffs were performed by the quarterback's (or
    the middle linebacker's) figure, name and number. Now the roster's K and P do them (`asSpec` in game.js;
    `PG.roster.spec`): their number on the field, their name in the scoring log ("Thorne 42-yd field goal",
    "(Thorne kick good)"), and a Kicking line in the leaders (FG and XP made/tried, box key `K`). Drawing and
    bookkeeping only: the fingerprint is unchanged.
  - **Injury substitutes.** The man who came on for a shaken-up player was a made-up name and number. Now he is the
    next man at that position on the 53 (`PG.roster.backup(ti, slot, skip)`: a second injury at the position takes
    the man after him; the one fullback is covered by a running back). Same slower, six-points-lower sub as before.
  - **Saves** (Settings › Saves, `showData`): what is saved and its size, Save file (share sheet on phones, a
    download elsewhere), Copy as text, restore from a file or pasted text (checked: this game's keys only, each one
    readable; asks before replacing), and Erase everything behind a second tap. Backup format:
    `{ app: 'PocketFootball', v: 1, version, at, data: { 'pg.*': string } }`. Nothing leaves the device.
    Inside another page (the embedded single-file copy, which may not hand over a file) only Copy as text is
    offered (`framed`).
  - **About** (Settings › About, `showAbout`): the version (`VERSION` in data.js, now 1.0: raise it when a release
    changes what players see), how to install to the home screen, that the league is fictional, and the credits
    (three.js, Kokoro-82M, Archivo, and the CMU motion capture acknowledgement its licence asks for).
  - **Rosters** (Settings › League › Rosters, and a Rosters button on the Exhibition screen, `showRosters`): any
    team's 53, stepped through with the arrows.
  - Small: a long name in a roster row wraps instead of being cut (the audit found it at 320 px); typing in a text
    box no longer moves the keyboard focus ring.
  Already there, so left alone: the first-time training camp offer, coin toss, two-minute warning, kneel and spike.
  Checked: fingerprint unchanged; X.exh 3, X.career QB 2 and WR 2 clean; the kickoff and a punt show the right man;
  backup → restore gives back every key byte for byte, erase leaves only fresh settings; the audit is empty at
  390x844, 320x568, 740x360, 667x375 and 1280x800 (it now walks the three new screens). Build 16,630,628 bytes
  (about 146 KB under the limit). Still missing, not built without his say-so: head-to-head online, roster changes
  between seasons (draft, retirements), punting stats, cloud saves across devices.

- 2026-11-21: closer to the pro game (the owner: "make it more close to the nfl as possible"). Read against the
  current rules first; most were already in (overtime, the touchback spots, the two-minute warning, the clock out of
  bounds, the flags, the 17-game calendar, numbers by position). What was not, now is:
  (1) The kickoff lines up as the league's does now: the kicker alone at his 35, ten cover men on the other 40,
  seven of the receiving side on their 35 and two just behind, two men back deep; nobody but the kicker and the men
  back deep moves until the ball is fielded (`beginKickoff`, `ps.ko.dyn`, `kickTick`). Measured over 40 kicks each
  way: returns end at the 23.6 on average, 21.3 with the old running start. `window.PG_KOOLD` brings the old one
  back for measuring. (2) After a safety the side that gave it up kicks from its own 20 (`G.freeK`,
  `beginKickoff(t, true)`): the old line-up with a running start, no landing zone, no touchback aimed for. Unwatched
  games still spot the ball at the 35. (3) Play clock: 40 seconds after an ordinary play, 25 after a stoppage or a
  change of possession (`PC`, `PC_ADM`, `G.adm`); it was 35 always. (4) Challenges: winning one earns a third
  (`G.chalWon`); after the two-minute warning of either half and in overtime no coach may challenge, and the booth
  puts a wrong spot right itself at no cost (`boothTime`, `resolveChallenge(t, true)`). (5) The stat sheet: first
  downs, third downs, sacks, penalties and yards, time of possession (`ts`, `topTick`, kept out of `G.stats`, which
  the fingerprint reads); leaders add the passer rating and interceptions, a Defense line and a Punting line
  (`prating`, `dscore`, box keys punts / puntyd / in20). (6) Standings: your division's table shows division and
  conference records and the streak (`dw`/`dl`, `cw`/`cl`, `sk` in `league.js`); ties break on head to head, then
  division record for sides of one division, then conference record, then points. Version 1.1.
  Checked: fingerprint unchanged; `X.exh(3)`, `X.career` QB and WR, `X.season(1)` clean; a staged free kick both
  ways; a staged booth review and third challenge; play clock 40 / 25; possession summed to the game's length; audit
  empty at 320x568, 390x844, 740x360, 667x375, 1280x800. Not done: an onside kick may still be tried only late
  (the league now lets a trailing side declare one at any time); blocked kicks; fouls on returns; offsetting fouls.

- 2026-11-21: no teleporting between plays, and the last four rules (the owner: "no teleporting and floating ...
  play after play they have to walk to the spot not float over"; and "continue" on the four rules left over).
  Between plays (`keepOn`, `walkOn`, `stoodNow`, `tween` in `game.js`): the field used to be emptied when the
  play-call sheet opened, and the next line-up appeared in a huddle (or, for kicks and kickoffs, already in place).
  Now the men who were on the field stay on it and walk (jog, for a long way) to where the next huddle forms while
  the sheet is up; the next line-up takes each man from where he stands (the same man, else the nearest of his side
  who went off, else his own sideline) and he jogs to his spot in 1.1 to 2.6 seconds by distance. Kicking units and
  kickoffs run on the same way. The snap and the kick wait for the last man instead of dropping him on his spot.
  Watched games only: simulations and drills are as before. A tackled man is simply on his feet when the walk
  starts (there is no get-up move yet).
  Rules: your onside kick is offered whenever you trail in the fourth quarter or overtime (was only the last
  minute or so; the computer still tries only late); a field goal is blocked about one time in fifty
  (`ps.kick.blocked`); a block in the back on about one return in fourteen of eight yards or more, ten yards from
  where the returner went down; offsetting fouls on about one after-play flag in seventeen (down replayed). The
  last three are watched games only and off the game's generator, so the fingerprint is unchanged. Version 1.2.
  Checked: fingerprint; `X.exh(6)`, `X.career` QB and WR, `X.season(1)` clean; in a staged game 22 men were on the
  field with the sheet up and moving to the huddle, and jogging in from there after the call. Not watched on
  screen (the test pane's screenshots lag a frame behind): judge the walk by eye on the phone. Blocked punts and a
  foul that brings back a return touchdown are not in.

- 2026-11-21: the rule book, What's new, and three more rules (the owner: "if it's in the nfl add it ... add a
  what's new tab for new additions and make sure to somewhere address all the rules in the game"). Version 1.3.
  Rule book (`RULES`, `showRules` in `game.js`): every rule the game plays by in seven groups (the game, scoring,
  kicks, overtime, flags, replay, the season), as cards with the How to play pictures; from Settings › Rules and
  from How to play. Written from the code, so change a rule and its card together. What's new (`NEWS`, `showNews`):
  versions newest first; from Settings › Help and How to play. Add an entry and raise `VERSION` with every release
  players can see. Rules: a punt is blocked about one time in 125 (other side's ball behind the line); a kick or
  punt return for a touchdown is called back about one time in twelve for a block in the back (`ps.callBack`); an
  onside kick is offered before any of your kickoffs while you trail. All watched games only, off the generator.
  Fixed on the way: the final sheet ran 14 px wide on a 320 px phone when a leader's line was long (it wraps now);
  the menu tagline's contrast over a bright scene. Checked: fingerprint; `X.exh(6)`, `X.career` QB and WR clean;
  audit (now walking the rule book and What's new) empty at all five sizes.

- 2026-11-21: art from an image tool (the owner asked for art from an image tool, then "do
  the menu and icon"). Version 1.4. Two pictures drawn by an image tool, prompted with no
  name, no text, no logos and no yellow: a navy helmet with a white stripe and teal mask under floodlights (the
  home-screen icon: `icons/icon-512/192/180/32.png`; the old drawn `icon.svg` is gone so browsers show the new one)
  and a quarterback throwing in a night stadium (`art/title.jpg`, 1280 wide, 205 KB), shown behind the name at the
  top of the main menu (`.home .kv` in `game.css`: the picture and a dark fade on its `::before`, so the name
  reads on the left and the audit can read the background). Credited in About; listed in What's new. The full-size
  originals are not in the repo. Checked: fingerprint; audit empty; looked at on 320x568, 390x844, 740x360 and
  1280x800. An installed home-screen icon may not change until the game is removed and added again.

- 2026-11-21: pictures built into the menu's boxes (the owner: "... make custom boxes or
  ui that is more integrated with things"). Version 1.5. Five more pictures from the image tool, same recipe
  (subject in the right third, the left dark and empty, no text, no logos, no yellow): a player walking out of the
  tunnel (Career), a silver trophy in confetti (Season), two helmets nose to nose (Exhibition), cones and a sled
  (Training camp), a ball in a web of light (Online); `art/m-*.jpg`, 900 wide, 70 to 90 KB each. Each sits on the
  right of its box behind a fade into the panel (`.home .mode::before`, `--art` and `--ay` per box in `game.css`).
  Chrome stopped saving files from that site after the first, so the rest came across as text on the clipboard
  (`navigator.clipboard.writeText` of a canvas JPEG after a real click, then `pbpaste | base64 -D`); the clipboard
  was cleared afterwards. Audit empty at 320x568, 390x844, 740x360, 1280x800. Next places for the same treatment:
  the play-call sheet, the halftime and final sheets, team cards.

- 2026-11-21: pictures on the in-game sheets. Version 1.6. Two more from the image tool, same recipe: a playbook
  board with chalk routes and a whistle (`art/s-call.jpg`) across the top of the play-call sheet, and a stadium
  scoreboard with a blank screen (`art/s-score.jpg`) across the top of the halftime and final sheets. Both sit on
  the sheet's `::before`, 150 and 190 px tall, fading down and left into the panel (`--pn` is the panel colour as
  three numbers). Fingerprint unchanged; audit with a played game empty at 320x568, 390x844, 740x360, 1280x800.
  Also: comments and notes tidied, and commits from here on carry no co-author line (the owner's wish).

- 2026-11-21: rosters change between seasons, and a picture on every sheet. Version 1.7. `js/roster.js` has a
  league year (`PG.rosterYear`, read by `sync()` on every lookup; 0 outside a career or a season, the mode's year
  less one inside it, set in `showHub`, `hub` and `showMenu`). For each year past the first every man is a year
  older; he leaves at 37, often from 32, and otherwise now and then (5% of starters, 14% of backups); a rookie of
  21 to 23 takes his place and number; the young improve a point, the old lose one. Nothing is saved: the same year
  gives the same men. Measured on one team: 8, 5, 8 and 10 rookies in years 1, 2, 5 and 10, the average age
  between 25.7 and 27.5, 53 different numbers and surnames every year, year 0 unchanged. A rookie is marked in the
  roster table. Not built: a draft screen for the league, trades, rookies of the user's own position competing with
  him. Sheets: every `.sheet` now carries the scoreboard picture across the top (the play call keeps its playbook).
  The get-up move asked about earlier was already there (`up` in render3d.js: the pile gets off and the runner
  rises during the dead time). Checked: fingerprint; a QB career, two Season years (roster year 2 at the end)
  clean; audit with a played game empty at 320x568, 390x844, 740x360, 1280x800.

### 2026-11-21: the walk between plays, always fast forward (1.8)

The owner: "from play to play, i know they walk to the spot/area but auto fast forward that part always".

- `jogIn` moves a man who is walking between plays (`p.wk`, set in `keepOn`, `walkOn` and the huddle break) at
  `WALKFF` = 3 times his pace, never past `WALKMAX` = 26 yards a second. The clocks are untouched. A shift, an
  audible slide or a man in motion keeps its own speed. With the fast forward button on (three steps a frame
  already) the factor is 1.
- The drawing runs that man's own clock at the same rate (`p.wkx`, read at the top of `poseFor`), so his stride
  keeps pace with the ground he covers.
- Found while measuring: a zone's slide with a man in motion started from where each defender stood when the play
  was set up, not from his spot, so he jumped back there when the motion began. It now starts from his spot.
- Checked: fingerprint unchanged; three bot games and a quarterback career clean; three watched games stepped at
  60 a second: 226 walks, 1.0 s on average, 2.6 s the longest, and no man moved more than 0.6 yards in a step
  before the snap. Not looked at on screen.

### 2026-11-21: the generated pictures taken out (1.9)

The owner: "remove the ai images as well".

- `art/` is deleted (title, the five menu boxes, the two sheet pictures) and every style that drew them; the
  stylesheet's menu and sheet rules are the same as before version 1.4.
- The home-screen icon is the drawn one again (`icons/icon.svg` and the four PNGs from before 1.4), with its links
  in index.html and the manifest. The credit line for the pictures is gone from About.
- Do not add generated pictures again unless he asks.
- Checked: fingerprint unchanged; audit with a played game empty at 320x568, 390x844, 740x360 and 1280x800.

### 2026-11-21: the kick's aiming line moves again (1.10)

The owner: "extra point / kicks are broken right now it seems, the little line doesn't move left and right".

- Cause: since version 1.2 the loop's `kickm` state was caught by the branch that walks the kicking unit on
  (`call` or `kickm`: `jogIn`), so the later branch that advanced `G.meter` never ran. The line stood wherever it
  started. The walk-on branch now advances the meter too, and the dead branch is gone.
- Checked: fingerprint unchanged; in watched test games the meter gained 1.5 in 1.5 seconds on every user kick
  and the line's position changed, while the unit was still running on and after.
- Lesson: when a state is added to an earlier branch of the loop, look for a later branch with the same state.

### 2026-11-21: bug test of full games (1.11)

The owner: "bug test full game and such".

- Run: 18 rough-player exhibitions, 4 quarterback and 3 receiver career games, two Season years and one playoff
  season, 6 exhibitions with ten-minute quarters; `X.bad` empty, no page errors, fingerprint unchanged.
- Nine watched games stepped at 60 a second with a checker on every step: no bad numbers, no frozen kick line,
  no stuck state, score never fell, and any man moving more than 0.6 yards in a step was listed. That found two:
  - A deep safety lined up more than eleven yards behind the goal line when the ball was near it, and the first
    step of the play pulled him back a yard. He now lines up at that limit (the same place the play put him, so
    results are unchanged).
  - A kick or punt returner was moved onto the landing spot as he caught the ball (up to a yard and a half). In a
    watched game he now catches it where he stands when he is within three yards of it.
- Not a bug: the rough test player ties games late on purpose and its overtime (80 seconds with two-minute
  quarters) usually ends level; with ten-minute quarters an overtime game was won 44-37.
- The replay still rewinds men to where they were, which is what a replay is.
- Not covered: nothing was looked at on screen or heard; controller and touch input; the online chat.

### 2026-11-22: controller, keyboard and mouse tested (1.12)

The owner: "make sure controller is fully good and keyboard and mouse".

- New tool `tools/inputs.js` (load it after audit.js): `await I.reachAll()` walks every screen the audit walks and
  checks the ring can get to every button with the d-pad or arrow keys; `I.game('pad'|'kb'|'mouse')` plays a whole
  exhibition with that device alone (a made-up controller is handed to the game through `navigator.getGamepads`).
  `I.bad` must stay empty. Test hooks added to `PG.dbg`: `foc`, `ui`, `inp`, `input`, `padKind`.
- Results: 43 screens with buttons at 390x844 and 1280x800, every button reachable. A full game finished on each
  device, picking every play with the ring (controller, keyboard) or a click (mouse). Checked one by one:
  controller throw (hold and release), stick, sprint, right-stick zoom, Start pause, ring in the pause sheet,
  B to close, View for a time out; keyboard number-key throw, arrows and WASD, Shift, zoom keys, P and Escape,
  T; mouse press-and-release on a receiver, drag to move, wheel zoom, swipe to kick, the buttons beside the field.
  Every button beside the field carried its key or controller label.
- Found and fixed: when a controller was picked up in the middle of a play (or after the keyboard), the buttons
  beside the field were being redrawn and that first press did nothing. `pollPad` now works out the button set
  itself when it is not drawn yet.
- Not covered: a real controller in the hand (rumble, a PlayStation pad's shapes, a non-standard layout), and
  career, season and camp games by controller (their screens were reached, their games were not played with it).

- **2026-11-27, the throw rebuilt (1.13).** The owner: "improve animations entirely, an overhaul, starting with the
  throwing animation". Before: arms and chest from a capture over a fixed pair of legs, 0.32 s, and the ball drawn at
  the chest through the wind-up and already in flight while the arm went back. Now `TK` in render3d.js holds six
  moments of a whole-body throw in the frame of the target (hips' turn, hips' place and height, both feet, chest,
  both hands); `throwBody` solves legs and arms from it, `throwX` times it (a wound-up throw goes straight to the
  whip), and the heading carries the hips' turn. The ball is in the throwing hand through the wind-up and the pump
  fake, leaves at the release and joins its flight over up to 0.3 s. A throw at 2 yards a second or more keeps the
  stride and throws with the chest and arm. `thrT` is 0.6 s (drawing only). The old `THROW` table is gone. Checked:
  fingerprint unchanged; three rough exhibitions, a quarterback and a receiver career game, a watched game and a
  keyboard-only game clean; the motion looked at as filmed frames from the side and from behind (a held throw and a
  tap). Filming a throw in the test pane: start an exhibition with `H_WATCH = 1`, step until `PG.dbg.G.chg`, then
  set `PG.r3d.debugCam = { pos, look }` beside the quarterback and copy `#gl` after each `PG.dbg.render()`. Not
  checked: how it reads at game-camera distance in motion, a left-handed thrower (there is none), feet measured for
  slide. The plan for the rest is under "Overhaul plan".

- **2026-11-27, the hand-off, the ball changing hands, the quality step-down (1.14).** `tools/film.js` is new: a
  camera beside a player and a grid of frames (`F.start()`, `F.until(test)`, `F.grid(who, opts)`). Filmed, the
  hand-off had the quarterback's hands at his chest and the ball under his arm, and the ball was in the back's arm on
  the next frame. Now his hands are solved onto the ball at his belt, and `held` in render3d.js carries the ball from
  where it was last drawn to its new holder over 0.14 s (a give, a catch, a ball picked up); the snap's rise off the
  turf applies on every play, not only passes. watchSpeed() no longer writes into the settings: steps live in `LOW`
  for the visit, a step is measured over the next 150 frames and undone if it did not buy a tenth of the frame time
  (then nothing more is tried), and settings saved before 1.14 have fx, shadows, detail and sharpness reset once
  (`SET.q14`; a choice the player made by hand is reset with them). Checked: fingerprint unchanged; three rough
  exhibitions, a quarterback and a receiver career game, a season, a watched game and a controller-only game clean;
  the hand-off looked at on film. Not checked: the step-down on a real slow phone or in low power mode (the test
  pane skips watchSpeed), the catch and pick-up carry on film.

- **2026-11-27, the pop detector and its first fixes (1.15).** `PG.r3d.pops(true)` then a watched game stepped with a render each step, then `PG.r3d.pops()`: every joint that turns more than 0.6 in a sixtieth of a second, heading swings and draw-offset jumps, counted by what the man was doing. First run: 127 kinds, the worst a shoulder going 3.6 in a frame (easing from 3.0 to -3.0 through his hips: easePose now takes a shoulder the short way), linemen dropping into their stance in three frames (now over half a second, `poseRate`), half turns in a frame or two (heading capped at 11 a second outside the throw), hands in a block chattering (arms eased at 12 a second, `armRate`). After: about 26 kinds, mostly near the threshold; left are the 3x walk's legs before the snap and the throw's whip, both meant to be fast, and arms of fallen men after the whistle (about 1.0). Checked: fingerprint unchanged; three rough exhibitions, a quarterback career game, a watched game and a mouse-only game clean. Not looked at on screen.

- **2026-11-27, the catch (1.16).** Filmed, the receiver held his arms out in a set direction and the ball arrived near them. Now over the last 0.28 s (0.12 s for a ball over the shoulder) both arms are solved onto the ball's own position in the chest's space (armIK, eased at 45 a second), each hand a little to its side; the defender at the catch point does the same with the hand on the ball's side, both hands when he is within 0.9 yards of where it lands. The carry-across from 1.14 takes it from the hands to the tuck. Checked: fingerprint unchanged; two rough exhibitions, a receiver career game and a watched game clean; one catch looked at on film from two sides. Not checked on film: the jump, the toe tap, the over-the-shoulder ball, an interception.

- **2026-11-27, line play (1.17).** Every block was one crouch with the legs pumping. The block branch of poseFor now has four jobs by side and play: pass protection (chest up, seat down, quick short steps, one hand punching while the other stays on him), run block (low, leaning, long leg drive), pass rush (leaning in behind the hands, an arm thrown over for a fifth of every 1.8 s on a seeded side, the chest turning with it), run defense (low and square). A wider base for all four. The carrier and a tackle were filmed too and nothing was changed there. Checked: fingerprint unchanged; pops over 7000 watched steps show nothing new from blocks; two rough exhibitions, a quarterback career game and a watched game clean; the line looked at on film from above (small). Not checked: each job close up.

- **2026-11-27, kicking (1.18).** Filmed: on a kickoff the ball left the tee with the kicker standing three yards behind it (no pose at all in 'ko'); on a punt or field goal the leg swung for 0.45 s after the ball had gone. render() now names the kicker (ps.qb in 'kick'; on a kickoff the man of the kicking side nearest the ball as it starts), when the foot meets the ball (`kickHit`: 0.1 s, 0.45 s on a kickoff) and where he stands for it (`kickAt`: beside the tee). poseFor walks him up to it through the draw offset (he steps, as for a pile), then the swing (`kickV`): a tenth of a second of backswing into the ball, a high finish with a hop, the leg down; higher for a punt. The ball is drawn on the tee, or 0.42 yards in front of a place kicker, or dropping from a punter's hands, until the foot gets there, then joins its flight over 0.3 s (0.55 s on a kickoff). Checked: fingerprint unchanged; two rough exhibitions, a season, a watched game and a keyboard game clean; a kickoff and a field goal on film. Not on film: a punt, a blocked kick, an onside kick, a free kick after a safety. Known and left: a field goal has no holder and no snap (the ball starts at the kicker).

## Morning hand-off

- Going live is settled: the owner said to always push to `main`. Done at 07:12 on 2026-11-12.
- List what changed, what was verified and how, and what is still rough.

### Round 4 (queued at 07:45; work through these in order)
- [x] Loose-ball scramble: a fumble is a live ball. Players near it dive, a miss squirts it away, the user steers the nearest
      teammate (Sprint and Dive). Out of bounds or three seconds untouched and it stays with the team that lost it
- [x] Audibles at the line: on offense Audible steps through four standby plays and Flip mirrors the play; on defense
      Audible steps through the coverage calls. Players slide to their new spots (keys V and X)
- [x] Two-point tries (you choose after your own touchdown and play one snap from the 2; the computer follows the usual chart)
      and onside kicks in the last minute when trailing by 16 or less (about 1 in 8 is recovered)
- [x] Run cycle: stride length follows speed so feet no longer skate, the thigh drives forward further than back, arms pump
      from hip to chin, shoulders counter-rotate, the body leans into cuts. Tackles: the ball carrier falls away from the hit
      (back, front or side), the tackler lands on him with his arms wrapped, and the pair slides to a stop
- [x] Career: the coach says something after every game (the performance, a weakness to fix, the next opponent, role changes),
      and a rival at your position on the best other team: marked on the leaders board, +300 XP for beating his team,
      a trophy for finishing a season ahead of him
- [x] Season mode: one roster for the whole season (names, numbers, ratings that move between seasons), every player's stat
      line from the box score, and team leaders, on a new Roster tab. Jersey numbers no longer repeat within a team
- [x] Holding (2% of gains of four yards or more: ten yards back, replay the down) and defensive pass interference
      (a first down at the spot); Settings has a Penalties switch that turns every flag off
- [x] Menu: four slow camera shots behind the menus (high orbit, sideline, behind the posts, a crane onto midfield), and 3D
      uniform portraits on the Exhibition and Season team pickers and on the Career player card
- [x] Career difficulty: measured with scripted seasons and rebalanced (grades, goals, coach trust per position, less
      run-heavy play-calling for a running back), and Career now has a Rookie / Pro / All-Pro choice. Whether an average
      *person* wins about half is still unknown: the script only plays like the computer

### Round 5 (queued at 08:15; work through these in order)
- [x] Names on the backs of jerseys; a short vibration on tackles you are in, big hits, fumbles and your touchdowns
      (Android browsers only; Settings has a switch where the device supports it)
- [x] Play of the game: the best play (scores, takeaways, sacks, long gains; yours weigh a little more) is kept whole and
      can be watched again from the final screen in Exhibition, Season and Career
- [x] Playbook: HB Screen, QB Sneak, Counter and Bootleg (17 offensive plays), Cover 4 and Goal Line (8 defenses); the computer
      calls goal line on short yardage and deep shells on long yardage. The run game was rebalanced play by play
- [x] Live punt returns in Exhibition and Season: the free safety drops back, the coverage runs down, and the catch turns
      the play into a return you play (or cover) like a kickoff return. No fair catches or muffs
- [x] Camera choice in Settings (standard, close, high)
- [x] Training camp: three guided drills (passing, running, tackling), five plays each, with a coaching card before every
      snap and one to three stars per drill (stars in the accent color rather than gold medals: the owner dislikes yellow).
      On the menu, and offered in a card the first time the game is opened with no saves
- [x] Left-handed layout: Settings moves the buttons to the left and the play notes to the right
- [x] A hall-of-fame score and verdict on the retirement screen (titles, honors, career XP, overall, trophies; about 100 is first ballot)

### Round 6 (queued at 08:50; work through these in order)
- [x] Player models, pass 4. First a bug: every arm and leg had been drawn inside-out (see the log), which is fixed for
      both models. Then a near model for close views (replays, celebrations, portraits): shaped thighs and calves, a knee
      pad, hands with fingers and a thumb, cleats, caps on the shoulder pads, a collar; numbers and names now wrap over the
      chest instead of floating as flat cards; soft contact shading is baked into the vertices of both models. The far
      model still draws during play. Settings has "Close-up player models", and a replay that drags switches it off
- [x] Touchdown celebrations: already there (three for the scorer, two for teammates); struck from this round
- [x] Career history: a season-by-season table (team, record, finish, stat line, average grade, overall, honors) on the
      Stats tab and the retirement screen. Seasons finished before this existed are not listed
- [x] Fair catches and muffed punts on live punt returns: a Fair catch button (or Space) while the punt is in the air; the
      computer's returner waves when a tackler will be on him as the ball arrives; a dropped punt is a live ball
- [x] Milestones: twelve, earned in any mode and kept on the device (`js/milestones.js`, key `pg.milestones.v1`), with a
      button on the menu that shows the count

### Round 7 (queued at 09:09; work through these in order)
- [x] Animation: at the catch the chest turns to the ball and both hands go out to it (up and back for a ball over the
      shoulder), a defender at the catch point gets a hand up, and after the whistle fallen players rise to a knee and stand.
      A pass is now drawn at the height of the figures' hands. Checked in three close-up stills, not in motion
- [x] Stadium life: a chain crew on the home sideline (two sticks ten yards apart with a chain, a down box that shows the
      down, three men in orange who walk to the next marks after the whistle); the pylons, which were already there, are
      larger so they show beside the oversized players
- [x] A playoff bracket on the Standings tab of Season and Career (semifinals, final, champion; it fills in as the games
      are played), and Season awards on the season-complete card: your most valuable player, the league's best offense and
      best defense. The other teams are simulated, so only your roster has players to honor
- [x] Career contracts: a rookie deal from the draft slot (one to three seasons, $1.2M to $6.5M a season; a walk-on gets one
      year at the minimum), shown on the hub. While it runs you stay put (a trade request still works). When it ends every
      team makes an offer of years, salary, a signing bonus in XP and a role, and you choose. Salary is a scoreboard, not a
      currency: it totals up on the retirement screen

### Round 8 (the owner's requests at 13:15 on 2026-11-12: "improve audio drastically, improve ui a little ... i want it so u
### can only be wr and qb ... add a bar that has a green bar for power when u click a letter to throw to ... keep improving")
- [x] Career: a new player is a quarterback or a wide receiver. The other three positions stay in the code so an older
      career still loads
- [x] Throw power: hold a receiver's letter (on the field, on the pad, or its number key) and a green bar fills; let go to
      throw with that much on the ball. A quick tap floats a lob, a full bar fires a bullet, and the bar and a ring round
      the receiver's letter show the level. This replaces "tap for a bullet, hold for a lob"
- [x] Audio, rebuilt (asked for twice). `js/audio.js` is a second version:
      the crowd is now voices (several hundred synthesized syllables rendered into murmur and roar loops, applause from
      single claps, and rendered "ooh", "aww" and "DE-FENSE" reactions) instead of filtered noise; every effect is
      rebuilt in layers with energy a phone speaker can play; the menu has a new sixteen-bar theme; the mix ends in a bus
      compressor and a limiter; a drum roll leads into kickoffs, hits and catches are placed left to right, rain has
      thunder; Settings has a Volume choice. Still no audio files
- [x] Camera zoom (asked for at 13:44: "make it so u can zoom in more or out of view ... different players have diff
      preferences"): ten steps from 60% to 180%, on − and + buttons under the scoreboard, the mouse wheel, the minus and
      equals keys, and a stepper in Settings. It replaces the three-way camera choice
- [x] Interface, a little: the play-call sheet marks one card "Suggested" for the down and distance (offense and defense)
      and opens on its tab; the scoreboard row carries the zoom buttons; Settings gained Volume and the zoom stepper; the
      throw power bar and the ring on the receiver's letter are new
- [ ] Still open from before: a person plays it on a phone; contract years could matter more; animation checked in motion

### Round 9 (the owner's requests at 13:52 and 14:10 on 2026-11-12: "for any plays, underneath the game pls let me know if
### it's a run play throw play etc rfo"; "after all this bug test, research and just optimize the ui to be perfect";
### "audio is decent, but need it to sound like football"; "yes automatic improvement loop ... make major improvements or
### if not just work on improving ui more and more")
- [x] A tag under the field for every snap: Run, Pass, Play action, Screen, RPO or Kick, with the play's name. On defense
      it shows your call, and its badge turns to what the offense is doing a moment after the snap (later for a fake)
- [x] Run-pass option plays (read as what "rfo" meant): RPO Slant and RPO Bubble, on their own tab. For 0.7 s the
      quarterback and the back share the ball: throw to a lettered receiver in that time, or do nothing and the back takes
      it. Linebackers in underneath zones either step up at the fake or sit; one who sits in the throwing lane bats the
      ball down more often than not. The computer never calls them, but your coach does now and then in Career
- [x] Sound that is more unmistakably football (the owner's verdict on the rebuild was "decent, but need it to sound like
      football"): the quarterback's cadence before every snap ("Ready ... set", then "Hut!" with the snap), the two lines
      crashing together, a shout on audibles, shouts on a loose ball, a crowd "ohhh" that swells with the drum roll into
      every kickoff, a band in the stands between plays (a drum cadence, the "Charge!" bugle call with the crowd's
      answer, a phrase of the fight song), a "LET'S GO!" chant with its claps, and a cannon with fireworks on home
      touchdowns. Still to be judged by ear
- [x] Bug test every screen and mode; research interface guidelines; fix what turns up. `tools/audit.js` now walks
      every menu screen and a scripted game in each mode and measures them (see "How to test", step 6). The first run
      on the smallest phone listed 65 problems; after the fixes it lists none at 320, 360, 390, 430, 768 and 1280
      wide, in both graphics modes, left-handed, and in day snow. What changed:
      the bottom of the game screen is one grid (kick meter or power bar, tips beside the thumb pad, the play tag
      along the bottom edge), so nothing there can overlap; every control has a touch area of at least 44 by 44
      pixels without being drawn any bigger; no type under 10 pixels; the menu scrim is thin only behind the title and
      heavier on reading screens; locked trophies and milestones are readable; redrawing a screen keeps its scroll
      position (changing a setting or a hub tab used to throw the page back to the top); the trade request is a button
      with a second tap to confirm; a phone held sideways gets a "turn your phone upright" notice and the game pauses
- [x] The automatic loop back on, briefed with "major improvements, otherwise the interface"

### Automatic runs (from 15:01 on 2026-11-12; one item a run)
- [x] Run 1, stadium sound. The referee gives every penalty to the stadium over the speakers (a microphone click, then
      his call with the echo of a big bowl) and the home crowd answers: a boo when the flag is on its own team, a cheer
      when it is on the visitors. A home first down that matters (third or fourth down made, or eight yards and more)
      gets the stadium announcer starting the sentence and the crowd finishing it: "FIRST DOWN!". With the visitors on
      third or fourth down the whole stadium builds a wall of noise until the snap. A long pass draws a rising "ohhh"
      that tops out as the ball comes down. At halftime the band plays a sixteen-second show (drum line, the fight song
      at a march with bells and tubas, a last chord) and the crowd applauds it. Still to be judged by ear

- [x] Run 2, motion. Feet that stay where they are put: an ankle joint, and legs solved so a planted foot does not
      slide or sink (see the log for the numbers). Stances stand on the turf with flat soles. The quarterback winds up
      while the power bar fills and his follow-through fits the power. Still to be judged in motion by a person

- [x] Run 3, motion sideways. Hips that open, so a shuffle plants its feet too (120 cm of slide a step down to under
      2); a defender who has ground to cover turns and runs looking back instead of shuffling at a sprint; officials
      and the chain crew on the players' stride. Still to be judged in motion by a person

- [x] Run 4, two-player tackles. The tackler bends to the hit with his shoulder at the runner's hip and his arms
      round him, and the two go down together, the tackler across the runner's legs; nothing ends up under the turf
      or inside the other man. The quarterback's wind-up from run 2 now really shows (it was not reaching the game).
      Still to be judged in motion by a person

- [x] Run 5, eyes, hands and standing room. Helmets turn to what each man is watching (the ball in the air, the man
      with it, the quarterback; a receiver looks back once he is into his route, the quarterback goes through his
      receivers, the bench follows the play). A block is drawn with room for arms: hands on the other man's chest
      and shoulder pads, elbows bent, helmets side by side. A man left standing beside a tackle steps clear of the
      two on the ground. Not built: a second man joining the tackle (measured, there is no room for him; see the
      log and "Next ideas"). Still to be judged in motion by a person

- [x] Run 6, field sound. A field goal made or missed by a hair goes off the upright: it clangs (a ringing tube,
      pitched where a phone can play it), goes on through or bounces back out, and the banner says so. The defense
      calls out the formation before most snaps and answers an audible; the men who made a sack, an interception or
      a fumble recovery whoop; the ball thuds on the turf when it bounces. Still to be judged by ear

### Round 10 (the owner at 17:48 on 2026-11-12: "the voice over is too ai, it needs to be like the nfl commentators";
### then, offered four ways to do it, at about 17:58: "of course option 1", the free speech model on his Mac)
- [x] A recorded broadcast booth in place of the phone's speech voice: a play-by-play man and an analyst, 273 clips
      of an original script (`tools/commentary.json`), recorded with Kokoro-82M on the owner's Mac by `tools/voice.py`
      and shipped as one 2.4 MB file. The play-by-play man opens the broadcast and names both teams, calls the down
      and distance before some snaps ("Third and six."), calls a long ball while it is in the air, an interception as
      it happens, every result worth a call, the first down, the score and what it did to the game ("And they take
      the lead."), the quarters, the half and the final. The analyst follows the big moments with a reason and stays
      quiet otherwise. One of them talks at a time, a big call cuts in over small talk, and the crowd dips under them.
      A career's simulated drives get one line each. Practice has no commentary. Settings and the pause menu call the
      switch "Commentary". Still to be judged by ear: nobody has listened to it in the game. What measurement already
      says: the model does not shout, so the big calls are lifted by processing (a little faster and higher, brighter,
      louder) and will still be calmer than a real announcer's.

### Round 11 (the owner at 19:15 on 2026-11-12: "one thing was that i threw for a first down in red zone /
### touchdown area and i guess it didn't register, work on improving the voices yes you can go do not hold it no
### more, add drive summaries and half time things, work hard")
- [x] The touchdown that was not: a ball carrier brought down, or pushed out, already in the end zone he attacks is
      now a touchdown. Before, the tackle check ran first and spotted him at the one-yard line as a first down.
- [x] The referee and the stadium announcer recorded like the booth (a third and a fourth voice), sentence by
      sentence, down the stadium-speaker route; the synthesized voice is only their stand-in before the clips load.
- [x] Livelier commentators: new voice blends chosen by measured pitch movement, more takes for the common calls,
      lines for a kick off the upright and for scoring drives.
- [x] Drive summaries after every scoring drive; halftime and final screens with the scoring summary and leaders,
      in exhibition, season and career.
      Still to be judged by ear and on a phone

### Automatic runs, continued
- [x] Run 7, the booth knows who has the ball: "The quarterback keeps it himself!" on a quarterback run, calls for a
      catch by the tight end or a running back, an analyst line after a quarterback run; and the stadium announcer's
      "Ladies and gentlemen... welcome... to Outlaws football!" as the teams line up for the opening kick, the crowd
      roaring back. Still to be judged by ear
- [x] Run 8, the reverse angle: an instant replay (and the play of the game) is shown at half speed from the
      sideline as before, then the last two and a half seconds again from ahead of the play, high enough to see over
      the men between, looking back at the ball carrier. A tap still skips it all. Still to be judged by eye
- [x] Run 9, a career that ages and a rival who talks. You come in at 22; each new season the summer changes your
      ratings: +1 to everything up to 25, nothing from 26 to 29, then the body first (speed, elusiveness, arm power:
      -1 a year at 30 and 31, -2 at 32 and 33, -3 from 34) and the skills later (-1 from 34, -2 from 36), never below
      40. The hub says what changed; the age is on the player card, the retire screen and the hall of fame. The
      rival has a line before his game (from how you stand: your last game against him, the leaders race) and the
      headline after it. Still to be judged over a long career
- [x] Run 10, the two-minute drill. In the last two minutes of the fourth quarter (half of a short quarter) a side
      that is behind or level goes no-huddle, and anybody with the ball does in the last minute before halftime
      (a quarter of a short quarter): 8 seconds run between plays instead of 13, the next sheet comes up sooner and
      says "No huddle", and the booth notices. Changes play: new fingerprint baseline. Still to be judged in play

### Round 12 (the owner at 19:42 on 2026-11-12: "add awards night, hall of fame, 2 minute warnings for quarter or
### such like nfl games, small details from football / nfl")
- [x] Two-minute warning: the first time the clock reaches 2:00 in the second or fourth quarter it stops there (if it
      ran there between plays it stops at exactly 2:00), and the next play-call sheet opens with the referee's
      call, the booth and a banner. Quarters of two minutes or less have none.
- [x] Awards night after every career season, and a hall of fame: retiring a career (a new button beside the erase)
      puts it to a vote and keeps it for good; the Hall of fame is on the main menu.
- [x] Small details: the referee announces the coin toss before the game and in overtime, and every timeout with
      how many the team has used; the toss is on the matchup card. The playoff bracket no longer pushes the career
      hub off the side of a 320-pixel screen (found by the audit now that it reaches a playoff season).
      Still to be judged by ear and in a long career

### Round 13 (the owner at 21:25 on 2026-11-12: "keep going, voices are good for now, remove anything robotic tho,
### phone is good rn and feels good just improve anything if u do notice something off or such, focus on pile after
### tackles and small details listed after that")
- [x] Nothing robotic left: the players' voices recorded (three new voices: the quarterback and two defenders), the draft
      announced by the recorded stadium announcer, and every synthesized voice and fallback removed (the device's
      speech voice, the synthesized stadium voice, the synthesized shouts, grunts and lone crowd voices). Where a
      clip is missing, nobody speaks.
- [x] The pile: the two nearest defenders within two yards dive onto the runner and the tackler and lie on top of them;
      the top comes off first. Not perfect: see the log.
- [x] The officials' timeout signal, for timeouts and the two-minute warning.
      Still to be judged by ear and in motion
- [x] Run 11, the propped runner: rolled onto his free-arm side he lay on that arm, and the ground solver propped his
      whole body on the hand. That arm now goes out past his head along the turf. Still to be judged in motion
- [x] Run 12, celebrations: three more for the scorer (a knee, then both arms to the sky; a flexed roar; a bow to the
      crowd, again and again), a clap for teammates, hands on helmets for some of the side that was scored on.
      `PG.r3d.celebStrip()` draws them all. Still to be judged in motion
- [x] Run 13, the scoop-and-score: a defender who gets to a loose ball on his feet can pick it up and run it back.
      Still to be judged in play

### Round 14 (the owner at 22:20 on 2026-11-12: "play clock with dekay of game, switching sides and coaches
### challenge, and different celebrations for tocuhdowns, also add a kicking swipe so u can interact when there is
### kicks, so they arent automatic yk")
- [x] The kick swipe: field goals, punts and your kickoffs (which used to go by themselves).
- [x] Play clock with delay of game.
- [x] Coach's challenge.
- [x] More touchdown celebrations.
- [x] Teams switch ends between quarters.

### Round 15 (the owner at 23:05 on 2026-11-12: "add a social media aspect to this, so if u have a good game comments go
### crazy and etc, but a major thing for me is reporters and post media questions and like having good games and trash
### talking other teams, proving to the coah u are good and good compliments etc, be detailed and such")
- [x] Postgame press conference: three situational questions, eight answer tones with fixed effects on coach trust,
  hype and followers, a walk-out option, the coach's verdict on your answers.
- [x] Callouts and guarantees of the next opponent, settled in that game (XP, trust, hype, followers, receipts).
- [x] The reaction feed: fans of both teams, analysts, reporters, teammates, rival, the coach quoted; volume, likes,
  replies, trending and a viral post scale with the game.
- [x] The Social tab in the hub; the callout on the next-game card; the coach's word on your podium answers.
- [x] Media day before a rival game; endorsements as hype pays off; the booth bringing up a callout (automatic run 16).

### Round 19 (the owner at 00:20 on 2026-11-13, after asking where cutscenes could go and being given seven places:
### "everything u gave work one at a time in order")
- [x] Game-day walkout (career).
- [x] Rival face-off before rival games.
- [x] Championship trophy.
- [x] Coin toss at midfield.
- [x] Draft day stage.
- [x] Press conference podium opener.
- [x] Hall of fame induction.

### Round 20 (the owner at 01:05 on 2026-11-13: "show 3 plays at a time and allow easy scrolling for more plays, obv top
### 3 plays are most suggested by coach, make the game icon a lot better, add a better description on github, research a
### lot on football and games for it and see what small details to add ... i really want to work on making the
### animations and models better after all this as well, i want full controller support too and more things to work on
### for the game i want big major additions and such")
- [x] The play-call sheet three at a time, the coach's top three first, swipe, wheel or arrows for more.
- [x] A new game icon (and PNG sizes), the GitHub description and topics, a new README opening.
- [x] Small details from research: the hard count, top speed and completion probability cards, the third-down line,
  the measurement.
- [x] Full controller support (the Gamepad API): the field, the menus, the play-call sheet, the pause dialog.
- [ ] Animations and models: the owner's next priority (see the plan below).
- [ ] The big additions below, in the order the owner picks.

### The plan for animations and models (Round 21, the owner's priority "after all this")
Today a player is about thirty instanced parts (rounded boxes and capsules) posed joint by joint in `render3d.js`.
Ordered by what a phone would notice most:
1. One skinned body per player instead of separate parts: a procedural mesh (torso, arms, legs as one surface) bound to
   a skeleton, so elbows, knees and shoulders bend without seams. three.js `SkinnedMesh` with 18 bones, built in code
   (no downloaded model), and the existing pose vectors drive the bones. Instancing goes; measure the frame rate on a
   phone at 22 players before keeping it.
2. Gait blends by speed: walk, jog, run, sprint and backpedal mixed by velocity, with foot planting (the feet stop
   sliding at any speed, not only the eight sampled ones `PG.r3d.gait` measures).
3. Football-specific motions: three, five and seven step drops, a throwing motion with follow-through, a catch reaching
   for the ball (high point, diving, a toe tap at the sideline), stances for linemen and receivers, a form tackle as a
   paired animation (tackler and runner keyed to each other), a stiff arm that reaches. Done (02:06 on 2026-11-13): the
   high point (a leap for a contested ball, the defender going up too) and the stretch for a ball off his line.
4. Equipment detail: facemask bars, helmet decals and numbers, visors, sleeves, gloves, towels, cleats; jersey cloth
   shading (a normal map made in a shader), grass stains as a game goes on.
5. Faces and hair under the helmet in close-ups and cutscenes (the cutscenes already show hair and a cap).

### Big additions to choose from (Round 22 and on)
- Pre-snap motion: jet and orbit motion and shifts, routes built from where the man is at the snap.
- Franchise mode: run a whole team (roster, contracts, the draft, free agency, the depth chart) for seasons.
- Two players on one device (or two phones over a peer-to-peer connection), head to head.
- Create a play: draw routes on the card art, keep your own book.
- Practice mode open to players: pick a play and a coverage, run it as often as you like (the play lab, with a field).
- A living league: every player progresses and ages, injuries, weekly awards, a scores ticker, a halftime show.
- Stadiums with their own look per team (roof, end zone art, colors), weather by city.
- Difficulty sliders (pass coverage, AI accuracy, fatigue) and remappable controller buttons.

### Round 24 (the owner at 02:35 on 2026-11-13, going to sleep: "i need it to be in career mode as well since that's the
### main mode here / loop and keep improving and adding more and optimizing and more small details until 10am, keep going
### even if usage finishes / before i go to sleep though, please add as much as u can from the nfl and madden if possible")
Career mode is the main mode: every item below is built for a career first. Original names only (no league, team or
game marks; "primetime", "Player of the Week" and the like are plain words, not marks).
- [x] Primetime games, Player of the Week, career highs on the broadcast, scores around the league at quarter breaks,
  the team editor from the career hub and the new-career screen (02:40, by hand before the loop).
- [ ] The rest is in "Next ideas", NFL and Madden first.

### Next ideas (nothing here is started; the automatic loop works from the top)
NFL and Madden, for a career first (Round 24), biggest that fits a run first:
- Injuries, the rest (the career side and shaken-up ball carriers are done, 09:19): the trainers drawn running out and
  the man walked off (a short cutscene), the cart for the worst, and a career player's own
  in-game knock (sit a series).
- An all-star game after the season for the best players of each conference (you, when you are one): a playable
  exhibition with its own presentation.
- A record book: league single-game and season records; the booth and a card when one falls.
- A roof drawn over the eleven roofed stadiums (data.js `clim: 'dome'`, `env.roof`): the sky and the light towers give
  way to a dome and a ring of lights. The weather side is done (02:55).
- Optimization, the rest (the voice packs and the lettering draws are done, 2026-11-14): the common voice pack is
  still one 4.2 MB fetch (the analyst's lines are 1 MB of it and could come second); the 48 figures' lettering could
  be one instanced draw from an atlas; measure on a real phone.
Animations and models, the owner's priority (the Round 21 plan above), one piece a run:
- Done 2026-11-14: the quarterback's counted drop and set, and a stiff arm that reaches. Next the toe tap at the
  sideline, the form tackle as a paired animation, facemask bars and helmet numbers; the skinned body last, as its own project.
  Each piece is checked with a staged test hook and a strip, like `catchTest` and `catchStrip`.
- The voices, after the owner has listened to Round 11's (he said at 19:15 "work on improving the voices"; how they
  sound now is still unjudged). If they are still too calm, the next step is a more expressive open speech model with
  an excitement control: a multi-gigabyte download, which needs his say-so first. Voices are lines in
  `tools/commentary.json`; the whole booth re-records in about six minutes.
- More booth lines: the score read out at the half and the end. Not done in run 7 on purpose: the natural way, "The
  Outlaws fourteen, the Aviators seven", is a clip for every team and score (about 370 more clips, 3 MB), and
  joining single numbers sounds like a machine. Worth it only if the owner wants it.
- The pile, the rest (measured again in run 18 with `PG.r3d.beside(a, b, {off, at})` over the 156 stagings): while
  defenders dive on (0.6 s) 14 of 156 have more than 10 cm of one man inside another, 7 at 0.8 s, none at 1.0 s; and
  as the runner gets up (1.15 to 1.5 s) a few men standing 2.3 yd off end up inside him, up to 33 cm (the clearance
  stops once a body's fall drops under 0.3, so a standing man is no longer pushed). The top man also lies a little
  stiff and flat. Not taken in run 18: the fix is inside the pile solver and could not be finished and checked in one
  run.
Interface, when no major item fits in a run:
- Run `tools/audit.js` after every change and keep its report empty.
- A person on a real phone still has to judge touch feel, the frame rate with close-up models, and the sound.
- The on-field receiver letters and the drag ring are drawn on the canvas, so the audit cannot see them: check their
  size and contrast by hand in day, dusk, night, rain and snow.
- Settings could show what each graphics option costs; the play-call sheet could remember the last tab per down.

### Tonight (2026-11-16 night)
The owner at 01:45, going to sleep: "work all night making the game better and more realistic, follow nfl / madden etc,
goodnight". One item a round (cron job a7861c35, :13 and :43 past each hour until 09:30), real football and current
NFL rules first, every item checked the full way before it ships.
- [x] Sideline and end-line catches: both feet in bounds or the pass is incomplete (today a receiver who catches it out
  of bounds keeps it); a toe tap at the line drawn and called, and the receivers and their quarterbacks working to keep
  a ball near the line catchable in bounds.
- [x] League numbers against the NFL's: points, completion rate, yards a pass and a carry, sacks, turnovers and
  penalties a game from `H.sim`, tuned where they are well off (the fingerprint re-pinned if play changes).
- [x] (part, round 3: surer open-field tackles, pursuit angles; the rest is the last item) Coverage at the catch: the nearest defender is 4.8 yards off at the catch (NFL about 3) and a catch still runs
  for 10.6 more (NFL about 5.3); tighter zone matching and trail technique, measured the same way (round 2's log).
- [x] A record book: the league's single-game and season marks, kept as careers play; the booth and a card when a
  career player breaks one.
- [x] The form tackle as a paired motion: tackler and runner keyed to each other (wrap, drive, fall together).
- [x] Injuries, the rest: the trainers jog out and a hurt man is helped off (a short scene), the cart for the worst.
- [x] A roof over the roofed stadiums: the sky and light towers give way to a dome and a ring of lights.
- [x] An all-star game after the season for each conference's best (a career player who makes it plays it).
- [-] (deferred: round 9 found it is the quarterback's read, not the zones; it wants a session of its own, not a night round) Yards after the catch, part 3: the receiver still runs about 8 yards before the first hand touches him (NFL about
  3 to 4) and 9.3 in all; at the catch the nearest defenders are mostly linemen behind him. Look at how underneath
  zone men and man trail technique close on short throws (round 3's log has the numbers and the test tallies).
- [x] The clock on a runner out of bounds: NFL timing (it restarts on the ready signal except in the last two
  minutes of a half or an overtime period and the last five of the game).
- [x] The kickoff landing zone: your kickoff that lands short of their 20 is not returned; their ball at the 40.
- [-] (deferred to a session of its own) The pocket as one system: quarterback timing (1.45 s to throw against the
  league's 2.8), blitz pickup by backs and tight ends, hot reads and coverage tightness, tuned together against the
  league's numbers (round 11's log; round 9's for coverage).
- [x] The computer's fourth-down calls follow the modern chart (4th and 1 from its own 35 on, 4th and 2 or 3 in
  no man's land, 4th and goal from the 2; safe when ahead late).
- [x] The kicking game by the numbers: the computer's punts end the league's way (fair catches, downed, the coffin
  corner, returns of about nine yards) and its field goals make the league's rates by distance.
- [x] The two-point chart: the computer and a career's coach go for two the modern way (down 2, 5, 8 and 10, up
  1, 4, 5 and 12 in the fourth quarter; down 2 or 5 and up 1 in the third).
- [x] Players on different teams sharing a surname (one game had both leading rushers named the same): keep
  surnames apart across the two sides of a game, or show a first initial where they clash.
- [x] Overtime by NFL rule: ten minutes and two timeouts a side in the regular season, fifteen-minute periods and
  three timeouts per pair of periods in the playoffs.

### Online (the owner at 12:10 on 2026-11-16: "i want online play and global chat with free options")
- [x] The Online screen and the global chat on Firebase's free plan, with the filter, slow mode, mute, report and
  console bans (docs/ONLINE.md). Live once the owner pastes the project's public config.
- [x] Wire in the owner's Firebase config and check the chat on the live site (a phone of his still to try it).
- [ ] Head to head, phone to phone (PeerJS): host and join with a code; the host runs the game and the guest
  controls team 1 (its play calls, its ball carrier and passer, a defender), drawn from what the host sends.
