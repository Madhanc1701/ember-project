import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  userDetails: service(),

  actions: {
    goToApp(app) {
      const routes = { dial: 'basic-dial', message: 'basic-message' };
      this.transitionToRoute(routes[app]);
    }
  }
});
