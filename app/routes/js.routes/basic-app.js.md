import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';


export default Route.extend({
  userDetails: service(),
  name: "Madhan",

  beforeModel() {
    if (!this.userDetails.isBasic) {
      this.transitionTo('basic-phone');
    }
  },
  model() {
    return RSVP.hash({
      configBasic: this.store.findRecord('configBasic', this.userDetails.simType),
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
