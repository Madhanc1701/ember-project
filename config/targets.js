'use strict';

const browsers = [
  'last 1 Chrome versions',
  'last 1 Firefox versions',
  'last 1 Safari versions'
];

// IE 11 support was removed on purpose: with ember-cli-babel 7.26 + ember-source 3.14 the
// production build for IE 11 crashes at boot ("defineAccessor is not a function").

module.exports = {
  browsers
};
