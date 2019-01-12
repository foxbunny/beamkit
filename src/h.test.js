const h = require('./h');
const hub = require('./hub');
const sinon = require('sinon');

describe('h', () => {
  beforeAll(() => {
    sinon.spy(hub, 'dispatchEvent');
  });

  afterAll(() => {
    hub.dispatchEvent.restore();
  });

  test('create a node', () => {
    const el = <div />;

    expect(el instanceof HTMLDivElement).toBe(true);
  });

  test('simple attributes', () => {
    const el = <input type="checkbox" checked={true} value="test me" />;

    expect(el.type).toBe('checkbox');
    expect(el.checked).toBe(true);
    expect(el.value).toBe('test me');
  });

  test('ignore values that are null or undef', () => {
    const el = <div id={null} class={undefined} />;

    expect(el.id).toBe('');
    expect(el.className).toBe('');
  });

  test('class attribute', () => {
    const el = <div class="error" />;

    expect(el.className).toBe('error');
  });

  test('class attribute is trimmed', () => {
    const el = <div class=" note " />;

    expect(el.className).toBe('note');
  });

  test('for attribute', () => {
    const el = <label for="some-id" />;

    expect(el.htmlFor).toBe('some-id');
  });

  test('tabindex attribute', () => {
    const el = <button tabindex="2" />;

    expect(el.tabIndex).toBe(2);
  });

  test('style attribute', () => {
    const el = <span style={{ background: 'red', color: 'yellow' }} />;

    expect(el.style.background).toBe('red');
    expect(el.style.backgroundColor).toBe('red');
    expect(el.style.color).toBe('yellow');
  });

  test('data attribute', () => {
    const el = <div data={{ index: 1, field: 'name' }} />;

    expect(el.data.index).toBe(1);
    expect(el.dataset.index).toBe('1');
    expect(el.data.field).toBe('name');
    expect(el.dataset.field).toBe('name');
  });

  test('data- attribute', () => {
    const el = <div data-index={1} data-field="name" />;

    expect(el.data.index).toBe(1);
    expect(el.dataset.index).toBe('1');
    expect(el.data.field).toBe('name');
    expect(el.dataset.field).toBe('name');
  });

  test('data- attribute camelize', () => {
    const el = <div data-field-name="name" />;

    expect(el.data.fieldName).toBe('name');
    expect(el.dataset.fieldName).toBe('name');
  });

  test('add event handler', () => {
    const f = sinon.spy();
    const el = <button onclick={f} />;
    const e = new Event('click');
    el.dispatchEvent(e);

    expect(f.calledWith(e)).toBe(true);
  });

  test('custom event', () => {
    hub.dispatchEvent.resetHistory();

    const el = <button onclick="custom" />;
    const e = new Event('click');
    el.dispatchEvent(e);

    expect(hub.dispatchEvent.calledWithMatch('custom', {}, el, e))
      .toBe(true);
  });

  test('custom event receives dataset', () => {
    hub.dispatchEvent.resetHistory();

    const el = <button onclick="custom" data-index={12} />;
    const e = new Event('click');
    el.dispatchEvent(e);

    expect(hub.dispatchEvent.calledWithMatch('custom', { index: 12 }, el, e))
      .toBe(true);
  });

  test('custom event receives value', () => {
    hub.dispatchEvent.resetHistory();

    const el = <input oninput="custom" value="Hello, input!" />;
    const e = new Event('input');
    el.dispatchEvent(e);

    expect(hub.dispatchEvent.calledWithMatch(
      'custom',
      { value: 'Hello, input!' },
      el,
      e
    )).toBe(true);
  });

  test('custom event prevents', () => {
    hub.dispatchEvent.resetHistory();

    const el = <button onclick="custom.prevent" />;
    const e = new Event('click');
    sinon.spy(e, 'preventDefault');
    el.dispatchEvent(e);

    expect(e.preventDefault.called).toBe(true);
    expect(hub.dispatchEvent.calledWithMatch('custom', {}, el, e)).toBe(true);
  });

  test('custom event stops propagation', () => {
    hub.dispatchEvent.resetHistory();

    const el = <button onclick="custom.stop" />;
    const e = new Event('click');
    sinon.spy(e, 'stopPropagation');
    el.dispatchEvent(e);

    expect(e.stopPropagation.called).toBe(true);
    expect(hub.dispatchEvent.calledWithMatch('custom', {}, el, e)).toBe(true);
  });

  test('custom event once', () => {
    hub.dispatchEvent.resetHistory();

    const el = <button onclick="custom.once" />;

    expect(typeof el.onclick).toBe('function');

    el.dispatchEvent(new Event('click'));

    // Event listener is removed
    expect(el.onclick).toBe(null);

    // Repeat multiple times to make sure listener is only called once
    el.dispatchEvent(new Event('click'));
    el.dispatchEvent(new Event('click'));

    expect(hub.dispatchEvent.callCount).toBe(1);
  });

  test('one child element', () => {
    const el = <div><span /></div>;

    expect(el.firstChild instanceof HTMLSpanElement).toBe(true);
  });

  test('multiple child elements', () => {
    const el = <div><span /><span /></div>;

    expect(el.childNodes.length).toBe(2);
  });

  test('text child', () => {
    const el = <div>Hello, child!</div>;

    expect(el.firstChild instanceof Text).toBe(true);
    expect(el.firstChild.textContent).toBe('Hello, child!');
  });

  test('interpolated text child', () => {
    const el = <div>{'Hello, child!'}</div>;

    expect(el.firstChild instanceof Text).toBe(true);
    expect(el.firstChild.textContent).toBe('Hello, child!');
  });

  test('multiple interpolated text children', () => {
    const el = <div>{'Hello'} {'child!'}</div>;

    expect(el.childNodes.length).toBe(1);
    expect(el.textContent).toBe('Hello child!');
  });

  test('consecutive text children with space insertion', () => {
    const el = <div>{'Hello'}{'child!'}</div>;

    expect(el.textContent).toBe('Hello child!');
  });

  test('consecutive text children concatenation', () => {
    const el =
      <div>
        {'Hello'}
        {'child!'}
      </div>;

    expect(el.childNodes.length).toBe(1);
    expect(el.textContent).toBe('Hello child!');
  });

  test('non-string text children with concatenation', () => {
    const el = <div>{2} {true} {false}</div>;

    expect(el.textContent).toBe('2 true false');
  });

  test('null children ignore', () => {
    const el = <div>{null}{undefined}</div>;

    expect(el.childNodes.length).toBe(0);
  });

  test('nested array children', () => {
    const el = (
      <div>
        {[
          <span/>,
          <span/>,
          <span/>,
        ]}
      </div>
    );

    expect(el.childNodes.length).toBe(3);
    for (let child of el.childNodes) {
      expect(child).toBeInstanceOf(HTMLSpanElement);
    }
  });

  test('nested array children with text', () => {
    const el = (
      <div>
        {[
          'Hello,',
          'World!'
        ]}
      </div>
    );

    expect(el.textContent).toBe('Hello, World!');
  });

  test('text sandwiched between non-text', () => {
    const el = <div><span />Hello<span /></div>;

    expect(el.childNodes[0]).toBeInstanceOf(HTMLSpanElement);
    expect(el.childNodes[1]).toBeInstanceOf(Text);
    expect(el.childNodes[2]).toBeInstanceOf(HTMLSpanElement);
  });

  test('non-text sandwiched between text', () => {
    const el = <div>Hello<span />test</div>;

    expect(el.childNodes[0]).toBeInstanceOf(Text);
    expect(el.childNodes[1]).toBeInstanceOf(HTMLSpanElement);
    expect(el.childNodes[2]).toBeInstanceOf(Text);
  });

  test('document fragment', () => {
    const d = <></>;

    expect(d).toBeInstanceOf(DocumentFragment);
  });

  test('document fragment children', () => {
    const d = <><span /></>;

    expect(d.firstChild).toBeInstanceOf(HTMLSpanElement);
  });

  test('fragment as child', () => {
    const el = <div><><span /></></div>;

    expect(el.firstChild).toBeInstanceOf(HTMLSpanElement);
    expect(el.childNodes.length).toBe(1);
  });

  test('function tag', () => {
    const Tag = sinon.spy();
    const el = <Tag some-attr={12} another={false}>1 2 3</Tag>;

    expect(Tag.calledWithMatch(
      {
        'some-attr': 12,
        another: false,
      },
      ['1 2 3']
    )).toBe(true);
  });
});

