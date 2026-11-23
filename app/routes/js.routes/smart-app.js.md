import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';


export default Route.extend({
  userDetails: service(),

  beforeModel() {
    if (!this.userDetails.isSmart) {
      this.transitionTo('smart');
    }
  },

  model() {
    return RSVP.hash({
      configs: this.store.findRecord('config', this.userDetails.os),
      commons : this.store.queryRecord('common', {})
    })
  },

  resetController(controller, isExiting) {
    this._super(...arguments);
    if (isExiting && typeof controller.reset === 'function') {
      controller.reset();
    }
  }
});
