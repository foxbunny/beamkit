import h from './h';
import hub from './hub';
import test from 'ava';
import sinon from 'sinon';

test.before(() => {
  sinon.spy(hub, 'dispatchEvent');
});

test.after.always(() => {
  hub.dispatchEvent.restore();
});

test('create a node', t => {
  const el = <div />;
  t.true(el instanceof HTMLDivElement);
});

test('simple attributes', t => {
  const el = <input type="checkbox" checked={true} value="test me" />;
  t.is(el.type, 'checkbox');
  t.is(el.checked, true);
  t.is(el.value, 'test me');
});

test('ignore values that are null or undef', t => {
  const el = <div id={null} class={undefined} />;
  t.is(el.id, '');
  t.is(el.className, '');
});

test('class attribute', t => {
  const el = <div class="error" />
  t.is(el.className, 'error');
});

test('class attribute is trimmed', t => {
  const el = <div class=" note " />
  t.is(el.className, 'note');
});

test('for attribute', t => {
  const el = <label for="some-id" />;
  t.is(el.htmlFor, 'some-id');
});

test('tabindex attribute', t => {
  const el = <button tabindex="2" />;
  t.is(el.tabIndex, 2);
});

test('style attribute', t => {
  const el = <span style={{ background: 'red', color: 'yellow' }} />;
  t.is(el.style.background, 'red');
  t.is(el.style.backgroundColor, 'red');
  t.is(el.style.color, 'yellow');
});

test('data attribute', t => {
  const el = <div data={{ index: 1, field: 'name' }} />;
  t.is(el.data.index, 1);
  t.is(el.dataset.index, '1');
  t.is(el.data.field, 'name');
  t.is(el.dataset.field, 'name');
});

test('data- attribute', t => {
  const el = <div data-index={1} data-field="name" />;
  t.is(el.data.index, 1);
  t.is(el.dataset.index, '1');
  t.is(el.data.field, 'name');
  t.is(el.dataset.field, 'name');
});

test('data- attribute camelize', t => {
  const el = <div data-field-name="name" />;
  t.is(el.data.fieldName, 'name');
  t.is(el.dataset.fieldName, 'name');
});

test('add event handler', t => {
  const f = sinon.spy();
  const el = <button onclick={f} />;
  const e = new Event('click');
  el.dispatchEvent(e);
  t.true(f.calledWith(e));
});

test('custom event', t => {
  hub.dispatchEvent.resetHistory();

  const el = <button onclick="custom" />;
  const e = new Event('click');
  el.dispatchEvent(e);
  t.true(hub.dispatchEvent.calledWithMatch('custom', {}, el, e));
});

test('custom event receives dataset', t => {
  hub.dispatchEvent.resetHistory();

  const el = <button onclick="custom" data-index={12} />;
  const e = new Event('click');
  el.dispatchEvent(e);
  t.true(hub.dispatchEvent.calledWithMatch('custom', { index: 12 }, el, e));
});

test('custom event receives value', t => {
  hub.dispatchEvent.resetHistory();

  const el = <input oninput="custom" value="Hello, input!" />;
  const e = new Event('input');
  el.dispatchEvent(e);
  t.true(hub.dispatchEvent.calledWithMatch(
    'custom',
    { value: 'Hello, input!' },
    el,
    e
  ));
});

test('custom event prevents', t => {
  hub.dispatchEvent.resetHistory();

  const el = <button onclick="custom.prevent" />;
  const e = new Event('click');
  sinon.spy(e, 'preventDefault');
  el.dispatchEvent(e);
  t.true(e.preventDefault.called);
  t.true(hub.dispatchEvent.calledWithMatch('custom', {}, el, e));
});

test('custom event stops propagation', t => {
  hub.dispatchEvent.resetHistory();

  const el = <button onclick="custom.stop" />;
  const e = new Event('click');
  sinon.spy(e, 'stopPropagation');
  el.dispatchEvent(e);
  t.true(e.stopPropagation.called);
  t.true(hub.dispatchEvent.calledWithMatch('custom', {}, el, e));
});

