// Sharing Jarito with classmates. Students pass links around in group chats,
// not on X, so this opens the device's own share sheet (Messages, WhatsApp,
// Instagram, Snapchat…) and falls back to copying the link on computers.

export const SITE = 'https://jarito.app';
const MESSAGE = 'Jarito watches Canvas and Brightspace for moved deadlines. Free, no account.';
export const SHARE_TEXT = `${MESSAGE} ${SITE}`;

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareJarito(): Promise<ShareResult> {
  if (navigator.share) {
    try {
      // The URL goes in `url`, not the text, or some apps show it twice.
      await navigator.share({ title: 'Jarito', text: MESSAGE, url: SITE });
      return 'shared';
    } catch (err) {
      // Closing the share sheet isn't a failure; don't surprise them with a copy.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(SHARE_TEXT);
    return 'copied';
  } catch {
    return 'failed';
  }
}
