const hub = require('./hub');
const sinon = require('sinon');

describe('hub', () => {
  beforeEach(() => {
    hub.clearEventListeners();
  });

  test('add listener', () => {
    const f = sinon.spy();
    hub.addEventListener('start testing', f);
    hub.dispatchEvent('start testing');

    expect(f.called).toBe(true);
  });

  test('remove function', () => {
    const f = sinon.spy();
    const rm = hub.addEventListener('start testing', f);
    rm();
    hub.dispatchEvent('start testing');

    expect(f.called).toBe(false);
  });

  test('pass arguments', () => {
    const f = sinon.spy();
    hub.addEventListener('start testing', f);
    hub.dispatchEvent('start testing', 1, 2, 3);

    expect(f.calledWithExactly(1, 2, 3)).toBe(true);
  });
});
