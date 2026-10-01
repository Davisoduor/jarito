import { ClipboardPaste, Heart, MessageSquare, Share2 } from 'lucide-react';
import { BrightspaceGuide } from './BrightspaceGuide';
import { FeedGuide } from './FeedGuide';

const SITE = 'https://jarito.vercel.app';
const DONATION_URL = import.meta.env.VITE_DONATION_URL as string | undefined;
const FEEDBACK_URL =
  'https://github.com/Davisoduor/jarito/issues/new?title=Jarito%20feedback&body=What%20school%20or%20LMS%20are%20you%20using%3F%0A%0AWhat%20worked%3F%0A%0AWhat%20was%20confusing%3F%0A%0ADid%20Jarito%20catch%20a%20moved%20deadline%3F%0A%0AWhat%20would%20make%20you%20use%20it%20every%20day%3F';

export function CanvasHelp() {
  return (
    <main className="page">
      <p className="eyebrow">Canvas setup</p>
      <h1>Copy your Canvas calendar link in under a minute.</h1>
      <p className="page-lede">
        Jarito reads the same calendar feed that Canvas gives to Google Calendar and Apple Calendar.
        Use a browser, not the Canvas app, because the app may hide the feed link.
      </p>

      <div className="page-actions">
        <a className="btn btn-primary" href="/">
          <ClipboardPaste size={17} aria-hidden="true" /> Paste my link
        </a>
        <a className="btn" href="/brightspace">I use Brightspace</a>
      </div>

      <section className="instruction-card" aria-labelledby="canvas-steps">
        <h2 id="canvas-steps">Steps</h2>
        <ol className="plain-steps">
          <li>Open Canvas in a browser.</li>
          <li>Click <strong>Calendar</strong> in the left sidebar.</li>
          <li>Click <strong>Calendar Feed</strong> at the bottom right.</li>
          <li>Copy the whole link from the URL field.</li>
          <li>Return to Jarito and press <strong>Paste link and start watching</strong>.</li>
        </ol>
        <FeedGuide host="yourschool.instructure.com" />
      </section>

      <FAQ
        items={[
          ['Can I use the Canvas phone app?', 'Use a browser for setup. The phone app can hide the calendar feed link, but Jarito works well from the home screen after it is connected.'],
          ['Which calendar should I copy?', 'Canvas gives one feed that includes events and assignments from all your Canvas calendars.'],
          ['What if I pasted the link into the wrong box?', 'Jarito detects a feed link anywhere on the setup screen and offers to start watching right away.'],
        ]}
      />
    </main>
  );
}

export function BrightspaceHelp() {
  return (
    <main className="page">
      <p className="eyebrow">Brightspace / D2L setup</p>
      <h1>Turn on calendar feeds, then copy the Subscribe link.</h1>
      <p className="page-lede">
        Brightspace support is in beta. The best link is <strong>All Calendars and Tasks</strong>,
        because that includes every course instead of one class at a time.
      </p>

      <div className="page-actions">
        <a className="btn btn-primary" href="/">
          <ClipboardPaste size={17} aria-hidden="true" /> Paste my link
        </a>
        <a className="btn" href="/canvas">I use Canvas</a>
      </div>

      <section className="instruction-card" aria-labelledby="brightspace-steps">
        <h2 id="brightspace-steps">Steps</h2>
        <ol className="plain-steps">
          <li>Open Brightspace in a browser.</li>
          <li>Go to <strong>Calendar</strong>.</li>
          <li>Click <strong>Settings</strong>.</li>
          <li>Turn on <strong>Enable Calendar Feeds</strong>, then save.</li>
          <li>Click <strong>Subscribe</strong>.</li>
          <li>Choose <strong>All Calendars and Tasks</strong>.</li>
          <li>Copy the whole link and paste it into Jarito.</li>
        </ol>
        <BrightspaceGuide host="yourschool.brightspace.com" />
      </section>

      <FAQ
        items={[
          ['I do not see Subscribe. What now?', 'Open Calendar Settings, turn on Enable Calendar Feeds, save, then return to the calendar.'],
          ['Should I choose one course or all courses?', 'Choose All Calendars and Tasks unless you only want Jarito to watch one course.'],
          ['Why is Brightspace marked beta?', 'Canvas has been tested with real student feeds. Brightspace follows the documented feed format, but we still want reports from more schools.'],
        ]}
      />
    </main>
  );
}

export function SupportPage() {
  const donationEnabled = Boolean(DONATION_URL);

  return (
    <main className="page">
      <p className="eyebrow">Support Jarito</p>
      <h1>Jarito stays free for students.</h1>
      <p className="page-lede">
        If Jarito helped you catch a deadline change, you can help keep it running.
        Donations cover the domain, hosting and the quiet maintenance that makes the tool reliable.
      </p>

      <section className="donation-card" aria-labelledby="donate-title">
        <h2 id="donate-title">Donate</h2>
        <div className="donation-grid">
          {['$3', '$5', '$10'].map(amount => (
            donationEnabled ? (
              <a key={amount} className="donation-button" href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                <Heart size={16} aria-hidden="true" />
                <span>{amount}</span>
              </a>
            ) : (
              <button key={amount} className="donation-button is-disabled" type="button" disabled>
                <Heart size={16} aria-hidden="true" />
                <span>{amount}</span>
              </button>
            )
          ))}
        </div>
        <p className="note">
          {donationEnabled
            ? 'The donation link opens the payment page in a new tab.'
            : 'Donation checkout is being connected. The page is here so the support link can stay in one place.'}
        </p>
      </section>

      <section className="instruction-card" aria-labelledby="help-title">
        <h2 id="help-title">Help without money</h2>
        <div className="support-actions">
          <a className="btn btn-primary" href={shareHref()} target="_blank" rel="noopener noreferrer">
            <Share2 size={17} aria-hidden="true" /> Share with classmates
          </a>
          <a className="btn" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            <MessageSquare size={17} aria-hidden="true" /> Send feedback
          </a>
        </div>
        <p className="note">
          Please do not share your private feed link in feedback. A screenshot of how the list looks is enough.
        </p>
      </section>
    </main>
  );
}

function FAQ({ items }: { items: [string, string][] }) {
  return (
    <section className="faq" aria-label="Questions">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}

function shareHref() {
  const text = encodeURIComponent(
    `Jarito watches Canvas and Brightspace for moved deadlines. Free, no account: ${SITE}`,
  );
  return `https://twitter.com/intent/tweet?text=${text}`;
}
