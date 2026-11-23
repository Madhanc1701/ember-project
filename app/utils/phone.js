/* eslint-disable no-console */

// ---------------------------------------------------------------
// Phone class hierarchy (ported 1:1 from mobile_oop/js/phone.js)
//
//   Phone
//   ├── BasicPhone
//   │   ├── SingleSim
//   │   └── DualSim
//   └── SmartPhone
//       ├── Android
//       ├── IOS
//       └── Windows
// ---------------------------------------------------------------

export class Phone {
  constructor(mobileNumber) { this.mobileNumber = mobileNumber; }
  call() { console.log(`Calling : ${this.mobileNumber}`); }
  message() { console.log(`Message sent from ${this.mobileNumber}`); }
}

export class BasicPhone extends Phone {}
export class SingleSim extends BasicPhone {}

export class DualSim extends BasicPhone {
  constructor(mobileNumber, secondMobileNumber) {
    super(mobileNumber);
    this.secondMobileNumber = secondMobileNumber;
  }
}

export class SmartPhone extends Phone {
  constructor(mobileNumber, gmailAccount) {
    super(mobileNumber);
    this.gmailAccount = gmailAccount;
  }
  email() { console.log(`Email sent from ${this.gmailAccount}`); }
}

export class Android extends SmartPhone {
  constructor(mobileNumber, gmailAccount, instaAccount) {
    super(mobileNumber, gmailAccount);
    this.instaAccount = instaAccount;
  }
}

export class IOS extends SmartPhone {
  constructor(mobileNumber, gmailAccount, twitterAccount) {
    super(mobileNumber, gmailAccount);
    this.twitterAccount = twitterAccount;
  }
}

export class Windows extends SmartPhone {
  constructor(mobileNumber, gmailAccount, skypeAccount) {
    super(mobileNumber, gmailAccount);
    this.skypeAccount = skypeAccount;
  }
}

// ---------------------------------------------------------------
// Factory: plain config object -> phone instance
// config = { category, simType, os, mobileNumber, secondMobileNumber,
//            gmailAccount, socialAccount }
// ---------------------------------------------------------------
export function buildPhoneFromConfig(config) {
  if (!config) {
    return null;
  }

  const { category, simType, os, mobileNumber, secondMobileNumber, gmailAccount, socialAccount } = config;

  if (category === 'basic') {
    return simType === 'dual'
      ? new DualSim(mobileNumber, secondMobileNumber)
      : new SingleSim(mobileNumber);
  }

  if (category === 'smart') {
    const smartTypes = {
      android: () => new Android(mobileNumber, gmailAccount, socialAccount),
      ios: () => new IOS(mobileNumber, gmailAccount, socialAccount),
      windows: () => new Windows(mobileNumber, gmailAccount, socialAccount)
    };
    return smartTypes[os] ? smartTypes[os]() : null;
  }

  return null;
}

export function osKeyFor(phone) {
  if (phone instanceof Android) { return 'android'; }
  if (phone instanceof IOS) { return 'ios'; }
  if (phone instanceof Windows) { return 'windows'; }
  return 'android';
}

// ---------------------------------------------------------------
// Small validation / formatting helpers shared by the controllers
// ---------------------------------------------------------------
export const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// keep digits only, max 10 (mobile numbers)
export function cleanMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

// Live validation states: { text, valid, invalid }. Shown only after the field was left once
// (see the controllers), same style as the sign-in page messages.
export function mobileState(value) {
  const v = String(value || '');
  const len = v.length;
  if (len === 0) {
    return { text: 'Mobile number is required', valid: false, invalid: true };
  }
  const problems = [];
  if (/\D/.test(v)) {
    problems.push('digits only (remove letters/symbols)');
  }
  if (len < 10) {
    problems.push(`${10 - len} more digit${10 - len === 1 ? '' : 's'} needed`);
  } else if (len > 10) {
    problems.push(`remove ${len - 10} extra character${len - 10 === 1 ? '' : 's'}`);
  }
  if (problems.length) {
    return { text: `${len}/10 ${problems.join(', ')}`, valid: false, invalid: true };
  }
  return { text: 'Valid mobile number', valid: true, invalid: false };
}

export function gmailState(value) {
  const v = String(value || '').trim();
  if (v.length === 0) {
    return { text: 'Gmail account is required', valid: false, invalid: true };
  }
  if (!GMAIL_RE.test(v)) {
    return { text: 'Enter a valid Gmail address (name@gmail.com)', valid: false, invalid: true };
  }
  return { text: 'Valid Gmail account', valid: true, invalid: false };
}

// second SIM number: same rules as a mobile number + must differ from SIM 1
export function secondMobileState(second, first) {
  const state = mobileState(second);
  if (state.valid && second === first) {
    return { text: ' SIM 2 number must be different from SIM 1', valid: false, invalid: true };
  }
  return state;
}

// dialer on the smart phone also allows + # * space and -
export function cleanDialInput(value) {
  return String(value || '').replace(/[^0-9+#*\s-]/g, '');
}

// 65 -> "01:05"
export function formatTime(total) {
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function mobileHasHardError(value) {
  const v = String(value || '');
  return /\D/.test(v) || v.length > 10;
}
