# Online

The owner's choices (2026-11-16), all on free plans:

| | Choice | Cost |
|---|---|---|
| Global chat | Firebase Realtime Database, the Spark plan | Free, no card. 100 phones connected at once, 1 GB stored, 10 GB downloaded a month. With no card on file nothing can be billed. |
| Head to head | Phone to phone through PeerJS 1.5.5 (cdnjs) and its free public matchmaking server | Free, nothing to sign up for. Some mobile networks block direct links; those pairs cannot connect. |
| Who a player is | A typed name, plus a hidden id Firebase gives the device (anonymous sign-in) | Nothing to log in to. |
| Chat safety | Word filter, one line every 2.5 seconds (also enforced by the database), mute and report on every line, the owner deletes and bans in the Firebase console | |

## Where things stand

- **Global chat: live** on the owner's project `blockfootball-a13c9` (set up 2026-11-16, config in `js/online.js`).
  The Online screen (main menu) has the name, the chat, the online count, mute and report. Tested end to end against
  Firebase's local emulator with the rules in `docs/firebase-rules.json` (sending, the filter, the server's slow
  mode, forged ids and over-long lines refused, reports stored, deleted lines vanishing, bans blocking), then on the
  real project: anonymous sign-in, the count, a forged line, the ban list and the whole database refused, and one
  line posted ("Setup check: Chat is open. Say hi!", which the owner can delete).
- **Head to head: next.** The game assumes one person on team 0 throughout; letting a second phone control team 1
  is the next build (see the roadmap).
- The chat connects only while the Online screen is open, and lets go while the app is in the background, so a
  phone uses one of the hundred places only while someone is reading.

## Setting up Firebase (the owner, about five minutes)

1. Open https://console.firebase.google.com and sign in with a Google account. **Create a project**, any name (for
   example `pocket-football`). Google Analytics is not needed: switch it off.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save.**
3. **Build → Realtime Database → Create database.** Pick a location (United States is fine), then **Start in locked
   mode**.
4. On the database's **Rules** tab, replace everything with the contents of `docs/firebase-rules.json` and press
   **Publish**.
5. **Project settings** (the gear) → **Your apps** → the web icon `</>` → give it a nickname, leave Hosting off,
   **Register app**. It shows a `firebaseConfig` with `apiKey`, `authDomain`, `databaseURL`, `projectId` and a few
   more. Copy that block into the conversation.

That block is meant to be inside a web page (the rules are what protect the data). Do not paste a service account,
a private key or anything from **Service accounts**: those are secret.

## Moderating (Firebase console → Realtime Database → Data)

- **Delete a line:** open `chat` → `global`, find the line, the trash icon. It disappears from every phone at once.
- **Reports:** under `reports`. Each has the line's text, its key (`msg`), the reported player's id (`uid`) and the
  reporter's id (`by`).
- **Ban a player:** add a child under `bans` (create `bans` at the top the first time) whose key is the player's
  `uid` and whose value is `true`. Their lines are refused from then on. Delete the entry to lift it.
- **Mute** is each player's own: it hides someone on that phone only.
- Old lines can be cleared by deleting `chat/global` as a whole; the screen only ever shows the last fifty.

## Head to head (planned)

One phone hosts and runs the game; the other joins with a short code and is sent what happens, play by play, and
sends back its controls. PeerJS's public server only introduces the two phones; the game itself goes between them
directly.
