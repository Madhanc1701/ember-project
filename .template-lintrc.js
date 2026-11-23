'use strict';

module.exports = {
  extends: 'recommended',

  rules: {
    // dynamic ember-css-modules classes, e.g. local-class="sim-btn {{if this.isDual 'active'}}",
    // need single quotes inside the double-quoted attribute
    'quotes': false
  }
};
