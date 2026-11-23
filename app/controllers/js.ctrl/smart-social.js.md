import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  userDetails: service(),

  actions: {
    goBack() {
      this.transitionToRoute('smart-home');
    }
  }
});
