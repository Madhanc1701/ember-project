import Controller from '@ember/controller';
import { action } from '@ember/object';
import { debounce, later, cancel } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { mobileState, secondMobileState, mobileHasHardError } from '../utils/phone';
import { tracked} from '@glimmer/tracking'
import UserDetailsService from '../services/user-details';

const TYPING_DELAY = 1000; // ms of silence before a normal message is announced
const ERROR_DELAY = 1000;  // same wait for clearly wrong input (lets the key echo finish)

interface FieldState{
  text:string;
  valid:boolean;
  invalid:boolean;
}

type AnnounceProp = 'mobileAnnounce' | 'secondAnnounce';
type Timer = ReturnType<typeof debounce>;

// message for the screen reader: no symbols and no "3/10" count
function spokenText(state: FieldState |null) : string{
  if (!state) { return ''; }
  return String(state.text || '')
    .replace(/[\u26A0\u2713]/g, '')
    .replace(/^\s*\d+\/10\s*/, '')
    .trim();
}

// stable spoken text for a mobile number field (same text however many bad characters are typed)
function spokenMobile(value :string, state:FieldState):string {
  const v = String(value || '');
  if (/\D/.test(v)) { return 'Digits only. Remove letters or symbols.'; }
  if (v.length > 10) { return 'Too many digits. Maximum 10.'; }
  return spokenText(state);
}

export default class BasicPhoneController extends Controller{
  @service declare userDetails :  UserDetailsService;

  queryParams= ['simType'];
  @tracked simType : string | null = null;

  @tracked mobileNumber= '';
  @tracked secondMobileNumber= '';

  // copies of the typed values, updated after a pause in typing, on blur, or on continue.
  // messages are built from these, so they don't change on every keystroke
  @tracked mobileChecked= '';
  @tracked secondChecked= '';
  @tracked mobileTouched= false;
  @tracked secondMobileTouched= false;

  // text for the hidden live regions (what the screen reader speaks)
  @tracked mobileAnnounce= '';
  @tracked secondAnnounce= '';

  private mobileTimer?: Timer;
  private secondTimer?: Timer;
  private lastMobileSpoken = '';
  private lastSecondSpoken = '';

  private runMobileCheck = (): void => this.checkMobile();
  private runSecondCheck = (): void => this.checkSecond();


  get mobileState(): FieldState | null{
    return this.mobileTouched ? mobileState(this.mobileChecked) : null;
  };

  get secondMobileState(): FieldState | null{
    return this.secondMobileTouched
      ? secondMobileState(this.secondChecked, this.mobileChecked)
      : null;
  };

  get isSingle(): boolean  { return this.simType === 'single' };
  get isDual(): boolean {return this.simType === 'dual'} ;

  willDestroy(): void {
    super.willDestroy();
    cancel(this.mobileTimer);
    cancel(this.secondTimer);
  }
  // clear first, then set a moment later, so the same text can be spoken again if needed
  private speak(prop:AnnounceProp, text:string):void {
    this[prop]= '';
    later(() => {
      if (!this.isDestroyed && !this.isDestroying) {
        this[prop]= text;
      }
    }, 100);
  };

  private checkMobile(announce = true):void {
    this.mobileChecked= this.mobileNumber;
    this.mobileTouched= true;
    if (!announce) { return; }

    const text = spokenMobile(this.mobileNumber, mobileState(this.mobileNumber));
    if (text === this.lastMobileSpoken) { return; }   // same message, don't repeat it
    this.lastMobileSpoken = text;
    this.speak('mobileAnnounce', text);
  };

  private checkSecond(announce = true):void {
    this.secondChecked= this.secondMobileNumber;
    this.secondMobileTouched= true;
    if (!announce) { return; }

    const state = secondMobileState(this.secondMobileNumber, this.mobileNumber);
    const text = spokenMobile(this.secondMobileNumber, state);
    if (text === this.lastSecondSpoken) { return; }
    this.lastSecondSpoken = text;
    this.speak('secondAnnounce', text);
  };

  @action
  selectSim(type: string):void
  {
    this.simType = type;
  }

  @action
  updateNumber(event : Event) : void {
    this.mobileNumber= (event.target as HTMLInputElement).value;
    const delay = mobileHasHardError(this.mobileNumber) ? ERROR_DELAY : TYPING_DELAY;
    this.mobileTimer = debounce(this.runMobileCheck, delay);
  }

  @action
  touchNumber() : void{
    // leaving the field: update the message silently, drop any pending announcement
    cancel(this.mobileTimer);
    this.lastMobileSpoken = '';
    this.checkMobile(false);
  }

  @action
  updateSecondNumber(event:Event):void {
    this.secondMobileNumber= (event.target as HTMLInputElement).value;
    const delay = mobileHasHardError(this.secondMobileNumber) ? ERROR_DELAY : TYPING_DELAY;
    this.secondTimer = debounce(this.runSecondCheck, delay);
  }

  @action
  touchSecondNumber():void {
    cancel(this.secondTimer);
    this.lastSecondSpoken = '';
    this.checkSecond(false);
  }

  @action
  async continue():Promise<void> {
    const mobileNumber = this.mobileNumber.trim();
    const second = this.secondMobileNumber.trim();
    const isDual = this.simType === 'dual';

    // show every message now (silently), then stop if anything is invalid
    cancel(this.mobileTimer);
    cancel(this.secondTimer);
    // this._lastMobileSpoken = '';
    // this._lastSecondSpoken = '';
    this.checkMobile(false);
    if (isDual) {
      this.checkSecond(false);
    }

    // send the keyboard focus to the first invalid field; the screen reader
    // reads its label and message
    if (!mobileState(mobileNumber).valid) {
      document.getElementById('numberInput')?.focus();
      return;
    }
    if (isDual && !secondMobileState(second, mobileNumber).valid) {
      document.getElementById('secondNumberInput')?.focus();
      return;
    }

    const details: Record<string, string | null> = {
      category: 'basic',
      simType: this.simType,
      mobileNumber
    };
    if (isDual) {
      details['secondMobileNumber'] = second;
    }

    await this.userDetails.save(details);
    console.log(this.userDetails.phone); // eslint-disable-line no-console
    this.transitionToRoute('basic-home');
  }
  
};

declare module '@ember/controller' {
  interface Registry {
    'basic-phone': BasicPhoneController;
  }
}