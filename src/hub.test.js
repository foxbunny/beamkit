import hub from './hub';
import test from 'ava';
import sinon from 'sinon';

test.beforeEach(t => {
  hub.clearEventListeners();
});

test('add listener', t => {
  const f = sinon.spy();
  hub.addEventListener('start testing', f);
  hub.dispatchEvent('start testing');
  t.true(f.calledWithExactly());
});

test('remove function', t => {
  const f = sinon.spy();
  const rm = hub.addEventListener('start testing', f);
  rm();
  hub.dispatchEvent('start testing');
  t.false(f.calledWithExactly());
});

test('pass arguments', t => {
  const f = sinon.spy();
  hub.addEventListener('start testing', f);
  hub.dispatchEvent('start testing', 1, 2, 3);
  t.true(f.calledWithExactly(1, 2, 3));
});
