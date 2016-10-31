import DataIntervalTree from '../index' // import IntervalTree from 'node-interval-tree'
import cuid = require('cuid')

const intervalTree = new DataIntervalTree<String>()

/* Usage:
insert - intervalTree.insert(low: number, high: number, data: T) =>
         inserts based on shallow equality
         true if success, false if nothing inserted (duplicate item)
search - intervalTree.search(low: number, high: number) => [ data, data, data, ... ], empty array if no result
remove - intervalTree.remove(low: number, high: number, data: T) =>
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

  intervalTree.insert(low, high, cuid())
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
