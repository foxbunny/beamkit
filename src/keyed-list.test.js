const h = require('./h');
const keyedList = require('./keyed-list');
const { prettyPrint } = require('html');

const KEEP = 'keep';
const MOVE_BEFORE = 'move before';
const MOVE_AFTER = 'move after';
const REMOVE = 'remove';
const CREATE = 'create';
const APPEND = 'append';

const CASES = [
  [
    'identical lists',
    ['A', 'B', 'C', 'D', 'E'],
    ['A', 'B', 'C', 'D', 'E'],
    [
      [KEEP, 'A'],
      [KEEP, 'B'],
      [KEEP, 'C'],
      [KEEP, 'D'],
      [KEEP, 'E'],
    ],
  ],
  [
    'completely empty old',
    [],
    ['A', 'B', 'C', 'D', 'E'],
    [
      [APPEND, 'A'],
      [APPEND, 'B'],
      [APPEND, 'C'],
      [APPEND, 'D'],
      [APPEND, 'E'],
    ],
  ],
  [
    'completely empty target',
    ['A', 'B', 'C', 'D', 'E'],
    [],
    [
      [REMOVE, 'A'],
      [REMOVE, 'B'],
      [REMOVE, 'C'],
      [REMOVE, 'D'],
      [REMOVE, 'E'],
    ]
  ],
  [
    'complete swap',
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I', 'J'],
    [
      [CREATE, 'F', 'A'],
      [CREATE, 'G', 'A'],
      [CREATE, 'H', 'A'],
      [CREATE, 'I', 'A'],
      [CREATE, 'J', 'A'],
      [REMOVE, 'A'],
      [REMOVE, 'B'],
      [REMOVE, 'C'],
      [REMOVE, 'D'],
      [REMOVE, 'E'],
    ]
  ],
  [
    'swap middle',
    ['A', 'B', 'C', 'D', 'E'],
    ['A', 'B', 'D', 'C', 'E'],
    [
      [KEEP, 'A'],
      [KEEP, 'B'],
      [KEEP, 'E'],
      [MOVE_AFTER, 'C', 'D'],
      [KEEP, 'D'],
    ],
  ],
  [
    'middle subset',
    ['A', 'B', 'C', 'D', 'E'],
    ['B', 'C', 'D'],
    [
      [MOVE_BEFORE, 'B', 'A'],
      [MOVE_BEFORE, 'C', 'A'],
      [MOVE_BEFORE, 'D', 'A'],
      [REMOVE, 'A'],
      [REMOVE, 'E'],
    ],
  ],
  [
    'single item overlap',
    ['A', 'B', 'C'],
    ['C', 'D', 'E'],
    [
      [MOVE_BEFORE, 'C', 'A'],
      [CREATE, 'D', 'A'],
      [CREATE, 'E', 'A'],
      [REMOVE, 'A'],
      [REMOVE, 'B'],
    ],
  ],
  [
    'remove initial and from middle',
    ['A', 'B', 'C', 'D', 'E'],
    ['B', 'C', 'E'],
    [
      [KEEP, 'E'],
      [MOVE_BEFORE, 'B', 'A'],
      [MOVE_BEFORE, 'C', 'A'],
      [REMOVE, 'A'],
      [REMOVE, 'D'],
    ],
  ],
  [
    'remove initial',
    ['A', 'B', 'C', 'D', 'E'],
    ['B', 'C', 'D', 'E'],
    [
      [KEEP, 'E'],
      [KEEP, 'D'],
      [KEEP, 'C'],
      [KEEP, 'B'],
      [REMOVE, 'A'],
    ],
  ],
  [
    'append',
    ['A', 'B', 'C', 'D', 'E'],
    ['A', 'B', 'C', 'D', 'E', 'F'],
    [
      [KEEP, 'A'],
      [KEEP, 'B'],
      [KEEP, 'C'],
      [KEEP, 'D'],
      [KEEP, 'E'],
      [APPEND, 'F'],
    ],
  ],
];

describe('keyedList', () => {
  describe('editList', () => {
    const accumulator = () => {
      const changes = [];

      return {
        keep(key) {
          changes.push([KEEP, key]);
        },
        moveBefore(key, pos) {
          changes.push([MOVE_BEFORE, key, pos]);
        },
        moveAfter(key, pos) {
          changes.push([MOVE_AFTER, key, pos]);
        },
        remove(key) {
          changes.push([REMOVE, key]);
        },
        create(key, pos) {
          changes.push([CREATE, key, pos]);
        },
        append(key) {
          changes.push([APPEND, key]);
        },
        getChanges() {
          return changes;
        },
      };
    };

    test.each(CASES)(
      '%s',
      (_title, oldKeys, newKeys, editList) => {
        const acc = accumulator();
        keyedList.editList(
          oldKeys.slice(),
          newKeys.slice(),
          acc,
        );

        expect(acc.getChanges()).toEqual(editList);
      }
    );

    test('append', () => {
      const acc = accumulator();
      keyedList.editList(
        ['A', 'B', 'C', 'D', 'E'],
        ['A', 'B', 'C', 'D', 'E', 'F'],
        acc
      );

      expect(acc.getChanges()).toEqual([
        [KEEP, 'A'],
        [KEEP, 'B'],
        [KEEP, 'C'],
        [KEEP, 'D'],
        [KEEP, 'E'],
        [APPEND, 'F'],
      ]);
    });
  });

  describe('update', () => {
    const renderItem = item => (
      <li>{item.name}</li>
    );

    const List = ({ data }) => (
      <ul>
        {data.map(renderItem)}
      </ul>
    );

    const update = (node, data, oldData)=> {
      if (data.name === oldData.name) return;
      node.textContent = data.name;
    };

    const toItem = key => ({ name: key });

    const toKey = item => item.name;

    test.each(CASES)(
      '%s',
      (title, oldKeys, newKeys) => {
        const oldData = oldKeys.map(toItem);
        const newData = newKeys.map(toItem);
        const root = <List data={oldData} />;

        keyedList.update(oldData, newData, root, renderItem, update, toKey);

        expect(prettyPrint(root.outerHTML)).toMatchSnapshot();

        const resultKeys = [];
        root.childNodes.forEach(node => {
          resultKeys.push(node.textContent);
        });
        expect(resultKeys).toEqual(newKeys);
      }
    );

    test('use key property', () => {
      const oldData = ['A', 'B', 'C', 'D', 'E'].map(item => ({
        key: item,
        name: item,
      }));
      const newData = ['A', 'B', 'C', 'D', 'E', 'F'].map(item => ({
        key: item,
        name: item,
      }));

      const root = <List data={oldData} />;

      keyedList.update(oldData, newData, root, renderItem, update);

      const resultKeys = [];
      root.childNodes.forEach(node => {
        resultKeys.push(node.textContent);
      });
      expect(resultKeys).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    });
  });
});
