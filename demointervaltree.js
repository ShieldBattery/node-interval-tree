import IntervalTree from './index'
import cuid from 'cuid'

const intervalTree = new IntervalTree()

/* Usage:
insert - intervalTree.insert(low, high, data) => true if success, false if nothing inserted
search - intervalTree.search(low, high) => [ data, data, data, ... ], empty array if no result
remove - intervalTree.remove(low, high, data) => true if success, false if nothing removed
*/

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

for (let i = 1; i <= 100; i++) {
  let intervalLow = getRandomInt(0, 100)
    , intervalHigh = getRandomInt(0, 100)

  if (intervalHigh < intervalLow) {
    const temp = intervalHigh
    intervalHigh = intervalLow
    intervalLow = temp
  }

  intervalTree.insert(intervalLow, intervalHigh, cuid())
}

const results = intervalTree.search(10, 15)
if (!results || results.length === 0) {
  console.log('No overlapping intervals')
} else {
  console.log('Found ' + results.length + ' overlapping intervals')

  for (let i = 0; i < results.length; i++) {
    console.log(results[i])
  }
}
