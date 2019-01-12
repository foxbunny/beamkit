const hub = require('./hub');

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

my.camelize = s => {
  return s.replace(/-(\w)/g, (_, s) => s.toUpperCase())
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
        key = my.camelize(key.slice(5));
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
