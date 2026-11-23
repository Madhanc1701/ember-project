import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import UserDetailsService from '../services/user-details';
import { action } from '@ember/object';

type AppName = 'dial' | 'message';

export default class BasicHomeController extends Controller{
  @service declare userDetails: UserDetailsService;

  @action
  goToApp(app:AppName):void {
    const routes:Record<AppName, string> = { dial: 'basic-dial', message: 'basic-message' };
    this.transitionToRoute(routes[app]);
  }
};

declare module '@ember/controller' {
  interface Registry {
    'basic-home': BasicHomeController;
  }
}