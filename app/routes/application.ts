import Route from '@ember/routing/route';
import { action } from '@ember/object';
import type Transition from '@ember/routing/-private/transition';
import { inject as service } from '@ember/service';
import LoaderService from 'mobile-ember/services/loader';


export default class ApplicationRoute extends Route {
  @service declare loader : LoaderService;
  @action
  loading(transition: Transition): boolean {

    this.loader.isLoading=true;

    transition.finally(() => {
      if (!this.isDestroyed && !this.isDestroying) {
        this.loader.isLoading= false;
      }
    });

    return false; // let the event keep bubbling
  }
}