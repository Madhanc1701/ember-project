import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { debounce, later, cancel } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { mobileState, secondMobileState, mobileHasHardError } from '../utils/phone';

const TYPING_DELAY = 1000; // ms of silence before a normal message is announced
const ERROR_DELAY = 1000;  // same wait for clearly wrong input (lets the key echo finish)

// message for the screen reader: no symbols and no "3/10" count
function spokenText(state) {
  if (!state) { return ''; }
  return String(state.text || '')
    .replace(/[\u26A0\u2713]/g, '')
    .replace(/^\s*\d+\/10\s*/, '')
    .trim();
}

// stable spoken text for a mobile number field (same text however many bad characters are typed)
function spokenMobile(value, state) {
  const v = String(value || '');
  if (/\D/.test(v)) { return 'Digits only. Remove letters or symbols.'; }
  if (v.length > 10) { return 'Too many digits. Maximum 10.'; }
  return spokenText(state);
}

export default Controller.extend({
  userDetails: service(),

  queryParams: ['simType'],
  simType: null,

  mobileNumber: '',
  secondMobileNumber: '',

  // copies of the typed values, updated after a pause in typing, on blur, or on continue.
  // messages are built from these, so they don't change on every keystroke
  mobileChecked: '',
  secondChecked: '',
  mobileTouched: false,
  secondMobileTouched: false,

  // text for the hidden live regions (what the screen reader speaks)
  mobileAnnounce: '',
  secondAnnounce: '',

  mobileState: computed('mobileChecked', 'mobileTouched', function() {
    return this.mobileTouched ? mobileState(this.mobileChecked) : null;
  }),

  secondMobileState: computed('mobileChecked', 'secondChecked', 'secondMobileTouched', function() {
    return this.secondMobileTouched
      ? secondMobileState(this.secondChecked, this.mobileChecked)
      : null;
  }),

  isSingle: computed('simType', function() { return this.simType === 'single'; }),
  isDual: computed('simType', function() { return this.simType === 'dual'; }),

  // clear first, then set a moment later, so the same text can be spoken again if needed
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

    const text = spokenMobile(this.mobileNumber, mobileState(this.mobileNumber));
    if (text === this._lastMobileSpoken) { return; }   // same message, don't repeat it
    this._lastMobileSpoken = text;
    this.speak('mobileAnnounce', text);
  },

  checkSecond(announce = true) {
    this.setProperties({ secondChecked: this.secondMobileNumber, secondMobileTouched: true });
    if (!announce) { return; }

    const state = secondMobileState(this.secondMobileNumber, this.mobileNumber);
    const text = spokenMobile(this.secondMobileNumber, state);
    if (text === this._lastSecondSpoken) { return; }
    this._lastSecondSpoken = text;
    this.speak('secondAnnounce', text);
  },

  actions: {
    selectSim(type) {
      this.set('simType', type);
    },

    updateNumber(event) {
      this.set('mobileNumber', event.target.value);
      const delay = mobileHasHardError(this.mobileNumber) ? ERROR_DELAY : TYPING_DELAY;
      this._mobileTimer = debounce(this, this.checkMobile, delay);
    },

    touchNumber() {
      // leaving the field: update the message silently, drop any pending announcement
      cancel(this._mobileTimer);
      this._lastMobileSpoken = '';
      this.checkMobile(false);
    },

    updateSecondNumber(event) {
      this.set('secondMobileNumber', event.target.value);
      const delay = mobileHasHardError(this.secondMobileNumber) ? ERROR_DELAY : TYPING_DELAY;
      this._secondTimer = debounce(this, this.checkSecond, delay);
    },

    touchSecondNumber() {
      cancel(this._secondTimer);
      this._lastSecondSpoken = '';
      this.checkSecond(false);
    },

    async continue() {
      const mobileNumber = this.mobileNumber.trim();
      const second = this.secondMobileNumber.trim();
      const isDual = this.simType === 'dual';

      // show every message now (silently), then stop if anything is invalid
      cancel(this._mobileTimer);
      cancel(this._secondTimer);
      this._lastMobileSpoken = '';
      this._lastSecondSpoken = '';
      this.checkMobile(false);
      if (isDual) {
        this.checkSecond(false);
      }

      // send the keyboard focus to the first invalid field; the screen reader
      // reads its label and message
      if (!mobileState(mobileNumber).valid) {
        document.getElementById('numberInput').focus();
        return;
      }
      if (isDual && !secondMobileState(second, mobileNumber).valid) {
        document.getElementById('secondNumberInput').focus();
        return;
      }

      const details = { category: 'basic', simType: this.simType, mobileNumber };
      if (isDual) {
        details.secondMobileNumber = second;
      }

      await this.userDetails.save(details);
      console.log(this.userDetails.phone); // eslint-disable-line no-console
      this.transitionToRoute('basic-home');
    }
  }
});