# Accounts and the copy of your save

Since 1.29 the game has accounts, the same ones as PocketBasketball: an email and a password, or Google, or GitHub, on
the Firebase project all the Pocket games share (`blockfootball-a13c9`). **One account works in every Pocket game.**
An account keeps a copy of this game's save, so a cleared browser or a new phone does not lose a career. Everything
else works without one.

The code is `js/account.js` (ported from PocketBasketball's, same behaviour): signing up while the chat has you signed
in anonymously links the two; the copy is the whole save (every `pg.*` key but the account's own bookkeeping), gzipped
when the browser can; it goes up a few seconds after the game saves and when the app goes to the background; coming
down it is checked the way a backup file is; two phones that both played get a choice, never a silent overwrite.

## What is already on (done for PocketBasketball, on the shared project)

- Email/Password sign-in, and Google sign-in.
- `eddyarriaga00.github.io` as an authorized domain (every Pocket game is served from it).
- GitHub sign-in: on only if the GitHub OAuth app was set up; until then the GitHub button says it is not switched on.

## The rules (published 2026-11-28)

Done: the rules below were published on 2026-11-28, and the live rules were checked section by section against
`docs/firebase-rules.json`. Repeat these steps only when that file changes.

This game keeps its copy at `football/<your id>` (PocketBasketball's is at `saves/<your id>`, PocketSoccer's at
`soccer/<your id>`; they must not share a place). The database's rules have to allow it:

Firebase console → **Build → Realtime Database → Rules** → replace the whole text with `docs/firebase-rules.json`
from this repository → **Publish**.

That file is the union for all three games: PocketBasketball's rules as of 2026-11-27 (chat, park, challenges, games,
`saves`, `accounts`), PocketSoccer's `soccer` part, and the new `football` part (the same rule as `saves`: only the
account's owner, signed in with a password, Google or GitHub; the save at most 6 MB of text). If any of the other
games' rules have changed since, add the `football` part to the newest of them instead of pasting this file over it.

Until the rules are published, signing in and creating an account work, and the Account page says "Saves in accounts
are not switched on for this game yet": your save stays on the phone as before.

## What is stored, and deleting it

An email address and a password (kept by Firebase Authentication, never by the game), a name, and the copy of the
save. **Delete my account** on the Account page removes this game's copy, the other Pocket games' copies, the
`accounts` entry and the sign-in itself (it is one account for all of them). Careers on the phone stay.

## Testing

A page opened with `?test` has `PG.account.test.backend(fake)` and `.state()`: the flow (create, copy up, sign out,
wrong password, reset, a second phone with a newer save) runs against a stand-in service with no network.
