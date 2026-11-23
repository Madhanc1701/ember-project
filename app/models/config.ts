import Model, { attr } from '@ember-data/model';

// One record per OS theme (android / ios / windows).
// Served by Mirage (see mirage/scenarios/default.js).
export default Model.extend({
  os: attr('string'),
  dial: attr('string'),
  calling: attr('string'),
  message: attr('string'),
  mail: attr('string'),
  social: attr('string'),
  iconName: attr('string'),
  width: attr('string'),
  height: attr('string')
});
