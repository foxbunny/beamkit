# Creating DOM nodes using JSX

Creating DOM nodes is fastest using the low-level DOM API. At the same time this
API is quite verbose and obscures our intent as we go about creating the nodes.
This is where `h` module steps in. 

This module exports a single function, `h()` which is in charge of creating
DOM nodes.

It can be used as is, but it primarily designed for use with Babel's JSX plugin.
It follows the React convention, including support for document fragments.

Before we begin, we should note that the use of JSX in this Beamkit has nothing
to do with declarative views. In fact, Beamkit views are normally dealt with the
old-fashioned *imperative* style of programming. We simply use the JSX syntax
for creating DOM nodes. It's pretty much just some syntax sugar for the DOM API. 
(You will also notice that we use the term 'attribute' instead of 'prop' to 
refer to JSX attributes.)

Behavior of the `h()` function is designed with the principle of least surprise
in mind. It should work like HTML as much as possible (which turns out to be
easier said than done!). One notable exception is the absence of HTML entities,
which are not necessary, and the alternatives are discussed at the end.

## Creating elements using JSX

**NOTE:** To use JSX, Babel has to be configured first. See the section at the
end of this document.

Let's first take a look at some simple examples:

```javascript
const { h } = require('beamkit');

const hello = <p>Hello, World!</p>;

const note = <span class="note">Pay attention.</span>;
```

What `hello` and `note` are in the above example are plain `HTMLElement` 
objects.

All usual HTML attributes work, except that they are not assigned as attributes
but as DOM properties. There are a few exceptions which we will cover in more
detail later.

We can interpolate variables either in attributes or as the content of an 
element:

```javascript
const className = 'note';
const message = 'Hi there!';

const note = <span class={className}>{message}</span>;
```

When using interpolated variables as attribute values, we must not quote them.
Quoted values are treated as strings.

Unlike HTML (and very much like XHTML), closing tags cannot be omitted without
converting the opening tag to a self-closing version. For example:

```javascript
const emptyDiv = <div />
```

On the other hand, it's legal to use normal closing tags for HTML elements that 
would not normally use them:

```javascript
const input = <input value="foo"></input>
```

While there is no harm in using closing tags in the last example, we see no 
reason why anyone would find that useful. :-)

We can nest child nodes, too.

```javascript
const hello = (
  <p>
    <span class="greeting">Hello, </span>
    <span class="name">World</span>
  </p>
);
```

Children can be either HTML elements, or simple text, or arrays containing
elements and/or text.

```javascript
const messages = ['Take care.', 'See you!'];

const renderMessage = message => <span class="message">{message}</span>

const messageView = (
  <div class="messages">
    {messages.map(renderMessage)}
  </div>
);
```

Again, `hello` is a `HTMLElement` object, but it now has `childNodes`. Two
`<span>` elements, to be exact.

To suppress the rendering of elements we simply insert a `null` or `undefined`
in their place. This is useful when writing functions that conditionally render
elements:

```javascript
const renderError = errorMessage => {
  if (errorMessage) return <span class="error">{errorMessage}</span>;
};
```

In the last example, if the `errorMessage` is falsy, the entire function returns
`undefined`, so nothing will be rendered.

## Creating document fragments

As you could see from the above examples, we can only create single nodes using
the normal `<tag>` syntax. Sometimes we may want to create multiple elements, 
though. Here is an example of a function that creates such elements:

```javascript
const renderInput = (name, value, error) => (
  <>
    <input name={name} value={value} />
    {renderError(error)}
  </>
);
```

