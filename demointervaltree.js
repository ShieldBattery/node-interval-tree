import { Interval, IntervalTree } from './index'
import cuid from 'cuid'

const intervalTree = new IntervalTree()

class Data {
  constructor(intervalLow, intervalHigh) {
    this.id = cuid()
    this.interval = new Interval(intervalLow, intervalHigh)
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const data = {}
for (let i = 1; i <= 100; i++) {
  let intervalLow = getRandomInt(0, 100)
    , intervalHigh = getRandomInt(0, 100)

  if (intervalHigh < intervalLow) {
    const temp = intervalHigh
    intervalHigh = intervalLow
    intervalLow = temp
  }

  data['data' + i] = new Data(intervalLow, intervalHigh)
  intervalTree.insert(data['data' + i])
}

console.log('Preorder traversal of constructed Interval Tree is')
intervalTree.preOrder(intervalTree.root)

console.log('')
console.log(data.data1.id + ' is searching with interval [' + data.data1.interval.low + ',' +
    data.data1.interval.high + ']')
const results = intervalTree.search(data.data1)
if (!results || results.length === 0) {
  console.log('No overlapping intervals')
} else {
  console.log('Found ' + results.length + ' overlapping intervals')

  for (let i = 0; i < results.length; i++) {
    console.log(results[i].id + ' - [' + results[i].interval.low + ', ' +
        results[i].interval.high + ']')
  }
}

console.log('Removing the ' + data.data1.id + ' with interval [' + data.data1.interval.low +
    ', ' + data.data1.interval.high + ']')
const isRemoved = intervalTree.remove(data.data1)
if (!isRemoved) {
  console.log('Interval to remove not found')
} else {
  console.log('Successfully removed ' + data.data1.id)
}
