const listeners = {};

module.exports = {
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
