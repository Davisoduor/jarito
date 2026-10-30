import { contactKind } from './PhoneAlertsWaitlist';

describe('contactKind', () => {
  it('accepts an email or a phone number with area code', () => {
    expect(contactKind('student@sfsu.edu')).toBe('email');
    expect(contactKind('(415) 555-0100')).toBe('phone');
    expect(contactKind('+1 415 555 0100')).toBe('phone');
  });

  it('rejects anything else', () => {
    expect(contactKind('555-0100')).toBeNull();
    expect(contactKind('call me maybe')).toBeNull();
    expect(contactKind('')).toBeNull();
  });
});
