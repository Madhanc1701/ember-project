import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { scheduleOnce } from '@ember/runloop';
import { cleanMobile } from '../utils/phone';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import UserDetailsService from 'mobile-ember/services/user-details';

interface conv{
  number :string;
  initials:string;
  text : string
}
const DEFAULT_HINT = 'Enter a 10-digit mobile number to start chatting';

export default class SmartMessageController extends Controller {
  @service declare userDetails: UserDetailsService;

  @tracked composing= false;
  @tracked toNumber='';
  @tracked text= '';
  @tracked conversations:conv[]= [];

  get numberReady():boolean{
    return this.toNumber.length === 10;
  }

  get messageDisabled():boolean{
    return !this.numberReady;
  }

  get sendDisabled():boolean{
    return !(this.text.trim().length > 0 && this.numberReady);
  }

  get hint():string{
    return this.numberReady ? `Say hi to ${this.toNumber}` : DEFAULT_HINT;
  }

  private _focus(id:string):void {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
    }
  }

  private sendMessage():void {
    const number = this.toNumber;
    const text = this.text.trim();
    if (number.length !== 10 || !text) {
      return;
    }

    this.userDetails.phone.message();

    // newest first; printed with {{ }} so the text is HTML-escaped
    this.conversations=[
      { 
        number, 
        initials: number.slice(0, 2), 
        text }
    ];
    this.set('composing', false);
  }

  private reset():void {
    this.composing= false;
    this.toNumber= '';
    this.text= '';
    this.conversations=[];
  }

  @action
  goBack():void {
    this.transitionToRoute('smart-home');
  }

  @action
  openNewChat():void {
    this.toNumber= '';
    this.text= '';
    this.composing= true;
    scheduleOnce('afterRender', this, this._focus, 'toNumberInput');
  }

  @action
  closeNewChat():void {
    this.composing=false;
  }

  @action
  updateTo(event:Event):void {
    const input = event.target as HTMLInputElement
    const clean = cleanMobile(input.value);
    input.value = clean;
    this.toNumber = clean;
    if (clean.length === 10) {
      scheduleOnce('afterRender', this, this._focus, 'messageInput');
    }
  }

  @action
  updateText(event:Event):void {
    this.text=(event.target as HTMLInputElement).value;
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
    'smart-message': SmartMessageController;
  }
}