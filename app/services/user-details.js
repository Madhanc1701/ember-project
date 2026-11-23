// import Service, { inject as service } from '@ember/service';
// import { computed } from '@ember/object';
// import { alias } from '@ember/object/computed';
// import { buildPhoneFromConfig } from '../utils/phone';

// const FIELDS = ['category', 'simType', 'os', 'mobileNumber', 'secondMobileNumber', 'gmailAccount', 'socialAccount'];

// // Holds the phone the user "bought" on the setup page.
// // save() POSTs it to Mirage through the `phone` Ember Data model;
// // `current` is the saved record.
// export default Service.extend({
//   store: service(),

//   current: null,

//   category: alias('current.category'),
//   simType: alias('current.simType'),
//   os: alias('current.os'),
//   mobileNumber: alias('current.mobileNumber'),
//   secondMobileNumber: alias('current.secondMobileNumber'),
//   gmailAccount: alias('current.gmailAccount'),
//   socialAccount: alias('current.socialAccount'),

//   // true once the setup page has saved something
//   hasDetails: computed('current.mobileNumber', function() {
//     return !!this.get('current.mobileNumber');
//   }),

//   isBasic: computed('category', 'hasDetails', function() {
//     return this.hasDetails && this.category === 'basic';
//   }),

//   isSmart: computed('category', 'hasDetails', function() {
//     return this.hasDetails && this.category === 'smart';
//   }),

//   isDual: computed('category', 'simType', function() {
//     return this.category === 'basic' && this.simType === 'dual';
//   }),

//   // number(s) shown on the home screen status bar
//   displayNumber: computed('isDual', 'mobileNumber', 'secondMobileNumber', function() {
//     return this.isDual ? `${this.mobileNumber} / ${this.secondMobileNumber}` : this.mobileNumber;
//   }),

//   // the OOP object (Android, DualSim, ...) built from the saved details
//   phone: computed('current.{category,simType,os,mobileNumber,secondMobileNumber,gmailAccount,socialAccount}', function() {
//     return this.current ? buildPhoneFromConfig(this.current.getProperties(FIELDS)) : null;
//   }),

//   // POST /phones - returns a promise, so callers can `await` it.
//   // A previously saved phone is only dropped from the store (no DELETE request needed).
//   async save(details) {
//     const previous = this.current;
//     const record = this.store.createRecord('phone', details);
//     await record.save();
//     this.set('current', record);
//     if (previous && !previous.isDestroyed) {
//       previous.unloadRecord();
//     }
//     return record;
//   },

//   // forget the saved phone (only removed from the store, no request is sent)
//   clear() {
//     const record = this.current;
//     this.set('current', null);
//     if (record && !record.isDestroyed) {
//       record.unloadRecord();
//     }
//   }
// });



// // app/services/user-details.js
// import Service, { inject as service } from '@ember/service';
// import { tracked } from '@glimmer/tracking';
// import { buildPhoneFromConfig } from '../utils/phone';

// const FIELDS = ['category', 'simType', 'os', 'mobileNumber', 'secondMobileNumber', 'gmailAccount', 'socialAccount'];

// // Holds the phone the user "bought" on the setup page.
// // save() POSTs it to Mirage through the `phone` Ember Data model;
// // `current` is the saved record.
// export default class UserDetailsService extends Service {
//   @service store;

//   @tracked current = null;
import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { buildPhoneFromConfig } from '../utils/phone';

const FIELDS = ['category', 'simType', 'os', 'mobileNumber', 'secondMobileNumber', 'gmailAccount', 'socialAccount'];
const STORAGE_KEY = 'mobile-ember:phone';

export default class UserDetailsService extends Service {
  @service store;

  @tracked current = null;

  // use constructor, NOT init(): class fields like `current = null`
  // are assigned after init() runs and would wipe the restored value
  constructor() {
    super(...arguments);
    this._restore();
  }

  get category() { return this.current ? this.current.category : undefined; }
  get simType() { return this.current ? this.current.simType : undefined; }
  get os() { return this.current ? this.current.os : undefined; }
  get mobileNumber() { return this.current ? this.current.mobileNumber : undefined; }
  get secondMobileNumber() { return this.current ? this.current.secondMobileNumber : undefined; }
  get gmailAccount() { return this.current ? this.current.gmailAccount : undefined; }
  get socialAccount() { return this.current ? this.current.socialAccount : undefined; }

  // true once the setup page has saved something
  get hasDetails() {
    return !!this.mobileNumber;
  }

  get isBasic() {
    return this.hasDetails && this.category === 'basic';
  }

  get isSmart() {
    return this.hasDetails && this.category === 'smart';
  }

  get isDual() {
    return this.category === 'basic' && this.simType === 'dual';
  }

  // number(s) shown on the home screen status bar
  get displayNumber() {
    return this.isDual ? `${this.mobileNumber} / ${this.secondMobileNumber}` : this.mobileNumber;
  }

  // the OOP object (Android, DualSim, ...) built from the saved details
  get phone() {
    return this.current ? buildPhoneFromConfig(this.current.getProperties(...FIELDS)) : null;
  }

  // POST /phones - returns a promise, so callers can `await` it.
  // A previously saved phone is only dropped from the store (no DELETE request needed).
  async save(details) {
    const previous = this.current;
    const record = this.store.createRecord('phone', details);
    await record.save();
    this.current = record;
    this._persist();                      // <-- new
    if (previous && !previous.isDestroyed) {
      previous.unloadRecord();
    }
    return record;
  }

  clear() {
    const record = this.current;
    this.current = null;
    this._forget();                       // <-- new
    if (record && !record.isDestroyed) {
      record.unloadRecord();
    }
  }

  _persist() {
    try {
      const data = this.current.getProperties(...FIELDS);
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // storage unavailable (private mode / quota): app still works, just no persistence
    }
  }

  _restore() {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        // local record only, no POST: Mirage's DB is empty after a refresh
        this.current = this.store.createRecord('phone', JSON.parse(raw));
      }
    } catch (e) {
      // corrupt or unavailable storage: start with no phone
    }
  }

  _forget() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}