import { fetchFeed } from '../../api/_lib/feed';
import { parseCanvasIcs } from '../../src/lib/canvasIcs';
import { emptyState, nextState, type JaritoState } from '../../src/lib/sync';
import { DEMO_FEED } from '../../src/lib/demo';
import { todayISO } from '../../src/lib/dates';
import { originPattern } from './capture';
import { NOTIFY_KEY, STATE_KEY, alertFor, badgeFor, freshAlerts } from './watch';

// Keeps watch while the popup is closed: re-reads the feed every hour, saves
// the result where the popup will find it, and speaks up when a date moves.
// The worker is stopped between alarms, so nothing lives in memory; every
// tick starts from chrome.storage.

const ALARM = 'check-feed';
const EVERY_MINUTES = 60;

async function ensureAlarm() {
  // Recreating an existing alarm would push the next check back an hour.
  if (!(await chrome.alarms.get(ALARM))) {
    chrome.alarms.create(ALARM, { delayInMinutes: 1, periodInMinutes: EVERY_MINUTES });
  }
}

async function readState(): Promise<JaritoState> {
  const saved = (await chrome.storage.local.get(STATE_KEY))[STATE_KEY];
  return saved && typeof saved === 'object' ? { ...emptyState, ...saved } : emptyState;
}

async function check() {
  const prev = await readState();
  if (!prev.feedUrl || prev.feedUrl === DEMO_FEED) return;
  // Access is granted from the popup; without it the fetch can't succeed.
  if (!(await chrome.permissions.contains({ origins: [originPattern(prev.feedUrl)] }))) return;

  let assignments;
  try {
    assignments = parseCanvasIcs(await fetchFeed(prev.feedUrl));
  } catch {
    // Offline, asleep on a train, school system down: keep the last good
    // list and try again next hour.
    return;
  }

  // Apply the result to what's stored now, not to what was there before the
  // fetch: the popup may have ticked or dismissed something meanwhile.
  const latest = await readState();
  if (latest.feedUrl !== prev.feedUrl) return;
  const next = nextState(latest, latest.feedUrl, assignments);
  await chrome.storage.local.set({ [STATE_KEY]: next });

  const notify = (await chrome.storage.local.get(NOTIFY_KEY))[NOTIFY_KEY] !== false;
  const alert = notify ? alertFor(freshAlerts(latest, next), next, todayISO()) : null;
  if (alert) {
    chrome.notifications.create(`jarito-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: alert.title,
      message: alert.message,
      priority: 1,
    });
  }
}

async function updateBadge() {
  const badge = badgeFor(await readState(), todayISO());
  await chrome.action.setBadgeText({ text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ color: badge.color });
  await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

chrome.runtime.onInstalled.addListener(() => { ensureAlarm(); updateBadge(); });
chrome.runtime.onStartup.addListener(() => { ensureAlarm(); updateBadge(); });

chrome.alarms.onAlarm.addListener(alarm => {
  // The hourly tick also rolls the badge over to a new day.
  if (alarm.name === ALARM) check().finally(updateBadge);
});

// Anything the popup does (connect, tick, dismiss) shows on the badge at once.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && STATE_KEY in changes) updateBadge();
});

chrome.notifications.onClicked.addListener(id => {
  chrome.notifications.clear(id);
  // Chrome 127+ can open the popup from here; older versions just clear it.
  chrome.action.openPopup?.().catch(() => {});
});
