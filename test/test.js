import { expect } from 'chai'
import { Interval, IntervalTree } from '../index'
import cuid from 'cuid'

const randomTree = new IntervalTree()

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
  randomTree.insert(data['data' + i])
}

function treeToArray(currentNode, treeArray) {
  if (currentNode === null) {
    return
  }

  treeToArray(currentNode.left, treeArray)
  for (let i = 0; i < currentNode.data.length; i++) {
    treeArray.push(currentNode)
  }
  treeToArray(currentNode.right, treeArray)
}

function isSorted(tree) {
  const treeArray = []
  treeToArray(tree.root, treeArray)

  for (let i = 0; i < treeArray.length - 1; i++) {
    if (treeArray[i].key > treeArray[i + 1].key) {
      return false
    }
  }

  return true
}

function highestMaxValue(tree) {
  const treeArray = []
  treeToArray(tree.root, treeArray)

  let highest = treeArray[0]
  for (let i = 0; i < treeArray.length; i++) {
    if (treeArray[i].max > highest.max) {
      highest = treeArray[i]
    }
  }

  return highest
}

describe('Interval tree', () => {
  it('should correctly insert into an empty tree', () => {
    const tree = new IntervalTree()

    const data = new Data(50, 100)
    const searchData = new Data(75, 100)
    tree.insert(data)
    tree.insert(searchData)

    const searchResult = tree.search(searchData)
    expect(searchResult[0].interval).to.eql(data.interval)
  })

  it('should correctly insert into a node with the same key', () => {
    const tree = new IntervalTree()

    const data1 = new Data(50, 150)
    const data2 = new Data(50, 100)
    let searchData = new Data(75, 100)
    tree.insert(data1)
    tree.insert(data2)
    tree.insert(searchData)

    let searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0].interval).to.eql(data1.interval)
    expect(searchResult[1].interval).to.eql(data2.interval)

    tree.remove(searchData)
    searchData = new Data(125, 150)
    tree.insert(searchData)
    searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(1)
    expect(searchResult[0].interval).to.eql(data1.interval)
  })

  it('should correctly insert into a left subtree', () => {
    const tree = new IntervalTree()

    const data1 = new Data(50, 150)
    const data2 = new Data(25, 100)
    const searchData = new Data(75, 100)
    tree.insert(data1)
    tree.insert(data2)
    tree.insert(searchData)

    const searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0].interval).to.eql(data2.interval)
    expect(searchResult[1].interval).to.eql(data1.interval)
  })

  it('should correctly insert into a right subtree', () => {
    const tree = new IntervalTree()

    const data1 = new Data(50, 150)
    const data2 = new Data(75, 100)
    const searchData = new Data(85, 100)
    tree.insert(data1)
    tree.insert(data2)
    tree.insert(searchData)

    const searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0].interval).to.eql(data1.interval)
    expect(searchResult[1].interval).to.eql(data2.interval)
  })

  it('should correctly balance the tree in left-left case', () => {
    const tree = new IntervalTree()

    tree.insert(new Data(100, 150))
    tree.insert(new Data(75, 100))
    tree.insert(new Data(50, 75))

    const root = tree.root
    expect(root.key).to.eql(75)
    expect(root.max).to.eql(150)
    expect(root.data.length).to.eql(1)
    expect(root.parent).to.eql(null)
    expect(root.height).to.eql(1)
    expect(root.left).to.not.eql(null)
    expect(root.right).to.not.eql(null)

    const rootLeft = tree.root.left
    expect(rootLeft.key).to.eql(50)
    expect(rootLeft.max).to.eql(75)
    expect(rootLeft.data.length).to.eql(1)
    expect(rootLeft.parent).to.not.eql(null)
    expect(rootLeft.height).to.eql(0)
    expect(rootLeft.left).to.eql(null)
    expect(rootLeft.right).to.eql(null)

    const rootRight = tree.root.right
    expect(rootRight.key).to.eql(100)
    expect(rootRight.max).to.eql(150)
    expect(rootRight.data.length).to.eql(1)
    expect(rootRight.parent).to.not.eql(null)
    expect(rootRight.height).to.eql(0)
    expect(rootRight.left).to.eql(null)
    expect(rootRight.right).to.eql(null)
  })

  it('should return an empty array when searching an empty tree', () => {
    const tree = new IntervalTree()

    const searchData = new Data(75, 150)

    const searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(0)
  })

  it('should find an overlapping interval on a node with multiple data objects', () => {
    const tree = new IntervalTree()

    const data1 = new Data(50, 70)
    const data2 = new Data(50, 100)
    const searchData = new Data(75, 150)
    tree.insert(data1)
    tree.insert(data2)
    tree.insert(searchData)

    const searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(1)
    expect(searchResult[0].interval).to.eql(data2.interval)
  })

  it('should return an empty array when searching your own data', () => {
    const tree = new IntervalTree()

    const searchData = new Data(75, 150)
    tree.insert(searchData)

    const searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(0)
  })

  it('should return false when trying to delete from an empty tree', () => {
    const tree = new IntervalTree()

    const isRemoved = tree.remove(new Data(50, 100))
    expect(isRemoved).to.eql(false)
  })

  it('should correctly delete the root node', () => {
    const tree = new IntervalTree()
    const dataToRemove = new Data(75, 150)

    tree.insert(dataToRemove)

    const isRemoved = tree.remove(dataToRemove)
    expect(isRemoved).to.eql(true)
    expect(tree.root).to.eql(null)
  })

  it('should correctly delete the data object on a node with multiple data objects', () => {
    const tree = new IntervalTree()

    const data1 = new Data(50, 120)
    const data2 = new Data(75, 100)
    const firstDataToRemove = new Data(75, 200)
    const secondDataToRemove = new Data(75, 150)
    const searchData = new Data(50, 200)
    tree.insert(data1)
    tree.insert(data2)
    tree.insert(firstDataToRemove)
    tree.insert(secondDataToRemove)
    tree.insert(searchData)

    let searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(4)
    expect(searchResult[0].interval).to.eql(data1.interval)
    expect(searchResult[1].interval).to.eql(data2.interval)
    expect(searchResult[2].interval).to.eql(firstDataToRemove.interval)
    expect(searchResult[3].interval).to.eql(secondDataToRemove.interval)

    let isRemoved = tree.remove(firstDataToRemove)
    expect(isRemoved).to.eql(true)

    searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(3)
    expect(searchResult[0].interval).to.eql(data1.interval)
    expect(searchResult[1].interval).to.eql(data2.interval)
    expect(searchResult[2].interval).to.eql(secondDataToRemove.interval)

    isRemoved = tree.remove(secondDataToRemove)
    expect(isRemoved).to.eql(true)

    searchResult = tree.search(searchData)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0].interval).to.eql(data1.interval)
    expect(searchResult[1].interval).to.eql(data2.interval)
  })

  it('should be sorted with in-order traversal', () => {
    const sorted = isSorted(randomTree)
    expect(sorted).to.eql(true)
  })

  it('should have highest `max` value in root node', () => {
    const highest = highestMaxValue(randomTree)
    expect(randomTree.root.max).to.eql(highest.max)
  })
})
