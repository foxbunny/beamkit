const utils = require('./utils');
const browser = require('./browser');
const hub = require('./hub');

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
