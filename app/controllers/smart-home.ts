import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import UserDetailsService from '../services/user-details';
import { action } from '@ember/object';

type AppName = 'dial' | 'message' | 'mail' | 'socialMedia';

export default class SmartHomeController extends Controller{
  @service declare userDetails: UserDetailsService;

  @action
  goToApp(app:AppName):void {
    const routes:Record<AppName, string> = {
      dial: 'smart-dial',
      mail: 'smart-mail',
      message: 'smart-message',
      socialMedia: 'smart-social'
    };
    this.transitionToRoute(routes[app]);
  }
}


declare module '@ember/controller' {
  interface Registry {
    'smart-home': SmartHomeController;
  }
}