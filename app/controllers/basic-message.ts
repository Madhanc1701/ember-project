import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import { cleanMobile } from '../utils/phone';
import UserDetailsService from 'mobile-ember/services/user-details';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

interface Message {
  number: string;
  text: string;
}

export default class BasicMessageController extends Controller{
  @service declare userDetails: UserDetailsService;

  @tracked toNumber= '';
  @tracked text= '';
  @tracked messages : Message[] = [];

  get numberReady(): boolean{
    return this.toNumber.length === 10;
  }

  // message box is only enabled once a full number is typed
  get messageDisabled(): boolean {
    return !this.numberReady;
  }

  get sendDisabled(): boolean {
    return !(this.text.trim().length > 0 && this.numberReady);
  }

  private _scrollToBottom():void {
    const list = document.getElementById('messageList');
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }

  private sendMessage():void {
    const number = this.toNumber;
    const text = this.text.trim();
    if (number.length !== 10 || !text) {
      return;
    }

    this.userDetails.phone!.message();
    // rendered through {{text}} in the template, so it is HTML-escaped
    this.messages = [...this.messages,{ number, text }];
    this.text='';
    scheduleOnce('afterRender', this, this._scrollToBottom);
  }

  reset():void {
    this.toNumber='';
    this.text=''
    this.messages = [];
  }

  @action
  goBack():void {
    this.transitionToRoute('basic-home');
  }

  @action
  updateTo(event:Event):void {
    const input = (event.target as HTMLInputElement);
    const clean = cleanMobile(input.value);
    input.value = clean;
    this.toNumber=clean;
  }

  @action
  updateText(event:Event):void {
    this.text= (event.target as HTMLInputElement).value;
  }

  @action
  onKeydown(event:KeyboardEvent):void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  @action
  submit():void {
    this.sendMessage();
  }
}

declare module '@ember/controller' {
  interface Registry {
    'basic-message': BasicMessageController;
  }
}