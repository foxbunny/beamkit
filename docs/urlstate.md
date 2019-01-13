# Client-side routing

We use the term 'routing' *very* loosely here as routing as a concept is not 
exactly necessary on the client side. When we say 'routing' in this document,
we mean the act of reacting to location changes.

## Location as state storage

BeamKit apps treat location as state storage. You could think of URLs as being
something similar to JSON: just a format for encoding data. In our application
code, we generally don't use URLs directly, but instead use location objects.

Location object is a plain JavaScript object with three properties:

- `path` - stores path segments
- `query` - stores query string as a key-value mapping
- `hash` - stores fragment identifier (hash) as a key-value mapping

We manipulate the state by manipulating this object.

Converting between JavaScript and URL follows some rules:

- The path is an array or segments.
- Query and hash both work the same way and are objects of name-value pairs.
- Numbers, Booleans, and `null` are converted to respective JavaScript values.
- Any dashed path segments or parameter names are camel-cased (e.g., 
  `sort-order` becomes `sortOrder`) and vice versa.
- Query and hash parameters are always ordered alphabetically.
- Parameters with `undefined` value are completely omitted from query or hash.
  
For example:
 
```javascript
// URL: /book-collection/12?count=10&sort-order=year#menu=true

// Window.Location
window.location.pathname == '/book-collection/12';
window.location.search == '?count=10&sort-order=year';
window.location.hash = '#menu=true';

// Location object
loc == {
  path: ['bookCollection', 12],
  query: { count: 10, sortOrder: 'year' },
  hash: { menu: true },
};
```

## Reacting to naviation events

Navigation events are broadcast on the [hub](./hub.md) as `location-change` 
custom events. The listener will receive the location object matching the 
current location. 

```javascript
const { hub } = require('beamkit');

hub.addEventListener('location-change', loc => {
  // loc is the location object
});
```

Suppose now user navigates to `/books/11?sort-order=year`. The `loc` object 
received by the event handler will look like this:

```javascript
const loc = {
  path: ['books', 11],
  query: { sortOrder: 'year' },
  hash: {},
};
```

What we do with the location object is completely up to us. For example, we 
may have rules that say that the first segment in `path` is a view module we 
want to load, or that we store information about the menu state in the `hash`, 
and so on.

## Updating the location

There are three ways to change the location depending on the level of control
we need:

- `urlstate.changeState(partialLocation)` - specify a partial location object
  to override parts of the current location.
- `urlstate.updateState(callback)` - specify a callback that manipulates 
  the current location object.
- `urlstate.swapState(locationObject)` - specify a completely new location 
  object to replace the current one.
  
Each function will call the lower-level function (top to bottom), and 
eventually the `window.history.pushState()` will be called with the URL 
generated from the resulting location object. At the same time, the 
`location-change` custom event is triggered with the same location object as 
the argument.
  
### Using a partial location

The `changeState()` function takes a partial location object and this object is 
merged into the current location object.

```javascript
urlstate.changeSate({ query: { sortOrder: 'price'} });
```

Merging follows the following rules:

- Path is always replaced if specified, otherwise current path is kept.
- If query/hash is specified:
  - New parameters are added.   
  - Existing parameters are updated.
  - Parameters with `undefined` value are removed from the current location.
  
### Using a callback function
  
The `updateState()` function expects an updater function as its argument. 
This function will be given a current location object, and will be expected 
to manipulate it to set the new location:

```javascript
urlstate.updateState(loc => {
  loc.path = ['books', 12];
});
```

The updater does not need to return anything as it is expected to mutate the 
location object in-place.

### Using a new location

The `swapState()` function takes a complete location object and replaces the 
current location with it.

```javascript
urlstate.swapState({
  path: ['books', 12],
  query: { sortOrder: 'price' },
  hash: { menu: false },
});
```

Although we said we need to use 'complete' location objects, this is not 
entirely true. We can omit any properties that we wish to leave blank. For 
example, if we want a blank query string, we can omit it from the location 
object completely:

```javascript
urlstate.swapState({
  path: ['books', 12],
  hash: { menu: false },
});
```

Same applies to `path` and `hash` properties. If we want to end up on `/`, we
can simply pass an empty object. We cannot omit the argument completely, 
though.

## Getting the current location object

Sometimes we may want to inspect the current location object outside of the 
`location-change` event listener. A common case for this is when the 
application is starting, and no events are triggered yet.

To get the current location object, we can use the `getState()` function:

```javascript
const currentLocation = urlstate.getState();
```

## Using location objects to set `href` or `src`

Before we go on to discuss how to do this, we should also mention that there 
is generally no need to use `href` attributes on anchors. Instead, we can 
simply use the `onclick` event handler and use `changeState()`, 
`updateState()` or `swapState()` in the event listener. However, doing this 
breaks the middle-click functionality in browsers. Using `href` is the only 
option if this feature is important.

We can set the `href` property on anchor elements or `src` on iframes and 
images, by using the `toUrl()` function. This function takes a location 
object and returns a corresponding URL.

```javascript
<a href={urlstate.toUrl(myLocationObject)}>Click here</a>;
```

We may sometimes want to set the `href` or `src` to a modified version of the
current location. To do this, we can use the `updateUrl()` function.

Supposing we are on `/books/12` right now, we can create an anchor for 
`/books/11` like this: 

```javascript
<a href={urlstate.updateUrl({ path: ['books', 11] })}>Previous</a>;
```
