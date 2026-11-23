import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import UserDetailsService from 'mobile-ember/services/user-details';

export default class SmartSocialController extends Controller {
  @service declare userDetails: UserDetailsService;

  @action
  goBack():void {
    this.transitionToRoute('smart-home');
  }
}

declare module '@ember/controller' {
  interface Registry {
    'smart-social': SmartSocialController;
  }
}