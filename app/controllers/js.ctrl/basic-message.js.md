import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { scheduleOnce } from '@ember/runloop';
import { cleanMobile } from '../utils/phone';

export default Controller.extend({
  userDetails: service(),

  toNumber: '',
  text: '',
  messages: null,

  init() {
    this._super(...arguments);
    this.set('messages', A());
  },

  numberReady: computed('toNumber', function() {
    return this.toNumber.length === 10;
  }),

  // message box is only enabled once a full number is typed
  messageDisabled: computed('numberReady', function() {
    return !this.numberReady;
  }),

  sendDisabled: computed('numberReady', 'text', function() {
    return !(this.text.trim().length > 0 && this.numberReady);
  }),

  _scrollToBottom() {
    const list = document.getElementById('messageList');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  },

  sendMessage() {
    const number = this.toNumber;
    const text = this.text.trim();
    if (number.length !== 10 || !text) {
      return;
    }

    this.userDetails.phone.message();
    // rendered through {{text}} in the template, so it is HTML-escaped
    this.messages.pushObject({ number, text });
    this.set('text', '');
    scheduleOnce('afterRender', this, this._scrollToBottom);
  },

  reset() {
    this.setProperties({ toNumber: '', text: '', messages: A() });
  },

  actions: {
    goBack() {
      this.transitionToRoute('basic-home');
    },

    updateTo(event) {
      const clean = cleanMobile(event.target.value);
      event.target.value = clean;
      this.set('toNumber', clean);
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
