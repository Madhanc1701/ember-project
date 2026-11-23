import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Store from '@ember-data/store';
import RSVP from 'rsvp';
import UserDetailsService from 'mobile-ember/services/user-details';
import Controller from '@ember/controller';

type ResetableController = Controller & {reset?: ()=> void};

export default class SamrtAppRoute extends Route{
  @service declare userDetails : UserDetailsService;
  @service declare store : Store;

  beforeModel() {
    if (!this.userDetails.isSmart) {
      this.transitionTo('smart');
    }
  }

  model() {
    return RSVP.hash({
      configs: this.store.findRecord('config', this.userDetails.os),
      commons : this.store.queryRecord('common', {})
    })
  }

  resetController(controller:ResetableController, isExiting:boolean) {
    this._super(...arguments);
    if (isExiting && typeof controller.reset === 'function') {
      controller.reset();
    }
  }
};
