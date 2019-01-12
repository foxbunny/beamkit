const xhr = require('./xhr');
const sinon = require('sinon');

describe('xhr', () => {
  afterEach(() => {
    global.fetch = undefined;
    xhr.clearPlugins();
  });

  test.each(['GET', 'POST', 'PUT', 'DELETE'])(
    '%s request',
    async method => {
      const response = {
        status: 200,
        async json() {
          return ['book 1', 'book 2'];
        },
      };

      global.fetch = sinon.spy(async () => response);

      xhr[method]('/foo', {
        ok(data, status, res) {
          expect(status).toBe(200);
          expect(response).toBe(res);
          expect(data).toEqual(['book 1', 'book 2']);
        },
      });

      expect(global.fetch.calledWithExactly('/foo', {
        method,
        headers: {},
      })).toBe(true);
    }
  );

  test.each(['GET', 'POST', 'PUT', 'DELETE'])(
    '%s request with shorthand',
    async method => {
      const response = {
        status: 200,
        async json() {
          return ['book 1', 'book 2'];
        },
      };

      global.fetch = sinon.spy(async () => response);

      xhr[method]('/foo', {
        on200(data, status, res) {
          expect(status).toBe(200);
          expect(response).toBe(res);
          expect(data).toEqual(['book 1', 'book 2']);
        },
      });
    }
  );

  test('GET with data', async () => {
    global.fetch = sinon.spy(async () => ({
      status: 200,
      async json() {
        return ['book 1', 'book 2'];
      },
    }));

    xhr.GET('/foo', { data: { limit: 12 } }, {
      ok() { },
    });

    expect(global.fetch.calledWithExactly('/foo?limit=12', {
      method: 'GET',
      headers: {},
    })).toBe(true);
  });

  test.each(['POST', 'PUT', 'DELETE'])(
    '%s request with body',
    async method => {
      global.fetch = sinon.spy(async () => ({
        status: 204,
      }));

      await xhr[method]('/foo', { data: { limit: 12 } }, {
        ok() { },
      });

      expect(global.fetch.calledWithExactly('/foo', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: '{"limit":12}',
      })).toBe(true);
    }
  );

  test('request with headers', async () => {
    global.fetch = sinon.spy(async () => ({
      status: 200,
      async json() {
        return ['book 1', 'book 2'];
      },
    }));

    await xhr.GET('/foo', { headers: { Authorization: 'Bearer 123' } }, {
      ok() { },
    });

    expect(global.fetch.calledWithExactly('/foo', {
      method: 'GET',
      headers: { Authorization: 'Bearer 123' },
    })).toBe(true);
  });

  test.each([400, 404, 422, 500])(
    `handle using on%s`,
    async statusCode => {
      const response = {
        status: statusCode,
        async json() {
          return {limit: 'Limit required'};
        },
      };

      global.fetch = sinon.spy(async () => response);

      await xhr.GET('/foo', {
        [`on${statusCode}`](data, status, res) {
          expect(data).toEqual({limit: 'Limit required'});
          expect(status).toBe(statusCode);
          expect(res).toBe(response);
        },
      });
    }
  );

  test.each([400, 404, 422, 500])(
    'error response with code %s',
    async statusCode => {
      const response = {
        status: statusCode,
        async json() {
          return { limit: 'Limit required' };
        },
      };

      global.fetch = sinon.spy(async () => response);

      xhr.GET('/foo', {
        err(data, status, res) {
          expect(data).toEqual({ limit: 'Limit required' });
          expect(status).toBe(statusCode);
          expect(res).toBe(response);
        },
      });
    }
  );

  test.each([301, 302, 304])(
    'handle using on%s',
    async statusCode => {
      const response = {
        status: statusCode,
        async json() { },
      };

      global.fetch = sinon.spy(async () => response);

      await xhr.GET('/foo', {
        [`on${statusCode}`](data, status, res) {
          expect(data).toBe(null);
          expect(status).toBe(statusCode);
          expect(res).toBe(response);
        },
      });
    }
  );

  test.each([301, 302, 304])(
    'other response with code %s',
    async statusCode => {
      const response = {
        status: statusCode,
        async json() { },
      };

      global.fetch = sinon.spy(async () => response);

      xhr.GET('/foo', {
        other(data, status, res) {
          expect(data).toBe(null);
          expect(status).toBe(statusCode);
          expect(res).toBe(response);
        },
      });
    }
  );

  test.each([301, 302, 304])(
    'other fallback on error with code %s',
    async statusCode => {
      const response = {
        status: statusCode,
        async json() { },
      };

      global.fetch = sinon.spy(async () => response);

      xhr.GET('/foo', {
        ok() { },
        err(data, status, res) {
          expect(data).toBe(null);
          expect(status).toBe(statusCode);
          expect(res).toBe(response);
        },
      });
    }
  );

  test('fail fatally on uncaught exception', async () => {
    const e = Error('could not connect');
    global.fetch = sinon.spy(async () => { throw e; });

    await xhr.GET('/foo', {
      err(data, statusCode, res) {
        expect(data).toBe(e);
        expect(statusCode).toBe(0);
        expect(res).toBe(undefined);
      },
    });
  });

  test('use a request plugin', async () => {
    global.fetch = sinon.spy(async () => ({
      status: 200,
      async json() {
        return { hello: 'plugin' };
      },
    }));

    xhr.addPlugin(next => (url, options) => {
      return next('/api' + url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: 'Bearer 1234',
        },
      });
    });

    await xhr.GET('/books', {
      ok() {
        expect(global.fetch.calledWithExactly('/api/books', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer 1234',
          },
        })).toBe(true);
      },
    });
  });

  test('ignore installed plugins', async () => {
    global.fetch = sinon.spy(async () => ({
      status: 200,
      async json() {
        return { hello: 'plugin' };
      },
    }));

    const plugin = () => { };

    plugin.key = 'api';

    xhr.addPlugin(plugin);

    await xhr.GET('/books', { ignorePlugins: ['api'] }, {
      ok() {
        expect(global.fetch.calledWithExactly('/books', {
          method: 'GET',
          headers: {},
        })).toBe(true);
      },
    });
  });
});
