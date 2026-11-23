import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  userDetails: service(),

  actions: {
    goToApp(app) {
      const routes = {
        dial: 'smart-dial',
        mail: 'smart-mail',
        message: 'smart-message',
        socialMedia: 'smart-social'
      };
      this.transitionToRoute(routes[app]);
    }
  }
});
