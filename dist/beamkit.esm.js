function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

const listeners = {};

var hub = {
  addEventListener(event, listener) {
    if (!(event in listeners)) {
      listeners[event] = [];
    }

    listeners[event].push(listener);

    return () => {
      listeners[event].splice(listeners[event].indexOf(listener));
    };
  },
  dispatchEvent(topic, ...args) {
    if (!(topic in listeners)) return;

    listeners[topic].forEach(fn => {
      fn(...args);
    });
  },
  clearEventListeners() {
    for (let key in listeners) {
      delete listeners[key];
    }
  },
};

var utils = createCommonjsModule(function (module, exports) {
const my = exports;

my.camelize = s => {
  return s.toLowerCase().replace(/-([a-z])/ig, (_, s) => s.toUpperCase())
};

my.decamelize = s => {
  return s.replace(/([A-Z])/g, (_s, c) => `-${c.toLowerCase()}`);
};

my.merge = (target, source) => {
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue;
    const val = source[key];
    if (val === undefined) {
      if (target.hasOwnProperty(key))
        delete target[key];
    }
    else {
      target[key] = val;
    }
  }
};
});

var h = createCommonjsModule(function (module) {
const my = module.exports = function (what, attrs, ...children) {
  if (typeof what === 'function') {
    return my.hFunc(what, attrs, ...children);
  }
  return my.hTag(what, attrs, ...children);
};

my.Fragment = (_, ...children) => {
  const f = document.createDocumentFragment();
  my.addChildren(f, children);
  return f;
};

my.hFunc = (fn, attrs, ...children) => {
  return fn(attrs, children);
};

my.hTag = (tag, attrs, ...children) => {
  const el = document.createElement(tag);

  // This is a custom version of `dataset` because `dataset` only allows string
  // values, and that's not very useful to us. Any `data-*` attributes will
  // populate this object.
  el.data = {};

  my.addChildren(el, children);

  if (attrs) {
    for (let key in attrs) {
      const val = attrs[key];

      if (val == null) continue;

      // Convert the attributes that are not the same as DOM props

      if (key === 'class') {
        el.className = val.trim();
      }

      else if (key === 'for') {
        el.htmlFor = val.trim();
      }

      else if (key === 'tabindex') {
        el.tabIndex = val;
      }

      // Handle style attribute

      else if (key === 'style') {
        for (let rule in val) {
          el.style[rule] = val[rule];
        }
      }

      // Handle data attributes

      else if (key === 'data') {
        for (let dataKey in val) {
          if (val.hasOwnProperty(dataKey)) {
            el.data[dataKey] = el.dataset[dataKey] = val[dataKey];
          }
        }
      }

      else if (key.startsWith('data-')) {
        key = utils.camelize(key.slice(5));
        el.data[key] = el.dataset[key] = val;
      }

      // Handle string-based events

      else if (key.startsWith('on') && typeof val === 'string') {
        const eventKey = key;
        const [eventName, ...options] = val.split('.');

        const prevent = options.includes('prevent');
        const stop = options.includes('stop');
        const once = options.includes('once');

        const listener = e => {
          const target = e.target;
          const { data, tagName } = target;

          // Handle options
          if (prevent || tagName === 'FORM') e.preventDefault();
          if (stop) e.stopPropagation();
          if (once) el[eventKey] = null;

          // Extract values from relevant types of elements
          if (tagName === 'INPUT' && target.type === 'checkbox')
            data.value = target.checked;
          else if (target.value != null)
            data.value = target.value;

          // Transmit a message
          hub.dispatchEvent(eventName, data, target, e);
        };

        el[key] = listener;
      }

      // Anything else is assigned as is, no questions asked

      else {
        el[key] = val;
      }
    }
  }

  return el;
};

my.isTextNode = child => typeof child !== 'object' && child != null;

my.addChildren = (el, children) => {
  const l = children.length;
  let textContent = '';

  for (let i = 0; i < l; i++) {
    const child = children[i];

    if (textContent && !my.isTextNode(child)) {
      // This child is not text, so flush the text content first before
      // processing the child
      el.appendChild(document.createTextNode(textContent));
      textContent = '';
    }

    if (child instanceof HTMLElement || child instanceof DocumentFragment)
      el.appendChild(child);

    else if (Array.isArray(child))
      my.addChildren(el, child);

    else if (my.isTextNode(child))
      // Accumulate text until the next non-text child. Always include a sinlge
      // space between them. Trimming takes care of cases where child is itself
      // consists of whitespace only.
      textContent = (textContent + ' ' + child).trim();
  }

  if (textContent)
    // When text is the last child, we may still have left over text
    // we need to flush
    el.appendChild(document.createTextNode(textContent));
};
});

var localHub = () => {
  const stopCallbacks = [];

  const localHub = {
    dispatchEvent: hub.dispatchEvent,
    addEventListener(topic, fn) {
      stopCallbacks.push(hub.addEventListener(topic, fn));
    },
    destroy() {
      stopCallbacks.forEach(removeEventListener => removeEventListener());
      stopCallbacks.length = 0;
    },
  };

  localHub.addEventListener('module-destroy', localHub.destroy);

  return localHub;
};

