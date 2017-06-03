import { Interval, IntervalTree } from '../index' // import IntervalTree from 'node-interval-tree'
import cuid = require('cuid')

interface StringInterval extends Interval {
  data: string
}

const intervalTree = new IntervalTree<StringInterval>()

/* Usage:
interface Interval {
  readonly low: number
  readonly high: number
}

Intervals can be extended which allows you to add any data you need to the stored object.
Do not modify low or high after the interval has been inserted as this will ruin the collection.

insert - intervalTree.insert(interval: Interval) =>
         inserts based on shallow equality
         true if success, false if nothing inserted (duplicate item)
search - intervalTree.search(low: number, high: number) => [ Interval, Interval, Interval ], empty array if no result
remove - intervalTree.remove(interval: Interval) =>
         removes based on shallow equality
         true if success, false if nothing removed
*/

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

for (let i = 1; i <= 100; i++) {
  let low = getRandomInt(0, 100)
  let high = getRandomInt(0, 100)

  if (high < low) {
    const temp = high
    high = low
    low = temp
  }

  intervalTree.insert({low, high, data: cuid()})
}

console.log('Number of the records in the tree: ' + intervalTree.count)

const results = intervalTree.search(10, 15)
if (!results || results.length === 0) {
  console.log('No overlapping intervals')
} else {
  console.log('Found ' + results.length + ' overlapping intervals')

  for (let i = 0; i < results.length; i++) {
    console.log(results[i])
  }
}