The blank tags `<></>` represent [document fragments](https://mzl.la/2GXS4hG).
They are literally plain old `DocumentFragment` objects and there is nothing 
special about them. 

If you are new to them, they are just placeholder objects that you can append
DOM nodes to, and then when you mount them into a document, they magically
disappear, leaving only the child nodes in their place. For all practical
purposes, you can treat the return value of `renderInput()` as two nodes (the
input and the error message).

## Adding styles

The styles are specified using the `style` attribute and the value of the
attribute is an object. Here's an example:

```javascript
const styledSpan = (
  <span style={{ background: 'red', color: 'yellow' }}>
    Important!
  </span>
);
```

Notice the double curlies. The outer curly braces are for usual interpolation.
The inner curly braces belongs to the object.

## Adding data attributes

It's very common to want to encode some non-HTML information in HTML elements.
For example, when we have multiple items in an array, and we want to create a
form for each item, we may want to add the array index in the form element 
itself so we can access that info when handing events.

Here's an example:

```javascript
const renderItemForm = (item, index) => (
  <li>
    Name: <input value={item.name} data-index={index} />
  </li>
);

const renderItemList = items => (
  <ul>
    {items.map(renderItemForm)}
  </ul>
);
```

In the above example, if we pass an array of items to `renderItemList()`, it
will call `renderItemForm()` for each item, and each `<input>` element will have
a `data-index` attribute that corresponds to the index of the item in the array.

The `index` key is present in both the `<input>` element's `dataset` property,
as well as a custom `data` property which stores the raw JavaScript values. The
`data` property is added because the `dataset` property can only hold string 
values. This means that:

- You can use any value in data attributes.
- Not all values will neatly convert to a string (e.g., an object will be
  converted to `[object Object]` in the `dataset` version can cannot be used
  as a selector).

```javascript
const userDiv = <div data-user={{ name: 'John' }} />;

console.log(userDiv.dataset.user);  // '[object Object]'
console.log(userDiv.data.user);     // {name: 'John'}
```

Another important thing to note is that the attribute names are camel-cased. For
instance, the attribute `data-first-name` will result in `firstName` key in both
the `dataset` and `data` objects.

As a shorthand, we can also use the `data` attribute to assign multiple data 
attributes:

```javascript
const userDiv = <div data={{ user: { name: 'John' }}} />;
```

## Adding event listeners

Event listeners are added using the `on*` attributes. For example, a click event
handler is added using an `onclick` attribute.

```javascript
const sayHi = () => alert('Hi!');

const btn = <button onclick={sayHi}>Greet</button>
```

Notice that we have used a literal reference to a function (`sayHi()`) instead 
of a string `"sayHi()"` as in plain HTML.

Using strings for event attributes has a completely different meaning in 
BeamKit. Instead of calling a function referenced by the contents of the string,
it will dispatch a custom event on the hub (see the [hub docs](./hub.md) for
info on how to work with the hub).

For example, let's rewrite the last example using this style:

```javascript
const { h, hub } = require('beamkit');

hub.addEventListener('say-hi', () => alert('Hi!'));

const btn = <button onclick="say-hi">Greet</button>
```

The `"say-hi"` string is an event name and on each click, the event is 
dispatched to the hub. The listener on the hub will receive three arguments.

1. The `data` property of the element with the addition of a `value` key which 
   contains the value of the element's `value` or `checked` property (where 
   appropriate).
2. The element itself.
3. The event object.

In addition to the event name, we can specify a few options. These options are
dot-separated and can be `prevent`, `stop` and `once`. The options do the 
following:

- `prevent` calls `event.preventDefault()`.
- `stop` calls `event.stopPropagation()`.
- `once` removes the event listener immediately (the listener is effectively
  only called once, hence the name).

For example:

```javascript
const form = <form onsubmit="save.prevent.once" />
```

The example form will dispatch a `save` event when submitted but will call
`event.preventDefault()` before the event is dispatched. The submit event
listener will only be fired once after which the subsequent submit events will
cause the normal (unprevented) form behavior.

Here's how we can use a combination of these features to simplify our code:

```javascript
const contact = {
  name: '',
  phone: '',
};

hub.addEventListener('save', () => {
  api.saveContact(contact);
});

hub.addEventListener('field-update', ({ fieldName, value }) => {
  contact[fieldName] = value;
});

const field = (label, fieldName) => (
  <p>
    {label}: <input data-field-name={fieldName} oninput="field-update" />
  </p>
);

const form = (
  <form onsubmit="save.prevent">
    {field('Name', 'name')}
    {field('Phone', 'phone')}
  </form>
);
```

Actually, we don't really need `prevent` on the form. For the form element, 
`prevent` is always used regardless of whether we specify it explicitly. The 
example code was more of a demonstration.

## Using functions instead of tags

TODO

## Using without JSX

TODO

## HTML entities

While there is no support for HTML entities, you generally do not need them.
Most characters for which you'd normally use HTML entities can be used as is,
because any string is wrapped in a text node. If you need special characters
that are difficult to enter using keyboards and other text input
devices/software, you can use escape sequences. For example, non-breaking space,
`&nbsp;` is written as `\x0A`.

## Configuring Babel

To configure Babel to use `h`, first install Babel (d'oh!) and
`@babel/plugin-transform-react-jsx` packages:

```
npm i -D @babel/core @babel/plugin-transform-react-jsx
```

Next create a `babel.config.js` file at the root of your project, and put this
in it:

```javascript
module.exports = {
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'h',
      pragmaFrag: 'h.Fragment',
    }],
  ],
};
```
