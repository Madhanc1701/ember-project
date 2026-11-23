import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | config basic', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('config-basic', {});
    assert.ok(model);
  });
});
