import Model, { attr } from '@ember-data/model';

// The phone the user set up on the setup page. It is POSTed to Mirage (/phones).
export default Model.extend({
  category: attr('string'),                            // 'basic' | 'smart'
  simType: attr('string', { defaultValue: 'single' }), // basic only: 'single' | 'dual'
  os: attr('string'),                                  // smart only
  mobileNumber: attr('string'),
  secondMobileNumber: attr('string'),                  // basic dual only
  gmailAccount: attr('string'),                        // smart only
  socialAccount: attr('string')                        // smart only
});