import Route from '@ember/routing/route';

const SIM_LIST = ['single', 'dual'];

export default Route.extend({
  setupController(controller) {
    this._super(...arguments);
    // /basic or /basic?simType=foo  ->  single (the URL updates to ?simType=single)
    if (!SIM_LIST.includes(controller.simType)) {
      controller.set('simType', 'single');
    }
  }
});