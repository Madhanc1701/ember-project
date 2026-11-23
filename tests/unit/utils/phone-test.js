import { module, test } from 'qunit';
import {
  Phone, BasicPhone, SingleSim, DualSim, SmartPhone, Android, IOS, Windows,
  buildPhoneFromConfig, osKeyFor, cleanMobile, cleanDialInput, formatTime, GMAIL_RE, EMAIL_RE
} from 'mobile-ember/utils/phone';

module('Unit | Utility | phone', function() {
  test('class hierarchy', function(assert) {
    assert.ok(new SingleSim('1') instanceof BasicPhone);
    assert.ok(new DualSim('1', '2') instanceof BasicPhone);
    assert.ok(new Android('1', 'a@gmail.com', 'x') instanceof SmartPhone);
    assert.ok(new IOS('1', 'a@gmail.com', 'x') instanceof Phone);
    assert.ok(new Windows('1', 'a@gmail.com', 'x') instanceof SmartPhone);
    assert.notOk(new SingleSim('1') instanceof SmartPhone);
  });

  test('buildPhoneFromConfig', function(assert) {
    assert.equal(buildPhoneFromConfig(null), null);
    assert.ok(buildPhoneFromConfig({ category: 'basic', simType: 'single', mobileNumber: '1' }) instanceof SingleSim);

    let dual = buildPhoneFromConfig({ category: 'basic', simType: 'dual', mobileNumber: '1', secondMobileNumber: '2' });
    assert.ok(dual instanceof DualSim);
    assert.equal(dual.secondMobileNumber, '2');

    let ios = buildPhoneFromConfig({ category: 'smart', os: 'ios', mobileNumber: '1', gmailAccount: 'a@gmail.com', socialAccount: 'tw' });
    assert.ok(ios instanceof IOS);
    assert.equal(ios.twitterAccount, 'tw');
    assert.equal(osKeyFor(ios), 'ios');

    assert.equal(buildPhoneFromConfig({ category: 'smart', os: 'symbian' }), null);
    assert.equal(osKeyFor(new Windows('1', 'a@gmail.com', 's')), 'windows');
    assert.equal(osKeyFor(null), 'android');
  });

  test('helpers', function(assert) {
    assert.equal(cleanMobile('98a76-54321 0999'), '9876543210');
    assert.equal(cleanDialInput('+91 (98)#*-x'), '+91 98#*-');
    assert.equal(formatTime(5), '00:05');
    assert.equal(formatTime(65), '01:05');
    assert.ok(GMAIL_RE.test('a.b@gmail.com'));
    assert.notOk(GMAIL_RE.test('a@yahoo.com'));
    assert.ok(EMAIL_RE.test('a@b.co'));
    assert.notOk(EMAIL_RE.test('nope'));
  });
});
