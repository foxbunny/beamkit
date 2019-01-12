const urlstate = require('./urlstate');
const browser = require('./browser');
const hub = require('./hub');
const sinon = require('sinon');

describe('urlstate', () => {
  describe('urlEncode', () => {
    test('URL-encode an object', () => {
      expect(urlstate.urlEncode({
        limit: 10,
      })).toBe('limit=10');
    });

    test('encode an empty object', () => {
      expect(urlstate.urlEncode({})).toBe('');
    });

    test('sort the keys', () => {
      expect(urlstate.urlEncode({
        a: 1,
        e: 2,
        c: 4,
        d: 5,
        b: 6,
      })).toBe('a=1&b=6&c=4&d=5&e=2');
    });

    test('decamelize the keys', () => {
      expect(urlstate.urlEncode({
        sortOrder: 'price',
      })).toBe('sort-order=price');
    });

    test('convert null values', () => {
      expect(urlstate.urlEncode({
        limit: null
      })).toBe('limit=null');
    });

    test('omit value for undefined', () => {
      expect(urlstate.urlEncode({
        login: true,
        userId: undefined,
      })).toBe('login=true');
    });
  });

  describe('urlDecode', () => {
    test('URL-deocde a query string', () => {
      expect(urlstate.urlDecode('search=test')).toEqual({
        search: 'test',
      });
    });

    test('decode an empty string', () => {
      expect(urlstate.urlDecode('')).toEqual({});
    });

    test('query containing an integer', () => {
      expect(urlstate.urlDecode('limit=10')).toEqual({
        limit: 10,
      });
    });

    test('query containing a float', () => {
      expect(urlstate.urlDecode('padding=0.23')).toEqual({
        padding: 0.23,
      });
    });

    test('query containing a number-like string', () => {
      expect(urlstate.urlDecode('padding=45#2')).toEqual({
        padding: '45#2',
      });
    });

    test('query containing a Boolean true', () => {
      expect(urlstate.urlDecode('editing=true')).toEqual({
        editing: true,
      });
    });

    test('query containing a Boolean false', () => {
      expect(urlstate.urlDecode('editing=false')).toEqual({
        editing: false,
      });
    });

    test('query containing a value-less parameter', () => {
      expect(urlstate.urlDecode('editing')).toEqual({
        editing: true,
      });
    });

    test('query containing encoded characters', () => {
      expect(urlstate.urlDecode('redirect=%2Flogin%2F')).toEqual({
        redirect: '/login/',
      });
    });

    test('camelize keys', () => {
      expect(urlstate.urlDecode('sort-order=price')).toEqual({
        sortOrder: 'price',
      });
    });

    test('multiple parameters', () => {
      expect(urlstate.urlDecode('count=10&limit=2')).toEqual({
        limit: 2,
        count: 10,
      });
    });

    test('reversible', () => {
      const query = 'count=10&enabled=true&limit=2&sort-order=price';
      expect(urlstate.urlEncode(urlstate.urlDecode(query)))
        .toBe(query);
    });
  });

  describe('toUrl', () => {
    test('convert empty location to URL', () => {
      const l = {
        path: [],
        query: {},
        hash: {},
      };

      expect(urlstate.toUrl(l)).toBe('/');
    });

    test('convert path', () => {
      const l = {
        path: ['books', 12],
        query: {},
        hash: {},
      };

      expect(urlstate.toUrl(l)).toBe('/books/12');
    });

    test('decamelize path', () => {
      const l = {
        path: ['bookCollection'],
        query: {},
        hash: {},
      };

      expect(urlstate.toUrl(l)).toBe('/book-collection');
    });

    test('convert query', () => {
      const l = {
        path: [],
        query: { sort: 'year' },
        hash: {},
      };

      expect(urlstate.toUrl(l)).toBe('/?sort=year');
    });

    test('convert hash', () => {
      const l = {
        path: [],
        query: {},
        hash: { menuOpen: true },
      };

      expect(urlstate.toUrl(l)).toBe('/#menu-open=true');
    });

    test('convert all three', () => {
      const l = {
        path: ['books', 12],
        query: { sort: 'year' },
        hash: { menuOpen: true },
      };

      expect(urlstate.toUrl(l)).toBe('/books/12?sort=year#menu-open=true');
    });
  });

  describe('getState', () => {
    let originalLocation = browser.location;

    afterAll(() => {
      browser.location = originalLocation;
    });

    test('convert location to location object', () => {
      browser.location = {
        pathname: '/books/12',
        search: '?sort=year',
        hash: '#menu-open=true',
      };

      expect(urlstate.getState()).toEqual({
        path: ['books', 12],
        query: { sort: 'year' },
        hash: { menuOpen: true },
      });
    });

    test('root path', () => {
      browser.location = {
        pathname: '/',
        search: '',
        hash: '',
      };

      expect(urlstate.getState()).toEqual({
        path: [],
        query: {},
        hash: {},
      });
    });

    test('non-string segments', () => {
      browser.location = {
        pathname: '/seat/11/43.3/null/true',
        search: '',
        hash: '',
      };

      expect(urlstate.getState()).toEqual({
        path: ['seat', 11, 43.3, null, true],
        query: {},
        hash: {},
      });
    });

    test('camelize segments', () => {
      browser.location = {
        pathname: '/book-collection',
        search: '',
        hash: '',
      };

      expect(urlstate.getState()).toEqual({
        path: ['bookCollection'],
        query: {},
        hash: {},
      });
    });
  });

  describe('swapState', () => {
    beforeAll(() => {
      sinon.spy(browser.history, 'pushState');
      sinon.spy(hub, 'dispatchEvent');
    });

    afterAll(() => {
      browser.history.pushState.restore();
      hub.dispatchEvent.restore();
    });

    test('push location objects using pushState', () => {
      const l = {
        path: ['books', 12],
        query: { sort: 'year' },
        hash: { menuOpen: true },
      };

      urlstate.swapState(l);

      const result = browser.history.pushState.calledWithExactly(
        null,
        '',
        '/books/12?sort=year#menu-open=true'
      );

      expect(result).toBe(true);
    });

    test('empty path', () => {
      const l = {
        path: [],
        query: {},
        hash: {},
      };

      urlstate.swapState(l);

      expect(browser.history.pushState.calledWithExactly(
        null,
        '',
        '/'
      )).toBe(true);
    });

    test('decamelize path', () => {
      const l = {
        path: ['bookCollection'],
        query: {},
        hash: {},
      };

      urlstate.swapState(l);

      expect(browser.history.pushState.calledWithExactly(
        null,
        '',
        '/book-collection'
      )).toBe(true);
    });

    test('non-string segments', () => {
      const l = {
        path: ['seat', 11, 43.3, null, true],
        query: {},
        hash: {},
      };

      urlstate.swapState(l);

      expect(browser.history.pushState.calledWithExactly(
        null,
        '',
        '/seat/11/43.3/null/true'
      )).toBe(true);
    });

    test('dispatch event', () => {
      const l = {
        path: ['seat', 11, 43.3, null, true],
        query: {},
        hash: {},
      };

      urlstate.swapState(l);

      expect(hub.dispatchEvent.calledWithExactly('location-change', l))
        .toBe(true);
    });

    test('using partial location', () => {
      const l = {
        query: { sort: 'price' },
      };

      urlstate.swapState(l);

      expect(hub.dispatchEvent.calledWithExactly('location-change', {
        path: [],
        query: { sort: 'price' },
        hash: {},
      }))
        .toBe(true);
    });
  });

  describe('updateState', () => {
    let originalLocation = browser.location;

    beforeAll(() => {
      sinon.spy(browser.history, 'pushState');
      sinon.spy(hub, 'dispatchEvent');
      browser.location = {
        pathname: '/books/12',
        search: '?sort=price',
        hash: '#menu-open=true',
      };
    });

    afterAll(() => {
      browser.history.pushState.restore();
      hub.dispatchEvent.restore();
      browser.location = originalLocation;
    });

    test('update', () => {
      let received;

      const updater = l => {
        received = Object.assign({}, l);
        l.path = ['updated'];
        l.query = { updated: true };
        l.hash = { updated: true };
      };

      urlstate.updateState(updater);

      expect(received).toEqual({
        path: ['books', 12],
        query: { sort: 'price' },
        hash: { menuOpen: true },
      });

      expect(browser.history.pushState.calledWithExactly(
        null,
        '',
        '/updated?updated=true#updated=true',
      )).toBe(true);

      expect(hub.dispatchEvent.calledWithExactly(
        'location-change',
        {
          path: ['updated'],
          query: { updated: true },
          hash: { updated: true },
        }
      )).toBe(true);
    });
  });

  describe('patchLocation', () => {
    const createLocation = () => ({
      path: ['books', 12],
      query: { sort: 'price' },
      hash: { menuOpen: true },
    });

    test('patch path', () => {
      const l = createLocation();

      urlstate.patchLocation({ path: ['books', 11] })(l);

      expect(l).toEqual({
        path: ['books', 11],
        query: { sort: 'price' },
        hash: { menuOpen: true },
      });
    });

    test('patch with empty path', () => {
      const l = createLocation();

      urlstate.patchLocation({ path: [] })(l);

      expect(l).toEqual({
        path: [],
        query: { sort: 'price' },
        hash: { menuOpen: true },
      });
    });

    test('set query', () => {
      const l = createLocation();

      urlstate.patchLocation({ query: { sort: 'year' } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: { sort: 'year' },
        hash: { menuOpen: true },
      });
    });

    test('add query', () => {
      const l = createLocation();

      urlstate.patchLocation({ query: { limit: 10 } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: { sort: 'price', limit: 10 },
        hash: { menuOpen: true },
      });
    });

    test('delete query', () => {
      const l = createLocation();

      urlstate.patchLocation({ query: { sort: undefined } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: {},
        hash: { menuOpen: true },
      });
    });

    test('set hash', () => {
      const l = createLocation();

      urlstate.patchLocation({ hash: { menuOpen: false } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: { sort: 'price' },
        hash: { menuOpen: false },
      });
    });

    test('add hash', () => {
      const l = createLocation();

      urlstate.patchLocation({ hash: { footerOpen: true } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: { sort: 'price' },
        hash: { menuOpen: true, footerOpen: true },
      });
    });

    test('delete hash', () => {
      const l = createLocation();

      urlstate.patchLocation({ hash: { menuOpen: undefined } })(l);

      expect(l).toEqual({
        path: ['books', 12],
        query: { sort: 'price' },
        hash: {},
      });
    });
  });

  describe('changeState', () => {
    let originalLocation = browser.location;

    beforeAll(() => {
      sinon.spy(browser.history, 'pushState');
      sinon.spy(hub, 'dispatchEvent');
      browser.location = {
        pathname: '/books/12',
        search: '?sort=price',
        hash: '#menu-open=true',
      };
    });

    afterAll(() => {
      browser.history.pushState.restore();
      hub.dispatchEvent.restore();
      browser.location = originalLocation;
    });

    test('patch state', () => {
      urlstate.changeState({
        path: ['books', 11],
        hash: { menuOpen: undefined },
      });

      expect(browser.history.pushState.calledWithExactly(
        null,
        '',
        '/books/11?sort=price',
      )).toBe(true);

      expect(hub.dispatchEvent.calledWithExactly(
        'location-change',
        {
          path: ['books', 11],
          query: { sort: 'price' },
          hash: {},
        }
      )).toBe(true);
    });
  });

  describe('updateUrl', () => {
    let originalLocation = browser.location;

    beforeAll(() => {
      browser.location = {
        pathname: '/books/12',
        search: '?sort=price',
        hash: '#menu-open=true',
      };
    });

    afterAll(() => {
      browser.location = originalLocation;
    });

    test('create an updated URL', () => {
      expect(urlstate.updateUrl({ query: { sort: 'year' } }))
        .toBe('/books/12?sort=year#menu-open=true');
    });
  });
});

