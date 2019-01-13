# Browser APIs

While accessing browser APIs directly works rather well in the browser, it may
not work so well when running code outside one. This is the case with 
server-side rendering, and more importantly testing. Most test frameworks will
not allow us to modify the `location` object, for instance, and we may need 
to set up `localStorage` for our test without disturbing the browser state 
(if any).

To help with these situation, BeamKit provides a lightweight browser 
abstraction in the `browser` module.

## Supported APIs

The browser module exposes the following aliases: 

- `browser.location` - `window.location`
- `browser.history` - `window.history`
- `browser.localStorage` - `window.localStorage`

These aliases are literally just the same objects we find on the `window` 
object.

## Mocking the APIs in tests

Even though the `browser` module seems useless, its purpose becomes apparent 
when we start testing.

Firstly, we write our functions using the `browser` module instead of the 
`window` object (only for supported APIs, of course!).

```javascript
const { browser } = require('bramkit');

const areWeHome = () => {
  return browser.location.pathname.startsWith('/home');
};
```

In our test module, we can override the browser APIs:

```javascript
const { browser } = require('bramkit');

describe('areWeHome', () => {
  const previous = browser.location;
  
  afterAll(() => {
    browser.location = previous;
  });
  
  test('now we can work with location', () => {
    browser.location = {
      pathname: '/some/path',
      search: '?query=string',
      hash: '',
    };
    
    expect(areWeHome()).toBe(false);
  });
});
```
