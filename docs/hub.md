# Custom events

Event hub is used to send and receive custom events between different parts of 
the application. Since the user interface is generally an event-driven system,
using the same approach for the interface-related logic seemed like a more 
natural fit.

The `hub` module exports a few functions which are conveniently named the same
way as the methods on DOM elements. The hub contains an object which maps event 
names to listeners an this object is private (it cannot be accessed from the 
outside). This object is initialized once the first the the `hub` module is 
ever used, and lives throughout the lifetime of your app (e.g., until the user
closes the page).

## Listening to events

To listen to events, we use the `addEventListener` function. Here is an example:

```javascript
const { hub } = require('beamkit');

hub.addEventListener('load-profile', profile => {
  const container = document.querySelector('.profile')
  container.textContent = '';
  container.appendChild(renderProfile(profile));
});
```

There are several differences compared to how `addEventListener()` normally 
works.

Instead of a generic `Event` object, we receive any arguments that are 
dispatched to the hub for the specified event (we'll see how that works in a 
bit). We are not restricted to one argument either. We can receive multiple
arguments or none at all, if that's what the some other part of the application
dispatched.

## Dispatching events

To dispatch a custom event, we use the `hub.dispatchEvent()` function.

```javascript
const user = { name: 'John Doe', email: 'john@example.com' };
hub.dispatchEvent('save-user', user);
```

The first argument is the name of the custom event, and any arguments after it 
are passed to the listener functions as positional arguments. In the last 
example, the `user` object will become the first argument to any listener
listening for the `save-user` event. There is no limit to how many arguments or
what kind of arguments we can dispatch.

## Removing listeners

Normally, to remove a listener, we use the corresponding `removeEventListener()`
function. With this hub, there is no such function. Instead,
`hub.addEventListener()` will return a function that removes the listener.

Here is an example of a listener that only reacts to an event once:

```javascript
const remove = hub.addEventListener('set-error', () => {
  document.querySelector('button[type="submit"]').disabled = true;
  document.querySelector('.error').classList.add('shown');
  remove();
});
```

A common patttern is to collect all remove functions in a module into a single
place and create a function that calls them all. This function is then used as 
a destructor for the module. Here's an example:

```javascript
const setUp = () => {
  const removeFns = [];

  removeFns.push(hub.addEventListeners('save', doSave));
  removeFns.push(hub.addEventListeners('close', doClose));
  removeFns.push(hub.addEventListeners('load-list', renderList));

  const remove = hub.addEventListeners('module-destroy', () => {
    removeFns.forEach(fn => fn());
    remove(); // don't leave this behind
  });
};
```

This pattern is so common that we have a `localHub()` helper function:

```javascript
const { localHub } = require('beamkit');

const setUp = () => {
  const hub = localHub();

  hub.addEventListeners('save', doSave);
  hub.addEventListeners('close', doClose);
  hub.addEventListeners('load-list', renderList);
}
```

The local hub collects the remove functions behind the scenes, and sets up a 
listener to the `module-destroy` event. We can pretent we are using the global
hub without having to worry about cleaning up after we're done.

## Resetting the hub

In some cases (e.g., in tests), we need to reset the global hub. This is done
using the `clearEventListeners()` function in the global hub. This removes all
event listeners from the hub. Do not use this function in your application.
