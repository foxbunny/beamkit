(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.beamkit = {}));
}(this, function (exports) { 'use strict';

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

	var h_1 = createCommonjsModule(function (module) {
	const camelize = s => {
	  return s.replace(/-(\w)/g, (_, s) => s.toUpperCase())
	};

	const h = module.exports = function (what, attrs, ...children) {
	  if (typeof what === 'function') {
	    return hFunc(what, attrs, ...children);
	  }
	  return hTag(what, attrs, ...children);
	};

	h.Fragment = (_, ...children) => {
	  const f = document.createDocumentFragment();
	  addChildren(f, children);
	  return f;
	};

	const hFunc = (fn, attrs, ...children) => {
	  return fn(attrs, children);
	};

	const hTag = (tag, attrs, ...children) => {
	  const el = document.createElement(tag);

	  // This is a custom version of `dataset` because `dataset` only allows string
	  // values, and that's not very useful to us. Any `data-*` attributes will
	  // populate this object.
	  el.data = {};

	  addChildren(el, children);

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
	        key = camelize(key.slice(5));
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

	const isTextNode = child => typeof child !== 'object' && child != null;

	const addChildren = (el, children) => {
	  const l = children.length;
	  let textContent = '';

	  for (let i = 0; i < l; i++) {
	    const child = children[i];

	    if (textContent && !isTextNode(child)) {
	      // This child is not text, so flush the text content first before
	      // processing the child
	      el.appendChild(document.createTextNode(textContent));
	      textContent = '';
	    }

	    if (child instanceof HTMLElement || child instanceof DocumentFragment)
	      el.appendChild(child);

	    else if (Array.isArray(child))
	      addChildren(el, child);

	    else if (isTextNode(child))
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

	var src = {
	  h: h_1,
	  hub: hub,
	  localHub: localHub,
	};
	var src_1 = src.h;
	var src_2 = src.hub;
	var src_3 = src.localHub;

	exports.default = src;
	exports.h = src_1;
	exports.hub = src_2;
	exports.localHub = src_3;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
