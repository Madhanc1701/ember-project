import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import { cleanMobile, formatTime } from '../utils/phone';

export default Controller.extend({
  userDetails: service(),

  number: '',
  showSimModal: false,
  calling: false,
  callerNumber: '--',
  callSim: '',
  callStatus: 'Calling...',
  seconds: 0,

  _connectTimer: null,
  _tickTimer: null,

  startCall(simLabel) {
    const dialedNumber = this.number.trim();
    this.userDetails.phone.call();

    this.setProperties({
      callerNumber: dialedNumber || 'Unknown',
      callSim: simLabel ? `via ${simLabel}` : '',
      callStatus: 'Calling...',
      seconds: 0,
      calling: true
    });

    // "connects" after 2s, then counts up every second.
    // (plain timers on purpose: the ticking clock must not keep the run loop / tests "unsettled")
    this._connectTimer = setTimeout(() => run(() => {
      this.set('callStatus', formatTime(this.seconds));
      this._tickTimer = setInterval(() => run(() => {
        this.incrementProperty('seconds');
        this.set('callStatus', formatTime(this.seconds));
      }), 1000);
    }), 2000);
  },

  _stopTimers() {
    clearTimeout(this._connectTimer);
    clearInterval(this._tickTimer);
  },

  willDestroy() {
    this._stopTimers();
    this._super(...arguments);
  },

  // end the call / leave the screen: stop timers, back to the dial screen
  reset() {
    this._stopTimers();
    this.setProperties({
      calling: false,
      showSimModal: false,
      number: '',
      seconds: 0
    });
  },

  actions: {
    goBack() {
      this.transitionToRoute('basic-home');
    },

    updateNumber(event) {
      const clean = cleanMobile(event.target.value);
      event.target.value = clean;
      this.set('number', clean);
    },

    onKeydown(event) {
      if (event.key === 'Enter') {
        this.send('handleCall');
      }
    },

    handleCall() {
      if (this.number.trim().length !== 10) {
        return;
      }
      if (this.userDetails.isDual) {
        this.set('showSimModal', true);
      } else {
        this.startCall('SIM 1');
      }
    },

    chooseSim(label) {
      this.set('showSimModal', false);
      this.startCall(label);
    },

    cancelSim() {
      this.set('showSimModal', false);
    },

    endCall() {
      this.reset();
    }
  }
});
