# Chrome Web Store listing

Copy for each field in the Developer Dashboard, in the order the dashboard asks for it.

## Store listing

**Name:** Jarito

**Summary** (132 characters max; this is 110):

> Keeps watch over your Canvas and Brightspace deadlines, and tells you the moment a professor moves a due date.

**Category:** Education

**Language:** English (United States)

**Description:**

```
Canvas and Brightspace move deadlines quietly. Jarito says so out loud.

Jarito puts every assignment from every course into one list, sorted by what's due next, and tells you when a professor moves a due date or posts something new.

SET UP IN ONE CLICK
Open any Canvas page, click the Jarito icon, and press "Get my link from this tab". Jarito finds your calendar feed for you. On Brightspace, open Calendar and press Subscribe first, or paste your feed link.

KEEPS WATCH WHILE YOU WORK
• Checks your calendar about once an hour while Chrome is open
• A notification when a due date moves or new work is posted
• The toolbar icon shows what's due today, and turns gold when something changed
• "2 things changed since you last looked": every moved date, with the old date crossed out

ONE LIST FOR THE WHOLE SEMESTER
• Grouped by day: Overdue, Today, Tomorrow, and on through the term
• Tick work off as you start and finish it
• Filter by course
• Move it to your phone by scanning a code

PRIVATE BY DESIGN
• No account, no sign-up
• Your feed link and assignments stay in Chrome on your computer
• Reads your calendar straight from your school. Nothing goes through our servers
• Only asks for access to your school's site, and only when you connect
• No ads, no analytics, no tracking
• Open source: github.com/Davisoduor/jarito

Free for students. Also on the web, and as a phone app, at jarito.app.

Jarito is an independent student tool. Not affiliated with Instructure, Canvas, D2L or Brightspace.
```

**Official URL / homepage:** https://jarito.app

**Support URL:** https://jarito.app/feedback

## Privacy practices tab

**Single purpose:**

> Jarito shows a student's assignments from their Canvas or Brightspace calendar feed in one list and tells them when a due date changes or new work is posted.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the student's calendar feed link, assignment list, what they've marked done, and their notification choice on their own computer, so the list is there when they open the popup and the background check can compare against the last one. |
| `activeTab` | When the student presses "Get my link from this tab", Jarito reads the open tab once to find their own calendar feed link, so they don't have to look for it and paste it. |
| `scripting` | Runs that one lookup in the tab the student is on, only when they press the button. On Canvas it reads the signed-in student's own feed link from their profile; elsewhere it looks for a feed link already showing on the page. |
| `alarms` | Schedules the hourly check of the student's calendar feed, which is how Jarito notices a moved due date while the popup is closed. |
| `notifications` | Tells the student when a due date moves or a new assignment is posted. They can turn this off in the popup. |
| Host permission (optional, `https://*/*`) | Schools run Canvas and Brightspace on their own domains (e.g. canvas.myschool.edu), so the list of possible hosts can't be written into the manifest. Nothing is granted at install. Jarito asks for one school's site at a time, when the student connects, with Chrome's permission prompt, and uses it only to download that student's calendar feed. |

**Remote code:** No, I am not using remote code. Every script is in the package.

**Data usage**, the boxes to tick. Nothing is sent to the developer, but the extension handles these on the device, and declaring them is the safer reading of the policy:

- **Authentication information:** the calendar feed link, which works like a password to the student's calendar.
- **Website content:** the calendar itself: assignment titles, courses, due dates and descriptions.

Then tick all three certifications: not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used to determine creditworthiness or for lending.

**Privacy policy URL:** https://jarito.app/privacy. Deploy the updated page (with "The Chrome extension" section) before submitting.

## Graphics

| Asset | Size | What to show |
|---|---|---|
| Store icon | 128×128 | `docs/store/store-icon-128.png` (96px mark with the 16px transparent padding the store asks for) |
| Screenshot 1 | 1280×800 | The change report: "2 things changed since you last looked", with a moved date crossed out |
| Screenshot 2 | 1280×800 | A Canvas tab with the popup open on "Get my link from this tab" |
| Screenshot 3 | 1280×800 | A "Due date moved" notification next to the gold badge |
| Screenshot 4 | 1280×800 | The list grouped by day, with ticked and overdue work |
| Small promo tile | 440×280 | Optional. The crescent mark with "Never miss a moved deadline." |

Use the sample coursework for screenshots, never a real student's calendar.

## Releasing

1. Bump `version` in `extension/public/manifest.json` (every upload needs a higher version).
2. `npm run build:extension`
3. `cd dist-extension && zip -r ../jarito-extension.zip . && cd ..`
4. Developer Dashboard → the item → Package → Upload new package, then Submit for review.

First-time setup: register at https://chrome.google.com/webstore/devconsole (one-time US$5 fee) and verify the contact email.
Review usually takes a few days; optional host permissions and no remote code keep it on the lighter path.
