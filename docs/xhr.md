# Making XHR requests

Most browsers have two built-in methods of performing XHR requests. One is 
the older [XMLHttpRequest](https://mzl.la/2ROidn0) API, and the other is 
the newer [Fetch API](https://mzl.la/2RH0ttU). BeamKit does not strive to 
replace either of the built-in APIs. Instead, it provides an API that covers 
a subset of the functionality for the most common use cases.

## Making basic requests

The `beamkit.xhr` module exposes functions that are named after the four of 
the most common HTTP methods: `xhr.GET`, `xhr.POST`, `xhr.PUT` and 
`xhr.DELETE`. The basic HTTP requests can be serviced using these methods.

To make a simple GET request, we use the `GET` method:

```javascript
const { xhr } = require('beamkit');

xhr.GET('/data', {
  ok(data) {
    // Do something with the data
  },
  err(error) {
    // Do something with the error
  },
});
``` 

The second argument we passed is the response handlers object. We gave this 
object `ok()` and `err()` methods to handle the successful and failed 
response respectively. A successful response is any response with the status 
codes 200 and 204. Any other status code is considered an error (3xx, 4xx and
5xx status codes).

If we want a more fine-grained control over how we handle different status 
codes, we can use the `onNNN` methods instead of (or in addition to) the `ok` 
and `err`. For instance, if we, in the above example, know that the only 
possible success code is going to be 200, and the only possible error code 
is 404, we can write the handlers like this:

```javascript
xhr.GET('/data', {
  on200(data) {
    // Do something with the data
  },
  on404() {
    // Do something with the 404 response
  },
  err(err) {
    // Do something with errors
  },
});
```

We have also kept the `err()` method in addition to the two 
status-code-specific ones as we want to account for any unforeseen conditions
(e.g., 500 status code).

There is one more method that is recognized, which is `other()`. If provided,
it will be called for 3xx status codes instead of `err()`.

All of the methods always receive three arguments. The first is the response 
payload (if any and if applicable), the second is the status code, and the 
third is the standard [response object](https://mzl.la/2RKgXBx). 

The only case where the response object is not passed is on exceptions, 
either errors like browser not being online, or errors that happen during 
request handling. In this case, status code is 0.

The response payload is always assumed to be JSON. This is by design. The 
BeamKit's implementation will not use the `Content-Type` header to try and do
the right thing, but instead treats all incoming data as JSON for 
simplicity's sake. We'll see how this can be customized a bit later.

### Passing request parameters

We sometimes need to pass parameters to the server. Here is an example using 
the POST request this time:

```javascript
const reservation = {
  date: '2019-04-12',
  movie: 10,
  count: 3,
  groupSeats: true,
};

xhr.POST('/reservations', { data: reservation }, {
  ok() {
    // Yay!
  },
  err(validationError) {
    // We didn't pass the correct information :(
  },
});
```

Right after the URL, we pass an options object which is used to customize the
different aspects of a request. In the options object, the `data` property 
represents the request payload. Since this is a POST request, the data object 
will be converted to a JSON string, and sent as the request body. This is also
the case with PUT and DELETE requests. In case of a GET request, which does 
not have a request body, the `data` is converted into a query string.   

### Passing request headers

Sometimes, servers require us to send information as request headers. For 
example, many authorization schemes will ask for an `Authorization` header.

Here is an example of a GET request that uses such a header:

```javascript
xhr.GET('/profile', {
  headers: {
    Authorization: 'Bearer a081d018dc017593c72',
  },
}, {
  ok(profile) {
    // Do something with the profile
  },
  err(error, status) {
    if (status === 403) {
      // Our token was bad
    }
    
    else {
      // Or maybe it was something else?
    }
  },
});
```

Just like with the request payload, we use the options object (second 
argument) to add headers. The `headers` property is an object whose keys are 
the header names, and values are the header values. 

## Handling responses other than JSON

We mentioned earlier that the response is assumed to be JSON. If we want to 
handle responses that are not JSON (e.g., image or HTML), we can write our 
own logic for extracting the payload from the response object.

Here is an example of a request that expects HTML to be returned.

```javascript
xhr.POST('/preview', { data: { documentId: 2 } }, {
  ok(html) {
    // Do something with the HTML text.
  },
  err() {
    // Not again!
  },
  convert(response) {
    return response.text();
  },
});
``` 

To the handlers object, we have added a `convert()` method which takes a 
response and returns its [text value](https://mzl.la/2REzXRW). The convert 
method is expected to return a promise, which `Response.prototype.text()` 
returns. 

The logic inside the `convert()` function can be as complex as you wish, but 
it's generally recommended to stick to what it's meant to do: return the 
correct request payload. We should not, for example, filter or sort or
otherwise manipulate the response data here. 

## Changing the behavior of XHR functions

There are scenarios in which we want to change the behavior of the XHR 
methods globally. For example, we may want to have a configurable prefix for 
all URLs, or we may want to attach some headers to all requests. This is 
achieved by using the XHR plugin API.

Here is an example of a plugin that prefixes all URLs with `'/api'`:

```javascript
const prefixApi = next => (url, options) => {
  return next('/api' + url, options);
};

prefixApi.key = 'urlPrefix';

xhr.addPlugin(prefixApi);
```

The `next` argument is a function that looks like this:

```javascript
(url, options) => Promise
```

You will notice that the function returned by the plugin takes the same 
arguments and returns the result of calling `next()`. In other words, it 
returns the modified version of `next()`.

Because the plugin's return value wraps around the `next()` function, it gets
a chance to both alter the arguments before they reach `next()` as well as 
modify the response before it reaches the handlers.

Let's take a look at one more example:

```javascript
const authorization = next => (url, options) => {
  options = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: 'Bearer a081d018dc017593c72',
    },
  };
  
  return next(url, options);
};

authorization.key = 'authorization';

xhr.addPlugin(authorization);
```

This time we have modified the options object instead of the URL. It's 
important to note that we have made a copy of the options object instead of 
modifying it directly. This is important because an options object can be 
created elsewhere and values on it accessible to different parts of the 
application. We may not want to leak the authorization token to code that 
should not have access to it, or maybe we don't want to mess some code by 
overwriting values that it may expect to be in the options object it passed.

It's beyond the scope of this documentation, but the plugins can perform much
more complex tasks than what we've seen here. For example, we could write 
plugins that would retry failed requests or attempt to obtain a new 
authorization token automatically if the current one is expired, and so on.
