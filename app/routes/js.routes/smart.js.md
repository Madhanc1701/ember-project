import Route from '@ember/routing/route';

const OS_LIST = ['android', 'ios', 'windows'];

export default Route.extend({
  setupController(controller) {
    this._super(...arguments);
    // /smart or /smart?os=foo  ->  android (the URL updates to ?os=android)
    if (!OS_LIST.includes(controller.osType)) {
      controller.set('osType', 'android');
    }
  }
});