var xhr = createCommonjsModule(function (module) {
const my = module.exports;

my.convertToQs = data => {
  const qs = [];
  for (const key in data) {
    if (data.hasOwnProperty(key))
      qs.push(`${key}=${encodeURIComponent(data[key])}`);
  }
  return qs.join('&');
};

my.fromJSON = res => res.json();

my.plugins = [];

my.request = async (method, url, options, handlers) => {
  // Define the request parameters
  if (handlers === undefined) {
    handlers = options;
    options = {};
  }

  const data = options.data;
  const ignorePlugins = options.ignorePlugins || [];
  options = {
    method,
    headers: { ...options.headers },
  };
  handlers.convert = handlers.convert || my.fromJSON;

  if (data) {
    if (method === 'GET') {
      url += '?' + my.convertToQs(data);
    } else {
      options.body = JSON.stringify(data);
      options.headers = {
        'Content-Type': 'application/json',
      };
    }
  }

  // Create the request function
  let doRequest = (url, options) => fetch(url, options);

  // Apply plugins
  my.plugins.forEach(plugin => {
    if (ignorePlugins.indexOf(plugin.key) > -1) return;
    doRequest = plugin(doRequest);
  });

  try {
    const res = await doRequest(url, options);

    if (res.status === 204)
      (handlers.on204 || handlers.ok)(null, 204, res);

    else if (res.status === 200)
      (handlers.on200 || handlers.ok)(await handlers.convert(res), 200, res);

    else if (res.status >= 400)
      (handlers['on' + res.status] || handlers.err)(
        await handlers.convert(res),
        res.status,
        res
      );

    else
      (handlers['on' + res.status] || handlers.other || handlers.err)(
        null,
        res.status,
        res
      );
  }

  catch (e) {
    handlers.err(e, 0);
  }
};

my.GET = my.request.bind(null, 'GET');
my.POST = my.request.bind(null, 'POST');
my.PUT = my.request.bind(null, 'PUT');
my.DELETE = my.request.bind(null, 'DELETE');
my.addPlugin = plugin => my.plugins.push(plugin);
my.clearPlugins = () => my.plugins.length = 0;
});

var browser = createCommonjsModule(function (module) {
const my = module.exports;

my.location = window.location;
my.history = window.history;
my.localStorage = window.localStorage;
});

var urlstate = createCommonjsModule(function (module, exports) {
const my = exports;

my.coerce = val => {
  if (val === '')
    return true;

  else if (/^\d+(\.\d+)?$/.test(val))
    return parseFloat(val);

  else if (val === 'true' || val === 'false')
    return val === 'true';

  else if (val === 'null')
    return null;

  else
    return val;
};

my.urlEncode = params => {
  const keys = Object.keys(params);

  if (keys.length === 0) return '';

  keys.sort(); // make key order predictable

  const pairs = [];

  keys.forEach(key => {
    const val = params[key];
    key = utils.decamelize(key);

    if (val === undefined) return;

    pairs.push(`${key}=${encodeURIComponent(val)}`);
  });

  return pairs.join('&');
};

my.urlDecode = qs => {
  const params = {};

  if (qs.length === 0)
    return params;

  const pairs = qs.split('&');

  pairs.forEach(pair => {
    let [key, val = ''] = pair.split('=');

    val = my.coerce(decodeURIComponent(val));

    params[utils.camelize(key)] = val;
  });

  return params;
};

my.toUrl = ({ path, query, hash }) => {
  let url = '';

  if (path.length === 0) url += '/';

  else {
    path.forEach(segment => {
      url += '/' + encodeURIComponent(utils.decamelize('' + segment));
    });
  }

  query = my.urlEncode(query);
  if (query)
    url += '?' + query;

  hash = my.urlEncode(hash);
  if (hash)
    url += '#' + hash;

  return url;
};

my.getState = () => {
  let { pathname, search, hash } = browser.location;
  const locationObject = {};

  if (pathname === '/') locationObject.path = [];

  else {
    locationObject.path = pathname.slice(1).replace(/\/\/+/g, '/').split('/');
    locationObject.path.forEach((segment, i) => {
      locationObject.path[i] = my.coerce(utils.camelize(decodeURIComponent(segment)));
    });
  }

  locationObject.query = my.urlDecode(search.slice(1));
  locationObject.hash = my.urlDecode(hash.slice(1));

  return locationObject;
};

my.swapState = ({ path = [], query = {}, hash = {} }) => {
  const locationObject = { path, query, hash };
  browser.history.pushState(null, '', my.toUrl(locationObject));
  hub.dispatchEvent('location-change', locationObject);
};

my.updateState = callback => {
  const locationObject = my.getState();
  callback(locationObject);
  my.swapState(locationObject);
};

my.patchLocation = partialLocation => locationObject => {
  if (partialLocation.path)
    locationObject.path = partialLocation.path;

  if (partialLocation.query)
    utils.merge(locationObject.query, partialLocation.query);

  if (partialLocation.hash)
    utils.merge(locationObject.hash, partialLocation.hash);
};

my.changeState = partialLocation => {
  my.updateState(my.patchLocation(partialLocation));
};

my.updateUrl = partialLocation => {
  const locationObject = my.getState();
  const updater = my.patchLocation(partialLocation);
  updater(locationObject);
  return my.toUrl(locationObject);
};

window.addEventListener('popstate', () => {
  hub.dispatchEvent('location-change', my.getState());
});
});

var src = {
  h: h,
  hub: hub,
  localHub: localHub,
  xhr: xhr,
  urlstate: urlstate,
  utils: utils,
  browser: browser,
};
var src_1 = src.h;
var src_2 = src.hub;
var src_3 = src.localHub;
var src_4 = src.xhr;
var src_5 = src.urlstate;
var src_6 = src.utils;
var src_7 = src.browser;

export default src;
export { src_1 as h, src_2 as hub, src_3 as localHub, src_4 as xhr, src_5 as urlstate, src_6 as utils, src_7 as browser };
