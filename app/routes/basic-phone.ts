import Route from '@ember/routing/route';
import type Transition from '@ember/routing/-private/transition';
import type BasicPhoneController from 'mobile-ember/controllers/basic-phone';

const SIM_LIST:string[] = ['single', 'dual'];

export default class BasicPhoneRoute extends Route{
  setupController(
    controller:BasicPhoneController,
    model:unknown,
    transition:Transition
  ):void  {
    super.setupController(controller,model,transition);
    
    if (!controller.simType||!SIM_LIST.includes(controller.simType)) {
      controller.simType='single';
    }
  }
};


