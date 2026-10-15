# AniMatch

A local-only, Tinder-style anime character card game. Pick a deck, then swipe or tap to choose an action for each character.

## Requirements

- Node.js 20.19+ or 22.12+ (check with `node -v`)

## Install (once)

Open PowerShell / Terminal in this folder and run:

```
npm install
```

## Run

```
npm run dev
```

Open the **Local** URL it prints (usually http://localhost:5173).
To play on your phone, open the **Network** URL (e.g. http://192.168.x.x:5173) on the same Wi-Fi.
If Windows Firewall asks about Node.js, allow it on **Private networks**.

## Stop

Press `Ctrl + C` in the terminal (answer `Y` if Windows asks "Terminate batch job?").

## Controls

| Input | Effect |
|---|---|
| Swipe / drag card | Action mapped to that direction |
| Tap a round button | That action |
| Arrow keys (desktop) | Action mapped to that direction |
| Skip button, `S` or `Space` | Skip without saving |

## Customizing

- **Actions** — edit only `src/config/actions.ts`. Rename labels, change emoji/colors, or add a 4th action with `swipeDirection: 'down'`. History stores action ids, so renaming keeps old history.
- **Deck size, rate limit, swipe sensitivity** — `src/config/settings.ts`.
- **Refetch characters** — the deck is cached in localStorage. Changing `DECK_SIZE` triggers a refetch, or clear site data in your browser.

## Notes

- Gender for the Waifu/Husbando decks is guessed from each character's bio (Jikan has no gender field). Misfiled characters can just be skipped.
- If loading fails with rate-limit errors, raise `JIKAN_REQUEST_DELAY_MS` to 600–800.
