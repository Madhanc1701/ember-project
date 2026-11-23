import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import UserDetailsService from 'mobile-ember/services/user-details';
import Store from '@ember-data/store'
import Controller from '@ember/controller';

type ResetableController = Controller & {reset?: ()=> void};

export default class BasicAppRoute extends Route{
  @service declare userDetails: UserDetailsService;
  @service declare store : Store;

  beforeModel() {
    if (!this.userDetails.isBasic) {
      this.transitionTo('basic-phone');
    }
  }
  model() {
    return RSVP.hash({
      configBasic: this.store.findRecord('configBasic', this.userDetails.simType),
      commons : this.store.queryRecord('common', {})
    })  
  }

  resetController(controller:ResetableController, isExiting:boolean) {
    if (isExiting && typeof controller.reset === 'function') {
      controller.reset();
    }
  }
};
