const hub = require('./hub');
const localHub = require('./local-hub');
const sinon = require('sinon');

describe('localHub', () => {
  beforeAll(() => {
    sinon.spy(hub, 'addEventListener');
    sinon.spy(hub, 'dispatchEvent');
  });

  afterEach(() => {
    hub.clearEventListeners();
  });

  test('create a local hub', () => {
    const h = localHub();

    expect(typeof h.dispatchEvent).toBe('function');
    expect(typeof h.addEventListener).toBe('function');
    expect(typeof h.destroy).toBe('function');
    expect(hub.addEventListener.calledWithExactly('module-destroy', h.destroy))
      .toBe(true);
  });

  test('works like a normal hub', () => {
    const h = localHub();
    const f = sinon.spy();
    h.addEventListener('hello test', f);
    h.dispatchEvent('hello test', 'now');

    expect(f.calledWithExactly('now')).toBe(true);
  });

  test('dispatch on global hub', () => {
    const f = sinon.spy();
    hub.addEventListener('call me', f);

    const h = localHub();
    h.dispatchEvent('call me', 'now');

    expect(f.calledWithExactly('now')).toBe(true);
  });

  test('destroy hub', () => {
    const f = sinon.spy();
    const h = localHub();
    h.addEventListener('hello test', f);
    h.destroy();
    hub.dispatchEvent('hello test', 'now');

    expect(f.called).toBe(false);
  });

});
