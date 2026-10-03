import { useState } from 'react';
import { MessageSquare, Share2 } from 'lucide-react';

import { SITE, shareJarito } from '../lib/share';

export function SharePanel() {
  const [copied, setCopied] = useState(false);

  const [failed, setFailed] = useState(false);

  const share = async () => {
    const result = await shareJarito();
    if (result === 'copied') setCopied(true);
    if (result === 'failed') setFailed(true);
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
      {failed && <p className="note">Copy this link to share: <strong>{SITE}</strong></p>}
    </section>
  );
}

