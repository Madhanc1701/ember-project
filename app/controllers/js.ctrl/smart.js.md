import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { debounce, later, cancel } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { mobileState, gmailState, mobileHasHardError } from '../utils/phone';

const TYPING_DELAY = 1000; // ms of silence before a normal message is announced
const ERROR_DELAY = 1000;   // shorter wait for clearly wrong input (lets the key echo finish)

// true when the gmail value can never become valid, however much more is typed
function gmailHasHardError(value) {
  const v = String(value || '').trim();
  if (/\s/.test(v)) { return true; }

  const at = v.indexOf('@');
  if (at === -1) { return false; }          // still typing the name part
  if (at === 0) { return true; }            // starts with @
  if (v.indexOf('@', at + 1) !== -1) { return true; } // second @

  const domain = v.slice(at + 1).toLowerCase();
  return !'gmail.com'.startsWith(domain);   // e.g. "yahoo", or extra text after gmail.com
}

// message for the screen reader: no symbols and no "3/10" count
// stable spoken text for the mobile field
function spokenMobile(value) {
  const v = String(value || '');
  if (/\D/.test(v)) { return 'Digits only. Remove letters or symbols.'; }
  if (v.length > 10) { return 'Too many digits. Maximum 10.'; }
  return spokenText(mobileState(v));
}

// message for the screen reader: no symbols and no "3/10" count
function spokenText(state) {
  if (!state) { return ''; }
  return String(state.text || '')
    .replace(/[\u26A0\u2713]/g, '')
    .replace(/^\s*\d+\/10\s*/, '')
    .trim();
}

export default Controller.extend({
  userDetails: service(),

  queryParams: [{ osType: { as: 'os' } }],
  osType: null,

  mobileNumber: '',
  gmailAcc: '',
  socialAcc: '',
  socialAccounts: null, // remembers the id typed for each OS while you switch tabs

  // copies of the typed values, updated after a pause in typing, on blur, or on continue.
  // the messages are built from these, so they don't change on every keystroke
  mobileChecked: '',
  gmailChecked: '',
  mobileTouched: false,
  gmailTouched: false,

  // text for the hidden live regions (what the screen reader speaks)
  mobileAnnounce: '',
  gmailAnnounce: '',

  mobileState: computed('mobileChecked', 'mobileTouched', function() {
    return this.mobileTouched ? mobileState(this.mobileChecked) : null;
  }),

  gmailState: computed('gmailChecked', 'gmailTouched', function() {
    return this.gmailTouched ? gmailState(this.gmailChecked) : null;
  }),

  init() {
    this._super(...arguments);
    this.set('socialAccounts', {});
  },

  isAndroid: computed('osType', function() { return this.osType === 'android'; }),
  isIos: computed('osType', function() { return this.osType === 'ios'; }),
  isWindows: computed('osType', function() { return this.osType === 'windows'; }),

  // clear first, then set a moment later, so the same text is spoken again if needed
  speak(prop, text) {
    this.set(prop, '');
    later(this, () => {
      if (!this.isDestroyed && !this.isDestroying) {
        this.set(prop, text);
      }
    }, 100);
  },

  checkMobile(announce = true) {
    this.setProperties({ mobileChecked: this.mobileNumber, mobileTouched: true });
    if (!announce) { return; }

    const text = spokenMobile(this.mobileNumber);
    if (text === this._lastMobileSpoken) { return; }   // same message, don't repeat it
    this._lastMobileSpoken = text;
    this.speak('mobileAnnounce', text);
  },

  checkGmail(announce = true) {
    this.setProperties({ gmailChecked: this.gmailAcc, gmailTouched: true });
    if (!announce) { return; }

    const text = spokenText(gmailState(this.gmailAcc));
    if (text === this._lastGmailSpoken) { return; }
    this._lastGmailSpoken = text;
    this.speak('gmailAnnounce', text);
  },

  actions: {
    selectOs(type) {
      const accounts = Object.assign({}, this.socialAccounts, { [this.osType]: this.socialAcc });
      this.setProperties({
        socialAccounts: accounts,
        osType: type,
        socialAcc: accounts[type] || ''
      });
    },

    updateNumber(event) {
      this.set('mobileNumber', event.target.value);
      const delay = mobileHasHardError(this.mobileNumber) ? ERROR_DELAY : TYPING_DELAY;
      this._mobileTimer = debounce(this, this.checkMobile, delay);
    },

    touchNumber() {
      cancel(this._mobileTimer);
      this._lastMobileSpoken = '';
      this.checkMobile(false);
    },

    touchGmail() {
      cancel(this._gmailTimer);
      this._lastGmailSpoken = '';
      this.checkGmail(false);
    },

    updateGmail(event) {
      this.set('gmailAcc', event.target.value);
      const delay = gmailHasHardError(this.gmailAcc) ? ERROR_DELAY : TYPING_DELAY;
      this._gmailTimer = debounce(this, this.checkGmail, delay);
    },

    updateSocial(event) {
      this.set('socialAcc', event.target.value);
    },

    async continue() {
      const mobileNumber = this.mobileNumber.trim();
      const gmailAccount = this.gmailAcc.trim();

      // show every message now (silently), then stop if anything is invalid
      cancel(this._mobileTimer);
      cancel(this._gmailTimer);
      this.checkMobile(false);
      this.checkGmail(false);

      // send the keyboard focus to the first invalid field; the screen reader
      // reads its label and message
      if (!mobileState(mobileNumber).valid) {
        document.getElementById('numberInput').focus();
        return;
      }
      if (!gmailState(gmailAccount).valid) {
        document.getElementById('gmailInput').focus();
        return;
      }

      await this.userDetails.save({
        category: 'smart',
        os: this.osType,
        mobileNumber,
        gmailAccount,
        socialAccount: this.socialAcc.trim()
      });
      console.log(this.userDetails.phone); // eslint-disable-line no-console

      this.transitionToRoute('smart-home');
    }
  }
});