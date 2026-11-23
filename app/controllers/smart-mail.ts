import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { EMAIL_RE } from '../utils/phone';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import UserDetailsService from 'mobile-ember/services/user-details';

interface Mail{
  to:string
  initial:string
  subject:string
  body:string
}
export default class SmartMailController extends Controller {
  @service declare userDetails: UserDetailsService;

  @tracked composing= false;
  @tracked to= '';
  @tracked subject= '';
  @tracked body= '';
  @tracked mails:Mail[]= [];

  // send is enabled only when the recipient looks like an email address
  get sendDisabled():boolean{
    return !EMAIL_RE.test(this.to.trim());
  }

  private clearCompose():void {
    this.to='';
    this.subject='';
    this.body='';
  }

  reset():void {
    this.clearCompose();
    this.composing= false;
    this.mails= [] ;
  }

  @action
  goBack():void {
    this.transitionToRoute('smart-home');
  }
  
  @action
  openCompose():void {
    this.clearCompose();
    this.composing= true;
  }
  
  @action
  closeCompose():void {
    this.composing= false;
  }
  
  @action
  updateTo(event:Event):void {
    this.to= (event.target as HTMLInputElement).value;
  }
  
  @action
  updateSubject(event:Event):void {
    this.subject= (event.target as HTMLInputElement).value;
  }
  
  @action
  updateBody(event:Event):void {
    this.body= (event.target as HTMLTextAreaElement).value;
  }
  
  @action
  sendMail():void {
    const to = this.to.trim();
    if (!EMAIL_RE.test(to)) {
      return;
    }

    this.userDetails.phone.email();

    // newest first; the template prints these with {{ }} so they are HTML-escaped
    this.mails=[
      {
        to,
        initial: to.charAt(0).toUpperCase(),
        subject: this.subject.trim() || '(no subject)',
        body: this.body.trim()
      },
      ...this.mails
    ]
    this.composing=false;
  }
};

declare module '@ember/controller' {
  interface Registry {
    'smart-mail': SmartMailController;
  }
}