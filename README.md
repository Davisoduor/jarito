# Jarito

**Keeps watch over your Canvas deadlines.**

**[Try it → jarito.vercel.app](https://jarito.vercel.app)** · free, no account · [see it with sample coursework](https://jarito.vercel.app) if you don't use Canvas

Jarito puts every assignment from every Canvas course into one list, sorted by what's due
next, and tells you the moment a professor moves a due date, posts something new, or changes
the brief. Canvas updates the date quietly; Jarito says so out loud.

## Using it

1. Type your school's Canvas address (or just the school name) and press **Open my Canvas
   calendar**.
2. Click **Calendar Feed** at the bottom right of the calendar page and copy the link.
3. Press **Paste link and start watching**.
4. Add it to your home screen (Share → Add to Home Screen on iPhone; the install prompt on
   Android/Chrome) so checking is one tap. Use **Open on my phone** to move to your phone
   by scanning a code instead of retyping the link.

Every time you open it, Jarito re-reads your feed and compares it with last time.

## Privacy

- No accounts, no database, no analytics, no cookies.
- Your feed link, assignments, and what you've ticked off live in your browser's local storage.
- Canvas doesn't allow browsers to read feeds directly, so syncing goes through one small
  function (`api/feed.ts`) that fetches the calendar and returns it. It doesn't store or log the
  link or the calendar. It only accepts Canvas feed URLs (`/feeds/calendars/user_….ics` over
  HTTPS), never follows redirects, caps responses at 2 MB, and rate-limits by IP.
- The phone hand-off puts the link after `#` in the URL, which browsers never send to a server.

Full details: [jarito.vercel.app/privacy](https://jarito.vercel.app/privacy).

## How it works

| Piece | File |
|---|---|
| ICS parsing, line unfolding, UTC → local due dates, change detection | `src/lib/canvasIcs.ts` |
| Sync, change report, status, local storage | `src/hooks/useJarito.ts` |
| Feed proxy (Vercel Function) | `api/feed.ts`, `api/_lib/feed.ts` |
| Offline shell | `public/sw.js` |

Things learned from a real Canvas feed rather than the spec:

- `SEQUENCE` is `0` on every event, so edits can't be detected from it. Jarito hashes the
  title, due date and description instead.
- Long values are folded across lines, so naive line-splitting truncates titles.
- Timed deadlines are in UTC. An 11:59 pm Pacific deadline is 06:59 the next day in UTC, so
  it has to be converted or every deadline shows a day late.
- Canvas never reports whether you submitted, so done/started is self-reported and stays on
  your device.

## Running it yourself

```bash
npm install
npm run dev        # http://localhost:3000, /api/feed included
npx vitest run     # tests
npm run build
```

Deploys to Vercel as-is (Vite static build + the `api/` function). For production, add a
Vercel Firewall rate-limit rule on `/api/feed` (about 30 requests per minute per IP); the
in-function limiter only covers a single instance.

## Credits

Built by [Davis Oduor](https://davisoduor.me) · [Oduor Web Services](https://oduorwebservices.com).
Not affiliated with Instructure or Canvas. MIT licensed.
