import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { DualSim, Android } from 'mobile-ember/utils/phone';

module('Unit | Service | user-details', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    window.sessionStorage.clear();
  });

  hooks.afterEach(function() {
    window.sessionStorage.clear();
  });

  test('starts empty', function(assert) {
    let service = this.owner.lookup('service:user-details');
    assert.notOk(service.hasDetails);
    assert.equal(service.phone, null);
  });

  test('saves a dual sim basic phone', function(assert) {
    let service = this.owner.lookup('service:user-details');
    service.save({ category: 'basic', simType: 'dual', mobileNumber: '1111111111', secondMobileNumber: '2222222222' });

    assert.ok(service.isBasic);
    assert.notOk(service.isSmart);
    assert.ok(service.isDual);
    assert.equal(service.displayNumber, '1111111111 / 2222222222');
    assert.ok(service.phone instanceof DualSim);
  });

  test('saves a smart phone and clears it', function(assert) {
    let service = this.owner.lookup('service:user-details');
    service.save({ category: 'smart', os: 'android', mobileNumber: '1111111111', gmailAccount: 'a@gmail.com', socialAccount: 'insta' });

    assert.ok(service.isSmart);
    assert.ok(service.phone instanceof Android);
    assert.equal(service.phone.instaAccount, 'insta');

    service.clear();
    assert.notOk(service.hasDetails);
    assert.equal(service.phone, null);
  });

  test('details survive a "refresh" (restored from sessionStorage)', function(assert) {
    this.owner.lookup('service:user-details')
      .save({ category: 'smart', os: 'ios', mobileNumber: '1111111111', gmailAccount: 'a@gmail.com', socialAccount: 'tw' });

    // a fresh service instance simulates a page reload
    let fresh = this.owner.factoryFor('service:user-details').create();
    assert.equal(fresh.os, 'ios');
    assert.equal(fresh.mobileNumber, '1111111111');
    assert.ok(fresh.isSmart);
  });
});
