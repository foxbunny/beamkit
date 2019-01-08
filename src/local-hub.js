const hub = require('./hub');

module.exports = () => {
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
