import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { debounce, later, cancel } from '@ember/runloop';
import { mobileState, gmailState, mobileHasHardError } from '../utils/phone';
import UserDetailsService from '../services/user-details';

const TYPING_DELAY = 1000; // ms of silence before a normal message is announced
const ERROR_DELAY = 1000;  // wait for clearly wrong input (lets the key echo finish)

interface FieldState {
  text: string;
  valid: boolean;
  invalid: boolean;
}

type AnnounceProp = 'mobileAnnounce' | 'gmailAnnounce';
type Timer = ReturnType<typeof debounce>;

// true when the gmail value can never become valid, however much more is typed
function gmailHasHardError(value: string): boolean {
  const v = String(value || '').trim();
  if (/\s/.test(v)) { return true; }

  const at = v.indexOf('@');
  if (at === -1) { return false; }                    // still typing the name part
  if (at === 0) { return true; }                      // starts with @
  if (v.indexOf('@', at + 1) !== -1) { return true; } // second @

  const domain = v.slice(at + 1).toLowerCase();
  return !'gmail.com'.startsWith(domain);             // e.g. "yahoo", or extra text after gmail.com
}

// message for the screen reader: no symbols and no "3/10" count
function spokenText(state: FieldState | null): string {
  if (!state) { return ''; }
  return String(state.text || '')
    .replace(/[\u26A0\u2713]/g, '')
    .replace(/^\s*\d+\/10\s*/, '')
    .trim();
}

// stable spoken text for the mobile field
function spokenMobile(value: string): string {
  const v = String(value || '');
  if (/\D/.test(v)) { return 'Digits only. Remove letters or symbols.'; }
  if (v.length > 10) { return 'Too many digits. Maximum 10.'; }
  return spokenText(mobileState(v));
}

export default class SmartController extends Controller {
  @service declare userDetails: UserDetailsService;

  queryParams = [{ osType: { as: 'os' } }];
  @tracked osType: string | null = null;

  @tracked mobileNumber = '';
  @tracked gmailAcc = '';
  @tracked socialAcc = '';
  // remembers the id typed for each OS while you switch tabs
  socialAccounts: Record<string, string> = {};

  // copies of the typed values, updated after a pause in typing, on blur, or on continue.
  // the messages are built from these, so they don't change on every keystroke
  @tracked mobileChecked = '';
  @tracked gmailChecked = '';
  @tracked mobileTouched = false;
  @tracked gmailTouched = false;

  // text for the hidden live regions (what the screen reader speaks)
  @tracked mobileAnnounce = '';
  @tracked gmailAnnounce = '';

  private mobileTimer?: Timer;
  private gmailTimer?: Timer;
  private lastMobileSpoken = '';
  private lastGmailSpoken = '';

  // one fixed function per field, so debounce can merge rapid calls into one
  private runMobileCheck = (): void => this.checkMobile();
  private runGmailCheck = (): void => this.checkGmail();

  get mobileState(): FieldState | null {
    return this.mobileTouched ? mobileState(this.mobileChecked) : null;
  }

  get gmailState(): FieldState | null {
    return this.gmailTouched ? gmailState(this.gmailChecked) : null;
  }

  get isAndroid(): boolean { return this.osType === 'android'; }
  get isIos(): boolean { return this.osType === 'ios'; }
  get isWindows(): boolean { return this.osType === 'windows'; }

  willDestroy(): void {
    super.willDestroy();
    cancel(this.mobileTimer);
    cancel(this.gmailTimer);
  }

  // clear first, then set a moment later, so the same text is spoken again if needed
  private speak(prop: AnnounceProp, text: string): void {
    this[prop] = '';
    later(() => {
      if (!this.isDestroyed && !this.isDestroying) {
        this[prop] = text;
      }
    }, 100);
  }

  private checkMobile(announce = true): void {
    this.mobileChecked = this.mobileNumber;
    this.mobileTouched = true;
    if (!announce) { return; }

    const text = spokenMobile(this.mobileNumber);
    if (text === this.lastMobileSpoken) { return; } // same message, don't repeat it
    this.lastMobileSpoken = text;
    this.speak('mobileAnnounce', text);
  }

  private checkGmail(announce = true): void {
    this.gmailChecked = this.gmailAcc;
    this.gmailTouched = true;
    if (!announce) { return; }

    const text = spokenText(gmailState(this.gmailAcc));
    if (text === this.lastGmailSpoken) { return; }
    this.lastGmailSpoken = text;
    this.speak('gmailAnnounce', text);
  }

  @action
  selectOs(type: string): void {
    this.socialAccounts = { ...this.socialAccounts, [String(this.osType)]: this.socialAcc };
    this.osType = type;
    this.socialAcc = this.socialAccounts[type] || '';
  }

  @action
  updateNumber(event: Event): void {
    this.mobileNumber = (event.target as HTMLInputElement).value;
    const delay = mobileHasHardError(this.mobileNumber) ? ERROR_DELAY : TYPING_DELAY;
    this.mobileTimer = debounce(this.runMobileCheck, delay);
  }

  @action
  touchNumber(): void {
    cancel(this.mobileTimer);
    this.lastMobileSpoken = '';
    this.checkMobile(false);
  }

  @action
  updateGmail(event: Event): void {
    this.gmailAcc = (event.target as HTMLInputElement).value;
    const delay = gmailHasHardError(this.gmailAcc) ? ERROR_DELAY : TYPING_DELAY;
    this.gmailTimer = debounce(this.runGmailCheck, delay);
  }

  @action
  touchGmail(): void {
    cancel(this.gmailTimer);
    this.lastGmailSpoken = '';
    this.checkGmail(false);
  }

  @action
  updateSocial(event: Event): void {
    this.socialAcc = (event.target as HTMLInputElement).value;
  }

  @action
  async continue(): Promise<void> {
    const mobileNumber = this.mobileNumber.trim();
    const gmailAccount = this.gmailAcc.trim();

    // show every message now (silently), then stop if anything is invalid
    cancel(this.mobileTimer);
    cancel(this.gmailTimer);
    this.checkMobile(false);
    this.checkGmail(false);

    // send the keyboard focus to the first invalid field; the screen reader
    // reads its label and message
    if (!mobileState(mobileNumber).valid) {
      document.getElementById('numberInput')?.focus();
      return;
    }
    if (!gmailState(gmailAccount).valid) {
      document.getElementById('gmailInput')?.focus();
      return;
    }

    await this.userDetails.save({
      category: 'smart',
      os: this.osType,
      mobileNumber,
      gmailAccount,
      socialAccount: this.socialAcc.trim()
    });
    console.log(this.userDetails.phone); // eslint-disable-line no-console

    this.transitionToRoute('smart-home');
  }
}

declare module '@ember/controller' {
  interface Registry {
    smart: SmartController;
  }
}