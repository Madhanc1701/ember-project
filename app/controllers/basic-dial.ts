import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { run } from '@ember/runloop';
import { cleanMobile, formatTime } from '../utils/phone';
import UserDetailsService from '../services/user-details';

export default class BasicDialController extends Controller{
  @service declare userDetails : UserDetailsService;

  @tracked number= '';
  @tracked showSimModal= false;
  @tracked calling= false;
  @tracked callerNumber= '--';
  @tracked callSim= '';
  @tracked callStatus= 'Calling...';
  @tracked seconds= 0;

  private _connectTimer?: number;
  private _tickTimer?: number;

  private startCall(simLabel:string):void {
    const dialedNumber = this.number.trim();
    this.userDetails.phone.call();

    this.callerNumber= dialedNumber || 'Unknown';
    this.callSim= simLabel ? `via ${simLabel}` : '';
    this.callStatus= 'Calling...';
    this.seconds= 0;
    this.calling= true;

    // "connects" after 2s, then counts up every second.
    // (plain timers on purpose: the ticking clock must not keep the run loop / tests "unsettled")
    this._connectTimer = window.setTimeout(() => run(() => {
      this.callStatus= formatTime(this.seconds);
      this._tickTimer = window.setInterval(() => run(() => {
        this.seconds++;
        this.callStatus= formatTime(this.seconds);
      }), 1000);
    }), 2000);
  }

  _stopTimers():void {
    window.clearTimeout(this._connectTimer);
    window.clearInterval(this._tickTimer);
  }

  willDestroy():void {
    this._stopTimers();
    super.willDestroy();
  }

  // end the call / leave the screen: stop timers, back to the dial screen
  reset():void {
    this._stopTimers();
    this.calling= false;
    this.showSimModal= false;
    this.number= '';
    this.seconds= 0;
  }

  @action
  goBack():void {
    this.transitionToRoute('basic-home');
  }

  @action
  updateNumber(event:Event):void {
    const clean = cleanMobile((event.target as HTMLInputElement).value);
    (event.target as HTMLInputElement).value = clean;
    this.number= clean;
  }

  @action
  onKeydown(event:KeyboardEvent):void {
    if (event.key === 'Enter') {
      this.handleCall();
    }
  }

  @action
  handleCall():void {
    if (this.number.trim().length !== 10) {
      return;
    }
    if (this.userDetails.isDual) {
      this.showSimModal= true;
    } else {
      this.startCall('SIM 1');
    }
  }

  @action
  chooseSim(label:string):void {
    this.showSimModal= false;
    this.startCall(label);
  }

  @action
  cancelSim():void {
    this.showSimModal= false;
  }

  @action
  endCall():void {
    this.reset();
  }
}

declare module '@ember/controller' {
  interface Registry {
    'basic-dial': BasicDialController;
  }
}