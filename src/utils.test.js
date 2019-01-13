const utils = require('./utils');

describe('utils', () => {
  describe('camelize', () => {
    test.each([
      ['foo-bar', 'fooBar'],
      ['foo-x-bar', 'fooXBar'],
      ['foo1-bar2', 'foo1Bar2'],
      ['fo-o-b-a-r', 'foOBAR'],
      ['-foo-bar', 'FooBar'],
    ])(
      'camelize a string like %s',
      (source, expected) => {
        expect(utils.camelize(source)).toBe(expected);
      }
    )
  });

  describe('decamelize', () => {
    test.each([
      ['fooBar', 'foo-bar'],
      ['fooXBar', 'foo-x-bar'],
      ['foo1Bar2', 'foo1-bar2'],
      ['foOBAR', 'fo-o-b-a-r'],
      ['FooBar', '-foo-bar'],
    ])(
      'decamelize a string like %s',
      (source, expected) => {
        expect(utils.decamelize(source)).toBe(expected);
      }
    )
  });

  describe('merge', () => {
    test('merge source into target', () => {
      const t = { foo: true };
      const s = { bar: true };
      utils.merge(t, s);
      expect(t).toEqual({
        foo: true,
        bar: true,
      });
    });

    test('will not merge prototype properties', () => {
      const t = { foo: true };
      const p = { bar: true };
      const s = Object.create(p);
      utils.merge(t, s);
      expect(t).toEqual({
        foo: true,
      });
    });

    test('override target properties', () => {
      const t = { foo: true };
      const s = { foo: false, bar: true };
      utils.merge(t, s);
      expect(t).toEqual({
        foo: false,
        bar: true,
      });
    });

    test('delete target key if source property is undefined', () => {
      const t = { foo: true };
      const s = { foo: undefined, bar: true };
      utils.merge(t, s);
      expect(t).toEqual({
        bar: true,
      });
    });

    test('skip undefined properties', () => {
      const t = { foo: true };
      const s = { bar: undefined };
      utils.merge(t, s);
      expect('bar' in t).toBe(false);
    });
  });
});
