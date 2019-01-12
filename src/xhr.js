const convertToQs = data => {
  const qs = [];
  for (const key in data) {
    if (data.hasOwnProperty(key))
      qs.push(`${key}=${encodeURIComponent(data[key])}`);
  }
  return qs.join('&');
};

const fromJSON = res => res.json();

const plugins = [];

const request = async (method, url, options, handlers) => {
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
  handlers.convert = handlers.convert || fromJSON;

  if (data) {
    if (method === 'GET') {
      url += '?' + convertToQs(data);
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
  plugins.forEach(plugin => {
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
      )
  }

  catch (e) {
    handlers.err(e, 0);
  }
};

exports.GET = request.bind(null, 'GET');
exports.POST = request.bind(null, 'POST');
exports.PUT = request.bind(null, 'PUT');
exports.DELETE = request.bind(null, 'DELETE');
exports.addPlugin = plugin => plugins.push(plugin);
exports.clearPlugins = () => plugins.length = 0;
