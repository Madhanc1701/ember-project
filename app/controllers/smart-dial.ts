import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { cleanDialInput } from '../utils/phone';
import UserDetailsService from '../services/user-details';

export default class SmartDialController extends Controller {
  @service declare userDetails: UserDetailsService;

  @tracked number = '';

  reset(): void {
    this.number = '';
  }

  @action
  goBack(): void {
    this.transitionToRoute('smart-home');
  }

  @action
  updateNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = cleanDialInput(input.value);
    input.value = clean;
    this.number = clean;
  }

  @action
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.call();
    }
  }

  @action
  call(): void {
    const number = this.number.trim();
    if (!number) {
      return;
    }
    this.userDetails.phone!.call();
    window.location.href = `tel:${number}`;
  }
}

declare module '@ember/controller' {
  interface Registry {
    'smart-dial': SmartDialController;
  }
}