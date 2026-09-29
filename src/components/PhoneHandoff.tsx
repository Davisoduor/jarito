import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildHandoffUrl } from '../lib/handoff';

export function PhoneHandoff({ feedUrl, onClose }: { feedUrl: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState('');
  const [copied, setCopied] = useState(false);
  const link = buildHandoffUrl(window.location.origin, feedUrl);

  useEffect(() => {
    ref.current?.showModal();
    QRCode.toDataURL(link, { margin: 1, width: 480, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(''));
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch { /* clipboard blocked; the QR still works */ }
  };

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-labelledby="phone-title">
      <h2 id="phone-title">Open Jarito on your phone</h2>
      <p>Point your phone’s camera at this code. Jarito opens with your Canvas feed already connected.</p>
      {src && <img className="qr" src={src} width={240} height={240} alt="QR code that opens Jarito with your feed connected" />}
      <p className="note">
        The code contains your private feed link. Only scan it with your own phone, and don’t share a screenshot of it.
      </p>
      <div className="sheet-actions">
        <button className="btn btn-quiet" onClick={copy}>{copied ? 'Link copied' : 'Copy link instead'}</button>
        <button className="btn btn-primary" onClick={() => ref.current?.close()}>Done</button>
      </div>
    </dialog>
  );
}
