import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { EMAIL_RE } from '../utils/phone';

export default Controller.extend({
  userDetails: service(),

  composing: false,
  to: '',
  subject: '',
  body: '',
  mails: null,

  init() {
    this._super(...arguments);
    this.set('mails', A());
  },

  // send is enabled only when the recipient looks like an email address
  sendDisabled: computed('to', function() {
    return !EMAIL_RE.test(this.to.trim());
  }),

  clearCompose() {
    this.setProperties({ to: '', subject: '', body: '' });
  },

  reset() {
    this.clearCompose();
    this.setProperties({ composing: false, mails: A() });
  },

  actions: {
    goBack() {
      this.transitionToRoute('smart-home');
    },

    openCompose() {
      this.clearCompose();
      this.set('composing', true);
    },

    closeCompose() {
      this.set('composing', false);
    },

    updateTo(event) {
      this.set('to', event.target.value);
    },

    updateSubject(event) {
      this.set('subject', event.target.value);
    },

    updateBody(event) {
      this.set('body', event.target.value);
    },

    sendMail() {
      const to = this.to.trim();
      if (!EMAIL_RE.test(to)) {
        return;
      }

      this.userDetails.phone.email();

      // newest first; the template prints these with {{ }} so they are HTML-escaped
      this.mails.unshiftObject({
        to,
        initial: to.charAt(0).toUpperCase(),
        subject: this.subject.trim() || '(no subject)',
        body: this.body.trim()
      });
      this.set('composing', false);
    }
  }
});
