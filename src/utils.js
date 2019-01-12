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
