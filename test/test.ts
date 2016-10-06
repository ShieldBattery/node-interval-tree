import { expect } from 'chai'
import IntervalTree, { Node } from '../index'
import cuid = require('cuid')

const randomTree = new IntervalTree<string>()

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

for (let i = 1; i <= 100; i++) {
  let intervalLow = getRandomInt(0, 100)
  let intervalHigh = getRandomInt(0, 100)

  if (intervalHigh < intervalLow) {
    const temp = intervalHigh
    intervalHigh = intervalLow
    intervalLow = temp
  }

  randomTree.insert(intervalLow, intervalHigh, cuid())
}

function treeToArray<T>(currentNode: Node<T> | undefined, treeArray: Node<T>[]) {
  if (currentNode === undefined) {
    return
  }

  treeToArray(currentNode.left, treeArray)
  for (let i = 0; i < currentNode.records.length; i++) {
    treeArray.push(currentNode)
  }
  treeToArray(currentNode.right, treeArray)
}

function iteratorToArray<T>(it: Iterator<T>) {
  const acc: T[] = []
  let last = it.next()
  while (!last.done) {
    acc.push(last.value as T)
    last = it.next()
  }
  return acc
}

function isSorted<T>(tree: IntervalTree<T>) {
  const treeArray: Node<T>[] = []
  treeToArray(tree.root, treeArray)

  for (let i = 0; i < treeArray.length - 1; i++) {
    if (treeArray[i].key > treeArray[i + 1].key) {
      return false
    }
  }

  return true
}

function highestMaxValue<T>(tree: IntervalTree<T>): Node<T> {
  const treeArray: Node<T>[] = []
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
    const tree = new IntervalTree<string>()

    tree.insert(50, 100, 'data')

    const searchResult = tree.search(50, 100)
    expect(searchResult[0]).to.eql('data')
  })

  it('should correctly insert into a node with the same key', () => {
    const tree = new IntervalTree<string>()

    tree.insert(50, 150, 'data1')
    tree.insert(50, 100, 'data2')

    let searchResult = tree.search(75, 100)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0]).to.eql('data1')
    expect(searchResult[1]).to.eql('data2')

    searchResult = tree.search(125, 150)
    expect(searchResult.length).to.eql(1)
    expect(searchResult[0]).to.eql('data1')
  })

  it('should correctly insert into a left subtree', () => {
    const tree = new IntervalTree()

    tree.insert(50, 150, 'data1')
    tree.insert(25, 100, 'data2')

    const searchResult = tree.search(75, 100)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0]).to.eql('data2')
    expect(searchResult[1]).to.eql('data1')
  })

  it('should correctly insert into a right subtree', () => {
    const tree = new IntervalTree()

    tree.insert(50, 150, 'data1')
    tree.insert(75, 100, 'data2')

    const searchResult = tree.search(85, 100)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0]).to.eql('data1')
    expect(searchResult[1]).to.eql('data2')
  })

  it('should return an empty array when searching an empty tree', () => {
    const tree = new IntervalTree()

    const searchResult = tree.search(75, 150)
    expect(searchResult.length).to.eql(0)
  })

  it('should return false when trying to delete from an empty tree', () => {
    const tree = new IntervalTree()

    const isRemoved = tree.remove(50, 100)
    expect(isRemoved).to.eql(false)
  })

  it('should correctly delete the root node', () => {
    const tree = new IntervalTree()

    tree.insert(75, 150, 'data')

    const isRemoved = tree.remove(75, 150, 'data')
    expect(isRemoved).to.eql(true)
    expect(tree.root).to.eql(undefined)
  })

  it('should correctly delete the data object on a node with multiple data objects', () => {
    const tree = new IntervalTree()

    tree.insert(50, 120, 'data1')
    tree.insert(75, 100, 'data2')
    tree.insert(75, 200, 'firstDataToRemove')
    tree.insert(75, 150, 'secondDataToRemove')

    let searchResult = tree.search(50, 200)
    expect(searchResult.length).to.eql(4)
    expect(searchResult[0]).to.eql('data1')
    expect(searchResult[1]).to.eql('data2')
    expect(searchResult[2]).to.eql('firstDataToRemove')
    expect(searchResult[3]).to.eql('secondDataToRemove')

    let isRemoved = tree.remove(75, 200, 'firstDataToRemove')
    expect(isRemoved).to.eql(true)

    searchResult = tree.search(50, 200)
    expect(searchResult.length).to.eql(3)
    expect(searchResult[0]).to.eql('data1')
    expect(searchResult[1]).to.eql('data2')
    expect(searchResult[2]).to.eql('secondDataToRemove')

    isRemoved = tree.remove(75, 150, 'secondDataToRemove')
    expect(isRemoved).to.eql(true)

    searchResult = tree.search(50, 200)
    expect(searchResult.length).to.eql(2)
    expect(searchResult[0]).to.eql('data1')
    expect(searchResult[1]).to.eql('data2')
  })

  it('should be sorted with in-order traversal', () => {
    const sorted = isSorted(randomTree)
    expect(sorted).to.eql(true)
  })

  it('should have highest `max` value in root node', () => {
    const highest = highestMaxValue(randomTree)
    expect((randomTree.root as Node<string>).max).to.eql(highest.max)
  })

  describe('InOrder', () => {
    it('should traverse in order', () => {
      const tree = new IntervalTree<string>()

      const values: [number, number, string][] = [
        [50, 150, 'data1'],
        [75, 100, 'data2'],
        [40, 100, 'data3'],
        [60, 150, 'data4'],
        [80, 90, 'data5'],
      ]

      values.forEach((v) => tree.insert.apply(tree, v))

      const order = ['data3', 'data1', 'data4', 'data2', 'data5']
      const data = iteratorToArray(tree.inOrder()).map(v => v.data)
      expect(data).to.eql(order)
    })
  })

  describe('PreOrder', () => {
    it('should traverse pre order', () => {
      const tree = new IntervalTree<string>()

      const values: [number, number, string][] = [
        [50, 150, 'data1'],
        [75, 100, 'data2'],
        [40, 100, 'data3'],
        [60, 150, 'data4'],
        [80, 90, 'data5'],
      ]

      values.forEach((v) => tree.insert.apply(tree, v))

      const order = ['data1', 'data3', 'data2', 'data4', 'data5']
      const data = iteratorToArray(tree.preOrder()).map(v => v.data)
      expect(data).to.eql(order)
    })
  })
})
