# node-interval-tree
An [Interval Tree](https://en.wikipedia.org/wiki/Interval_tree) data structure implemented as an augmented AVL Tree where each node maintains a list of records and their search intervals. Record is composed of an interval and its underlying data, sent by a client. This allows the interval tree to have the same interval inserted multiple times, as long as its data is different. Both insertion and deletion require `O(log n)` time. Searching requires `O(min(n, k * log n))` time, where `k` is the number of intervals in the output list.

[![NPM](https://img.shields.io/npm/v/node-interval-tree.svg?style=flat)](https://www.npmjs.org/package/node-interval-tree)

[![NPM](https://nodei.co/npm/node-interval-tree.png)](https://nodei.co/npm/node-interval-tree/)

## Usage
#### `import IntervalTree from 'node-interval-tree'`
#### `const intervalTree = new IntervalTree()`

<b><code>intervalTree.insert(low, high[, data])</code></b>

Insert an interval into the tree. An optional data can be associated with the interval as well. This makes it possible to insert intervals with the same low and high value, as long as their data is different. Data can be any JS primitive or object.

* `low` - a low value of the interval
* `high` - a high value of the interval
* `data` - optional data to associate with this interval

Returns true if successfully inserted, false if nothing inserted.

<b><code>intervalTree.search(low, high)</code></b>

Search all intervals that overlap low and high arguments, both of them included. Low and high values don't need to be in the tree themselves.

* `low` - a low value to search
* `high` - a high value to search

Returns an array of all data objects that are associated with each interval found; doesn't return the intervals themselves.

<b><code>intervalTree.remove(low, high[, data])</code></b>

Remove an interval from the tree. Data is an optional argument, same as with insert. To remove an interval, all arguments must match the one in tree.

* `low` - a low value of the interval
* `high` - a high value of the interval
* `data` - optional data argument

Returns true if successfully removed, false if nothing removed.

## Example
```javascript
import IntervalTree from 'node-interval-tree'

const intervalTree = new IntervalTree()
intervalTree.insert(10, 15, 'foo') // -> true
intervalTree.insert(35, 50, 'baz') // -> true

intervalTree.search(12, 20) // -> ['foo']

intervalTree.remove(35, 50, 'baz') // -> true
intervalTree.insert(10, 15, 'baz') // -> true

intervalTree.search(12, 20) // -> ['foo', 'baz']
```

## License

MIT
