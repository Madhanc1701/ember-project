import { module, test } from 'qunit';
import { visit, click, fillIn, blur, currentURL, find, findAll, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | basic phone', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    window.sessionStorage.clear();
  });

  hooks.afterEach(function() {
    window.sessionStorage.clear();
  });

  test('screens are guarded until a phone is set up', async function(assert) {
    await visit('/basic/dial');
    assert.equal(currentURL(), '/basic');
    await visit('/basic/home');
    assert.equal(currentURL(), '/basic');
  });

  test('setup validates the mobile number', async function(assert) {
    await visit('/basic');
    await fillIn('#numberInput', '12ab34');
    assert.equal(find('#numberInput').value, '12ab34', 'any character can be typed');

    await click('#continueBtn');
    assert.equal(currentURL(), '/basic', 'short number is rejected');
    assert.ok(find('#numberInput').className.includes('input-error'), 'field is marked red');

    await click('#dualBtn');
    await fillIn('#numberInput', '9876543210');
    await click('#continueBtn');
    assert.equal(currentURL(), '/basic', 'dual sim needs the second number too');
    assert.ok(find('#secondNumberInput').className.includes('input-error'));
  });

  test('messages appear only after the field is left, then validate live', async function(assert) {
    await visit('/basic');
    await fillIn('#numberInput', '123');
    assert.notOk(find('#numberInputMsg'), 'nothing shown while typing for the first time');

    await blur('#numberInput');
    assert.ok(find('#numberInputMsg').textContent.includes('7 more digits'));

    await fillIn('#numberInput', '98765abc4321');
    assert.ok(find('#numberInputMsg').textContent.includes('digits only'));
    assert.ok(find('#numberInputMsg').textContent.includes('extra'));

    await fillIn('#numberInput', '9876543210');
    assert.ok(find('#numberInputMsg').textContent.includes('Valid mobile number'), 'live after first blur');
  });

  test('dual sim: both numbers must be different', async function(assert) {
    await visit('/basic');
    await click('#dualBtn');
    await fillIn('#numberInput', '9876543210');
    await fillIn('#secondNumberInput', '9876543210');
    await blur('#secondNumberInput');
    assert.ok(find('#secondNumberInputMsg').textContent.includes('different from SIM 1'));

    await click('#continueBtn');
    assert.equal(currentURL(), '/basic', 'same numbers are rejected');

    await fillIn('#secondNumberInput', '9876543211');
    await click('#continueBtn');
    assert.equal(currentURL(), '/basic/home');
  });

  test('single sim: home, dial and message', async function(assert) {
    await visit('/basic');
    await fillIn('#numberInput', '9876543210');
    await click('#continueBtn');

    assert.equal(currentURL(), '/basic/home');
    assert.equal(find('#numberDisplay').textContent.trim(), '9876543210');
    assert.ok(find('#simIcon').getAttribute('src').endsWith('single.png'));

    // dial
    await click('#dial');
    assert.equal(currentURL(), '/basic/dial');
    await click('#callBtn');
    assert.ok(find('#callingScreen').className.includes('hidden'), 'cannot call with an empty number');

    await fillIn('#numberInput', '1234567890');
    await click('#callBtn');
    assert.equal(find('#callerNumber').textContent.trim(), '1234567890');
    assert.equal(find('#callSim').textContent.trim(), 'via SIM 1');
    assert.equal(find('#callStatus').textContent.trim(), 'Calling...');
    assert.ok(find('#dialScreen').className.includes('hidden'), 'dial screen hidden while calling');
    assert.notOk(find('#callingScreen').className.includes('hidden'));

    await click('#endBtn');
    assert.equal(find('#numberInput').value, '', 'number is cleared after the call');
    assert.ok(find('#callingScreen').className.includes('hidden'));

    await click('#back');
    assert.equal(currentURL(), '/basic/home');

    // message
    await click('#message');
    assert.equal(currentURL(), '/basic/message');
    assert.ok(find('#messageInput').disabled);
    assert.ok(find('#sendBtn').disabled);

    await fillIn('#toNumberInput', '5555555555');
    assert.notOk(find('#messageInput').disabled);
    assert.ok(find('#sendBtn').disabled, 'empty text cannot be sent');

    await fillIn('#messageInput', '<b>hello</b>');
    assert.notOk(find('#sendBtn').disabled);
    await click('#sendBtn');

    let items = findAll('#messageList > div');
    assert.equal(items.length, 1);
    assert.ok(items[0].textContent.includes('To 5555555555:'));
    assert.ok(items[0].textContent.includes('<b>hello</b>'), 'html is shown as text, not rendered');
    assert.equal(items[0].querySelector('b'), null);
    assert.equal(find('#messageInput').value, '');

    await click('#back');
    assert.equal(currentURL(), '/basic/home');
  });

  test('dual sim: shows both numbers and asks which SIM to call with', async function(assert) {
    await visit('/basic');
    await click('#dualBtn');
    await fillIn('#numberInput', '1111111111');
    await fillIn('#secondNumberInput', '2222222222');
    await click('#continueBtn');

    assert.equal(currentURL(), '/basic/home');
    assert.equal(find('#numberDisplay').textContent.trim(), '1111111111 / 2222222222');
    assert.ok(find('#simIcon').getAttribute('src').endsWith('dual.png'));

    await click('#dial');
    await fillIn('#numberInput', '9999999999');
    await click('#callBtn');
    assert.notOk(find('#simModal').className.includes('hidden'), 'sim picker is shown');
    assert.equal(find('#simOneNumber').textContent.trim(), '1111111111');
    assert.equal(find('#simTwoNumber').textContent.trim(), '2222222222');

    await click('#simCancel');
    assert.ok(find('#simModal').className.includes('hidden'));

    await click('#callBtn');
    await click('#simOption2');
    assert.equal(find('#callSim').textContent.trim(), 'via SIM 2');
    assert.ok(find('#simModal').className.includes('hidden'));
    await click('#endBtn');
    await settled();
  });
});
