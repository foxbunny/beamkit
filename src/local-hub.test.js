import hub from './hub';
import localHub from './local-hub';
import test from 'ava';
import sinon from 'sinon';

test.before(() => {
  sinon.spy(hub, 'addEventListener');
  sinon.spy(hub, 'dispatchEvent');
});

test.afterEach(() => {
  hub.clearEventListeners();
});

test('create a local hub', t => {
  const h = localHub();
  t.is(typeof h.dispatchEvent, 'function');
  t.is(typeof h.addEventListener, 'function');
  t.is(typeof h.destroy, 'function');
  t.true(hub.addEventListener.calledWithExactly('module-destroy', h.destroy));
});

test('works like a normal hub', t => {
  const h = localHub();
  const f = sinon.spy();
  h.addEventListener('hello test', f);
  h.dispatchEvent('hello test', 'now');
  t.true(f.calledWithExactly('now'));
});

test('dispatch on global hub', t => {
  const f = sinon.spy();
  hub.addEventListener('call me', f);

  const h = localHub();
  h.dispatchEvent('call me', 'now');
  t.true(f.calledWithExactly('now'));
});

test('destroy hub', t => {
  const f = sinon.spy();
  const h = localHub();
  h.addEventListener('hello test', f);
  h.destroy();
  hub.dispatchEvent('hello test', 'now');
  t.false(f.called);
});
