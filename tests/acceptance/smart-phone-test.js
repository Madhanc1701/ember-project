import { module, test } from 'qunit';
import { visit, click, fillIn, currentURL, find, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import defaultScenario from 'mobile-ember/mirage/scenarios/default';

module('Acceptance | smart phone', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(function() {
    window.sessionStorage.clear();
    defaultScenario(this.server);
  });

  hooks.afterEach(function() {
    window.sessionStorage.clear();
  });

  async function setup(os, social = 'my_id') {
    await visit('/smart');
    await click(`#${os}Btn`);
    await fillIn('#numberInput', '9876543210');
    await fillIn('#gmailInput', 'me@gmail.com');
    await fillIn(`#${{ android: 'insta', ios: 'twitter', windows: 'skype' }[os]}Input`, social);
    await click('#continueBtn');
  }

  test('screens are guarded until a phone is set up', async function(assert) {
    for (let url of ['/smart/home', '/smart/dial', '/smart/mail', '/smart/message', '/smart/social']) {
      await visit(url);
      assert.equal(currentURL(), '/smart', `${url} redirects to setup`);
    }
  });

  test('a basic phone cannot open smart screens', async function(assert) {
    await visit('/basic');
    await fillIn('#numberInput', '9876543210');
    await click('#continueBtn');
    await visit('/smart/home');
    assert.equal(currentURL(), '/smart');
  });

  test('setup validation', async function(assert) {
    await visit('/smart');
    await click('#continueBtn');
    assert.equal(currentURL(), '/smart');
    assert.ok(find('#numberInput').className.includes('input-error'));

    await fillIn('#numberInput', '9876543210');
    await fillIn('#gmailInput', 'me@yahoo.com');
    await click('#continueBtn');
    assert.equal(currentURL(), '/smart');
    assert.ok(find('#gmailInput').className.includes('input-error'), 'only gmail addresses are accepted');
  });

  test('android: home, theme and size', async function(assert) {
    await setup('android');
    assert.equal(currentURL(), '/smart/home');
    assert.equal(find('#numberDisplay').textContent.trim(), '9876543210');
    assert.ok(find('#osIcon').getAttribute('src').endsWith('android.png'));
    assert.equal(find('#osIcon').getAttribute('title'), 'android');
    assert.ok(find('#phoneIcon').getAttribute('src').endsWith('android_phone.png'));
    assert.equal(find('#mailIcon').getAttribute('src'), '/images/android_email.png');
    assert.equal(find('#socialmediaIcon').getAttribute('src'), '/images/instagram.png');
    assert.ok(find('[id="osIcon"]').closest('div[style]').getAttribute('style').includes('width:320px'));
  });

  test('windows has its own phone size', async function(assert) {
    await setup('windows');
    assert.ok(find('#osIcon').closest('div[style]').getAttribute('style').includes('width:985px'));
  });

  test('social page shows the right app and id per OS', async function(assert) {
    await setup('ios', 'tweety');
    await click('#socialmedia');
    assert.equal(currentURL(), '/smart/social');
    assert.equal(find('#iconName').textContent.trim(), 'Twitter');
    assert.equal(find('#socialId').textContent.trim(), 'tweety');
    assert.equal(find('#fabIcon').getAttribute('src'), '/images/twitter.png');
    await click('#back');
    assert.equal(currentURL(), '/smart/home');
  });

  test('the phone survives a refresh', async function(assert) {
    await setup('ios', 'tweety');
    // visiting a url again boots the service again, reading sessionStorage
    await visit('/smart/social');
    assert.equal(currentURL(), '/smart/social');
    assert.equal(find('#socialId').textContent.trim(), 'tweety');
  });

  test('dial: only dial characters, empty number does nothing, back works', async function(assert) {
    await setup('android');
    await click('#phone');
    assert.equal(currentURL(), '/smart/dial');
    await fillIn('#numberInput', '+91 98a76#*');
    assert.equal(find('#numberInput').value, '+91 9876#*');
    // (the call button itself opens a tel: link, so it is not clicked in tests)
    await click('#back');
    assert.equal(currentURL(), '/smart/home');
  });

  test('mail: compose, validate and escape', async function(assert) {
    await setup('android');
    await click('#mail');
    assert.equal(currentURL(), '/smart/mail');

    assert.ok(find('#composeOverlay').className.includes('hidden'));
    await click('#composeBtn');
    assert.notOk(find('#composeOverlay').className.includes('hidden'));
    assert.equal(find('#fromInput').value, 'me@gmail.com');
    assert.ok(find('#sendBtn').disabled);

    await fillIn('#toInput', 'not-an-email');
    assert.ok(find('#sendBtn').disabled);
    await fillIn('#toInput', 'friend@example.com');
    assert.notOk(find('#sendBtn').disabled);

    await fillIn('#subjectInput', '<i>Hi</i>');
    await fillIn('#bodyInput', 'Body text');
    await click('#sendBtn');

    assert.ok(find('#composeOverlay').className.includes('hidden'));
    let mails = findAll('#inboxList > div');
    assert.equal(mails.length, 1);
    assert.ok(mails[0].textContent.includes('To: friend@example.com'));
    assert.ok(mails[0].textContent.includes('<i>Hi</i>'), 'subject is escaped');
    assert.equal(mails[0].querySelector('i'), null);
    assert.ok(mails[0].textContent.includes('Body text'));

    // second mail with no subject goes on top
    await click('#composeBtn');
    assert.equal(find('#toInput').value, '', 'compose form is reset');
    await fillIn('#toInput', 'zed@example.com');
    await click('#sendBtn');
    mails = findAll('#inboxList > div');
    assert.equal(mails.length, 2);
    assert.ok(mails[0].textContent.includes('zed@example.com'), 'newest first');
    assert.ok(mails[0].textContent.includes('(no subject)'));

    await click('#composeBtn');
    await click('#closeCompose');
    assert.ok(find('#composeOverlay').className.includes('hidden'));
    await click('#back');
    assert.equal(currentURL(), '/smart/home');
  });

  test('messages: start chat, validate and list', async function(assert) {
    await setup('android');
    await click('#message');
    assert.equal(currentURL(), '/smart/message');

    await click('#startChatBtn');
    assert.notOk(find('#newChatOverlay').className.includes('hidden'));
    assert.equal(find('#newChatBody').textContent.trim(), 'Enter a 10-digit mobile number to start chatting');
    assert.ok(find('#messageInput').disabled);

    await fillIn('#toNumberInput', '55555');
    assert.ok(find('#messageInput').disabled);
    await fillIn('#toNumberInput', '5555500000');
    assert.equal(find('#newChatBody').textContent.trim(), 'Say hi to 5555500000');
    assert.notOk(find('#messageInput').disabled);
    assert.ok(find('#sendBtn').disabled);

    await fillIn('#messageInput', '<u>yo</u>');
    await click('#sendBtn');

    assert.ok(find('#newChatOverlay').className.includes('hidden'));
    let chats = findAll('#conversationList > div');
    assert.equal(chats.length, 1);
    assert.ok(chats[0].textContent.includes('5555500000'));
    assert.ok(chats[0].textContent.includes('55'));
    assert.ok(chats[0].textContent.includes('<u>yo</u>'));
    assert.equal(chats[0].querySelector('u'), null);

    await click('#startChatBtn');
    await click('#closeNewChat');
    assert.ok(find('#newChatOverlay').className.includes('hidden'));
  });
});
