/**
 * The `editList()` code is based on Snabbdom's `updateNodes()`.
 *
 * The original code was modified to create minimal edit lists for arrays of
 * keys as opposed to arrays of VDOM nodes, and present an
 * event-emitter-style interface.
 *
 * Reference to the original function: http://bit.ly/2RRzmME
 *
 * Original: (c) 2015 Simon Friis Vindum
 * This version: (c) 2019 Hajime Yamasaki Vukelic
 */

const my = module.exports;

my.editList = (oldKeys, newKeys, handlers) => {
  let oldStartIdx = 0, newStartIdx = 0;
  let oldEndIdx = oldKeys.length - 1;
  let oldStartKey = oldKeys[0];
  let oldEndKey = oldKeys[oldEndIdx];
  let newEndIdx = newKeys.length - 1;
  let newStartKey = newKeys[0];
  let newEndKey = newKeys[newEndIdx];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartKey === newStartKey) { // Heads match
      handlers.keep(oldStartKey);
      oldStartKey = oldKeys[++oldStartIdx];
      newStartKey = newKeys[++newStartIdx];
    }

    else if (oldEndKey === newEndKey) { // Tails match
      handlers.keep(oldEndKey);
      oldEndKey = oldKeys[--oldEndIdx];
      newEndKey = newKeys[--newEndIdx];
    }

    else if (oldStartKey === newEndKey) { // Key moved to tail
      handlers.moveAfter(oldStartKey, oldEndKey);
      oldStartKey = oldKeys[++oldStartIdx];
      newEndKey = newKeys[--newEndIdx];
    }

    else if (oldEndKey === newStartKey) { // Key moved to head
      handlers.moveBefore(oldEndKey, oldStartKey);
      oldEndKey = oldKeys[--oldEndIdx];
      newStartKey = newKeys[++newStartIdx];
    }

    else { // Key may or may not be somewhere in the middle
      const idxInOld = oldKeys.indexOf(newStartKey);

      if (idxInOld === -1) { // Key is not in middle
        handlers.create(newStartKey, oldStartKey);
      }

      else { // Key is in middle, extract to start of the current range
        handlers.moveBefore(newStartKey, oldStartKey);
        oldKeys[idxInOld] = undefined;
      }

      newStartKey = newKeys[++newStartIdx];
    }
  }

  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      for (; newStartIdx <= newEndIdx; newStartIdx++)
        handlers.append(newKeys[newStartIdx]);
    } else {
      for (; oldStartIdx <= oldEndIdx; oldStartIdx++) {
        if (oldKeys[oldStartIdx])
          handlers.remove(oldKeys[oldStartIdx]);
      }
    }
  }
};

my.update = (
  oldData,
  newData,
  rootNode,
  createChild,
  updateChild,
  toKey = member => member.key,
) => {
  const oldKeys = [];
  const newKeys = [];
  const oldKeyIndex = {};
  const newKeyIndex = {};
  const nodeKeyIndex = {};

  oldData.forEach((member, index) => {
    const key = toKey(member);
    oldKeys.push(key);
    oldKeyIndex[key] = member;
    nodeKeyIndex[key] = rootNode.childNodes[index];
  });

  newData.forEach(member => {
    const key = toKey(member);
    newKeys.push(key);
    newKeyIndex[key] = member;
  });

  my.editList(oldKeys, newKeys, {
    keep(key) {
      const node = nodeKeyIndex[key];
      updateChild(node, newKeyIndex[key], oldKeyIndex[key]);
    },
    moveBefore(key, pos) {
      const node = nodeKeyIndex[key];
      updateChild(node, newKeyIndex[key], oldKeyIndex[key]);
      rootNode.insertBefore(node, nodeKeyIndex[pos]);
    },
    moveAfter(key, pos) {
      const node = nodeKeyIndex[key];
      updateChild(node, newKeyIndex[key], oldKeyIndex[key]);
      rootNode.insertBefore(nodeKeyIndex[key], nodeKeyIndex[pos].nextSibling);
    },
    remove(key) {
      rootNode.removeChild(nodeKeyIndex[key]);
    },
    create(key, pos) {
      rootNode.insertBefore(createChild(newKeyIndex[key]), nodeKeyIndex[pos]);
    },
    append(key) {
      rootNode.appendChild(createChild(newKeyIndex[key]));
    },
  });
};