test('custom event once', t => {
  hub.dispatchEvent.resetHistory();

  const el = <button onclick="custom.once" />;
  t.is(typeof el.onclick, 'function')

  el.dispatchEvent(new Event('click'));
  // Event listener is removed
  t.is(el.onclick, null);

  // Repeat multiple times to make sure listener is only called once
  el.dispatchEvent(new Event('click'));
  el.dispatchEvent(new Event('click'));
  t.is(hub.dispatchEvent.callCount, 1);
});

test('one child element', t => {
  const el = <div><span /></div>;
  t.true(el.firstChild instanceof HTMLSpanElement);
});

test('multiple child elements', t => {
  const el = <div><span /><span /></div>;
  t.is(el.childNodes.length, 2);
});

test('text child', t => {
  const el = <div>Hello, child!</div>;
  t.true(el.firstChild instanceof Text);
  t.is(el.firstChild.textContent, 'Hello, child!');
});

test('interpolated text child', t => {
  const el = <div>{'Hello, child!'}</div>;
  t.true(el.firstChild instanceof Text);
  t.is(el.firstChild.textContent, 'Hello, child!');
});

test('multiple interpolated text children', t => {
  const el = <div>{'Hello'} {'child!'}</div>;
  t.is(el.childNodes.length, 1);
  t.is(el.textContent, 'Hello child!');
});

test('consecutive text children with space insertion', t => {
  const el = <div>{'Hello'}{'child!'}</div>;
  t.is(el.textContent, 'Hello child!');
});

test('consecutive text children concatenation', t => {
  const el =
    <div>
      {'Hello'}
      {'child!'}
    </div>;
  t.is(el.childNodes.length, 1);
  t.is(el.textContent, 'Hello child!');
});

test('non-string text children with concatenation', t => {
  const el = <div>{2} {true} {false}</div>;
  t.is(el.textContent, '2 true false');
});

test('null children ignore', t => {
  const el = <div>{null}{undefined}</div>;
  t.is(el.childNodes.length, 0);
});

test('nested array children', t => {
  const el = (
    <div>
      {[
        <span/>,
        <span/>,
        <span/>,
      ]}
    </div>
  );

  t.is(el.childNodes.length, 3);
  for (let child of el.childNodes) {
    t.true(child instanceof HTMLSpanElement);
  }
});

test('nested array children with text', t => {
  const el = (
    <div>
      {[
        'Hello,',
        'World!'
      ]}
    </div>
  );

  t.is(el.textContent, 'Hello, World!');
});

test('text sandwiched between non-text', t => {
  const el = <div><span />Hello<span /></div>;
  t.true(el.childNodes[0] instanceof HTMLSpanElement);
  t.true(el.childNodes[1] instanceof Text);
  t.true(el.childNodes[2] instanceof HTMLSpanElement);
});

test('non-text sandwiched between text', t => {
  const el = <div>Hello<span />test</div>;
  t.true(el.childNodes[0] instanceof Text);
  t.true(el.childNodes[1] instanceof HTMLSpanElement);
  t.true(el.childNodes[2] instanceof Text);
});

test('document framgent', t => {
  const d = <></>;
  t.true(d instanceof DocumentFragment);
});

test('document fragment children', t => {
  const d = <><span /></>;
  t.true(d.firstChild instanceof HTMLSpanElement);
});

test('fragment as child', t => {
  const el = <div><><span /></></div>;
  t.true(el.firstChild instanceof HTMLSpanElement);
  t.is(el.childNodes.length, 1);
});

test('function tag', t => {
  const Tag = sinon.spy();
  const el = <Tag some-attr={12} another={false}>1 2 3</Tag>;
  t.true(Tag.calledWithMatch(
    {
      'some-attr': 12,
      another: false,
    },
    ['1 2 3']
  ));
});
