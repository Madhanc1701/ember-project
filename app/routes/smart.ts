import Route from '@ember/routing/route';
import type SmartController from 'mobile-ember/controllers/smart';
import type Transition from '@ember/routing/transition';

const OS_LIST:string[] = ['android', 'ios', 'windows'];

export default class SmartRoute extends Route{
  setupController(
    controller:SmartController,
    model:unknown,
    transition:Transition
  ):void {
    super.setupController(controller,model,transition);
    // /smart or /smart?os=foo  ->  android (the URL updates to ?os=android)
    if (!controller.osType||!OS_LIST.includes(controller.osType)) {
      controller.set('osType', 'android');
    }
  }
};