import { useState } from 'react';
import { MessageSquare, Share2 } from 'lucide-react';

const SITE = 'https://jarito.app';
const SHARE_TEXT = `Jarito watches Canvas and Brightspace for moved deadlines. Free, no account: ${SITE}`;

export function SharePanel() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Jarito', text: SHARE_TEXT, url: SITE });
        return;
      } catch {
        // Fall through to copy when the share sheet is dismissed or unavailable.
      }
    }
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      setCopied(true);
    } catch {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="share-panel" aria-labelledby="share-title">
      <div>
        <h2 id="share-title">Help classmates catch moved deadlines too</h2>
        <p>Share Jarito after it works for you. Do not share your private calendar feed link.</p>
      </div>
      <div className="share-actions">
        <button className="btn btn-primary" onClick={share}>
          <Share2 size={17} aria-hidden="true" /> {copied ? 'Link copied' : 'Share Jarito'}
        </button>
        <a className="btn" href="/feedback">
          <MessageSquare size={17} aria-hidden="true" /> Send feedback
        </a>
      </div>
    </section>
  );
}

