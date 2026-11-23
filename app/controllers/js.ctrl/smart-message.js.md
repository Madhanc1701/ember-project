import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { scheduleOnce } from '@ember/runloop';
import { cleanMobile } from '../utils/phone';

const DEFAULT_HINT = 'Enter a 10-digit mobile number to start chatting';

export default Controller.extend({
  userDetails: service(),

  composing: false,
  toNumber: '',
  text: '',
  conversations: null,

  init() {
    this._super(...arguments);
    this.set('conversations', A());
  },

  numberReady: computed('toNumber', function() {
    return this.toNumber.length === 10;
  }),

  messageDisabled: computed('numberReady', function() {
    return !this.numberReady;
  }),

  sendDisabled: computed('numberReady', 'text', function() {
    return !(this.text.trim().length > 0 && this.numberReady);
  }),

  hint: computed('numberReady', 'toNumber', function() {
    return this.numberReady ? `Say hi to ${this.toNumber}` : DEFAULT_HINT;
  }),

  _focus(id) {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
    }
  },

  sendMessage() {
    const number = this.toNumber;
    const text = this.text.trim();
    if (number.length !== 10 || !text) {
      return;
    }

    this.userDetails.phone.message();

    // newest first; printed with {{ }} so the text is HTML-escaped
    this.conversations.unshiftObject({ number, initials: number.slice(0, 2), text });
    this.set('composing', false);
  },

  reset() {
    this.setProperties({ composing: false, toNumber: '', text: '', conversations: A() });
  },

  actions: {
    goBack() {
      this.transitionToRoute('smart-home');
    },

    openNewChat() {
      this.setProperties({ toNumber: '', text: '', composing: true });
      scheduleOnce('afterRender', this, this._focus, 'toNumberInput');
    },

    closeNewChat() {
      this.set('composing', false);
    },

    updateTo(event) {
      const clean = cleanMobile(event.target.value);
      event.target.value = clean;
      this.set('toNumber', clean);
      if (clean.length === 10) {
        scheduleOnce('afterRender', this, this._focus, 'messageInput');
      }
    },

    updateText(event) {
      this.set('text', event.target.value);
    },

    onKeydown(event) {
      if (event.key === 'Enter') {
        this.sendMessage();
      }
    },

    submit() {
      this.sendMessage();
    }
  }
});
