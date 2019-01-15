# Efficiently updating lists of DOM nodes

Simple DOM manipulation works well in most situations. For short lists of 
things that are updated completely (e.g., previous data has nothing to do 
with new data), simply swapping out the DOM nodes for the old list with DOM 
nodes for the new list is all we need.

In some situations, however, we have lists that are always updated partially.
For example, tables containing sortable and/or filtered data, lists where we 
can add, insert or delete items arbitrarily; especially, the cases where most
DOM nodes in the list remain untouched and only some of them changes or only 
the order changes. In all these cases, it's wasteful, and sometimes outright 
slow, to update the entire list by swapping DOM nodes.

BeamKit provides a function for efficiently updating such lists by creating a
diff between the new data and the old, and applying the diff to DOM nodes. 
The algorithm for this comes from [Snabbdom](http://bit.ly/2RRzmME), a 
virtual DOM library, and is designed to created a minimal list of edits that 
have to be made to the child nodes in order to match the intended state.

## Preparing the data for updates

DOM diffing in BeamKit is deliberately simplified and we only use keyed lists
for performance and robustness. This puts constraints on how we write our 
view code and how we structure the data.

Each piece of data in an array is identified using a key. The key can 
literally be a `key` property, or an existing property on your array members.
The only requirement for the key is that it's unique for each member across 
the entire array. For example:

```javascript
const users = [
  { userId: '0199a', name: 'John', email: 'j.doe@example.com' },
  { userId: '0c120', name: 'Jane', email: 'jane@example.com' },
  { userId: '1acf2', name: 'Hellen', email: 'smartypants@example.com' },
];
```

In this case, we have the `userId` which is assumed to be unique across all 
users. So we can use that.

Unlike many virtual DOM implementations, we don't need to do anything special
to the child nodes (there is no need to use the `key` attribute or `id` or 
anything similar). It is, however, assumed that:

- Parent node only contains nodes that belong to the list.
- Child nodes are always single nodes (they may, however, contain any 
  number of child nodes).
- The order of child nodes must match the older of members in  the data array
  from which they were created.
  
Here is a simple table that matches the above data and satisfies the above 
guidelines:

```javascript
const { h } = requrie('beamkit');

const userRow = user => (
  <tr>
    <td>
      {user.name}
    </td>
    <td>
      {user.email}
    </td>
  </tr>
);

const table = (
  <table>
    <tbody>
      {users.map(userRow)}
    </tbody>
  </table>
);
```

## Updating the DOM nodes

Let's say we want to sort the users by name. The first important thing to 
remember is that we should always copy the old list before we do this.

```javascript
const sortedUsers = users.slice();
```

Next, we sort them:

```javascript
sortedUsers.sort((a, b) => {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
});
```

We are now ready to update the table. To do this, we use `keyedList.update()`
function.

```javascript
const { keyedList } = require('beamkit');

const updateRow = (rowNode, user, oldUser) => {
  if (user.name !== oldUser.name)
    rowNode.childNodes[1].textContent = user.name;
    
  if (user.email !== oldUser.email)
    rowNode.childNodes[2].textContent = user.email;
};

keyedList.update(
  users,                // old array
  sortedUsers,          // new array
  table.firstChild,     // direct parent on the child nodes
  userRow,              // function that renders a new child node
  updateRow,            // function that patches existing child nodes
  user => user.userId,  // function that convers an item to a key
);
```

Let's first take a look at the `updateRow()` function. It takes three 
arguments: the DOM node that we are about to update, the new data for that 
row, and the old data. This function is called every time an existing node is
reused (either kept in place or moved). 

The `keyedList.update()` function will not check whether the actual data has 
changed, only the DOM node's position within the list, so it always calls the
update function for nodes that are reused. Within the update function, we 
update the data for each of the two cells. We do this conditionally so that 
we do not touch nodes that should not be touched. This is the reason the 
update function always receives both the old and the new data.

The `keyedList.update()` function takes 5 or 6 arguments.

### Old and new data

The first two arguments are old and new arrays containing the data. Both must
be arrays and the old data array must match the state of the DOM tree.

### Root (parent) node 

The third argument is the root node: the direct parent element of the nodes 
that belong to the list. Be careful to select the direct parent, and not one 
of the grandparents.

### Create function

The fourth argument is the function that creates the DOM node for any new 
children. We normally already have such a function to be used when rendering 
the list initially, but this is not really a requirement. This function could
have nothing to do with how we initially rendered the children.

### Update function

The fifth argument is an update function we discussed earlier.

### Key function

The last argument is the key function, which, despite its name, is not 
required. This function takes an array member and returns a value that should
be used as its key. Again, we have to be sure that this function returns a 
value that is unique across all members or we may get unexpected results. If 
we omit this function it is assumed that every member has a `key` 
property.  

## Notes on copying data structures

Sometimes we don't just change the order/presence of array members. We may 
also manipulate the member's properties as well. Make sure that any data 
structure (objects, arrays) that are modified are copied beforehand, 
otherwise the update function, which we will look at later, will not work 
correctly.

We could use tools like `lodash.deepCopy()` and similar, but we also need to 
keep in mind that this increases the memory usage of our app. Since we only 
need to copy the data that is modified, it's best to do just that.

If we insist on changing (mutating) data in-place, we could also try this 
pattern:

```javascript
const renderItem = item => (
  <li data-item={Object.assign({}, item)}>{item.name}, {item.code}</li>
);
```

In the example, we creat a copy of the item, and stash it in the `data-item` 
attribute (attribute name is arbitrary). Then we can access the old state in 
the udpate function:

```javascript
const updateItem = (item, data) => {
  if (item.data.item.code !== data.code)
    item.textContent = `${data.name}, ${data.code}`;
};
```

At any rate, we will have to create a copy *somewhere*.

## How updates works under the hood

**NOTE:** This section is provided for informational purposes. It may not 
necessarily be accurate, nor it's intended to cover all possible details.

When `keyedList.update()` is called, it first converts the two arrays into 
arrays of keys. The key function (if provided) is called to perform the 
conversion.

An index of values for both arrays is created by mapping the keys to 
members. These indices are stored in objects. 

An index of existing child nodes is created. This index maps the keys to DOM 
nodes. The way this index is cerated is by mapping the child node at the same
position as the array member in the old data using the same key as that 
member. This is why it's crucial that the data in the array matches the node 
list faithfully. Thanks to this approach, the DOM nodes do not have to be 
marked with a key.

Using the two arrays of keys, an edit list is created and processed. The edit
list consists of commands like 'keep', 'move before', etc. For each command, 
a corresponding edit is made to the DOM nodes. For any node that is reused, 
an update function is called.

The diffing algoritm makes at least as many iterations as the length of the 
longer of the two data arrays, and in worst case scenario, twice as many. If 
the lengths of arrays are `M` and `N`, then the total number of iterations is
between `MAX(M, N)` and `2 * MAX(M, N)`. Not all edits result in DOM 
manipulation, however. DOM nodes that are kept in place may or may not be 
modified depending on the implementation of our update function.

Supposing that the length of the old array is `M` and the length of the new 
array is `N`, the entire update process will have between `M + N + MAX(M, N)` 
and `M + N + 2 * MAX(M, N)` iterations.

In worst case scenario, if we swap 100 items with completely unrelated 100 
items, we will need 400 iterations in total. The worst case scenario is 
somewhat pointless, however. In this case, simply swapping out the DOM nodes 
manually is a much faster solution. For instance, udating the user table from
the previous examples with a completely new set of users, we can do this 
instead of using `keyedList.update()`:

```javascript
table.firstChild.textContent = '';
table.firstChild.appendChild(
  <>
    {newUsers.map(userRow)}
  </>
);
```

**NOTE:** In the example, we use the `<></>` document fragment to avoid 
inserting newly created child nodes until all of them are created. The 
created child nodes are temporarily added to the fragment, and then the 
fragment itself is appended to the parent, at which point it is replaced by 
its child nodes ('unpacked', so to speak).

Swapping nodes this way will require 100 iterations for 100 items, so a 
quarter of what it takes to update using `keyedList.update()`. This does not 
mean that it is four times as fast, however, as the resulting paint and 
reflow in the browser may be more. It is best to try it both ways and compare.
