// An augmented AVL Tree where each node maintains a list of records and their search intervals.
// Record is composed of an interval and its underlying data, sent by a client. This allows the
// interval tree to have the same interval inserted multiple times, as long its data is different.
// Both insertion and deletion require O(log n) time. Searching requires O(k*logn) time, where `k`
// is the number of intervals in the output list.

import is from 'immutable-is'

class Interval {
  constructor(low, high) {
    if (typeof parseInt(low, 10) !== 'number' || typeof parseInt(high, 10) !== 'number') {
      throw new Error('`low` and `high` values must be a number')
    }
    if (low > high) {
      throw new Error('`low` value must be lower or equal to `high` value')
    }
    this.low = low
    this.high = high
  }
}

class Record {
  constructor(interval, data) {
    this.interval = interval
    this.data = data
  }
}

function height(node) {
  if (node === null) {
    return -1
  } else {
    return node.height
  }
}

class Node {
  constructor(intervalTree, record) {
    this.intervalTree = intervalTree
    this.key = record.interval.low
    this.max = record.interval.high

    // Save the array of all records with the same key for this node
    this.records = []
    this.records.push(record)

    this.parent = null
    this.height = 0
    this.left = null
    this.right = null

    // Save the results of search in a static variable
    Node.overlappingRecords = []
  }

  // Gets the highest record.interval.high value for this node
  getNodeHigh() {
    let high = this.records[0].interval.high

    for (let i = 1; i < this.records.length; i++) {
      if (this.records[i].interval.high > high) {
        high = this.records[i].interval.high
      }
    }

    return high
  }

  // Updates height value of the node. Called during insertion, rebalance, removal
  updateHeight() {
    this.height = Math.max(height(this.left), height(this.right)) + 1
  }

  // Updates the max value of all the parents after inserting into already existing node, as well as
  // removing the node completely or removing the record of an already existing node. Starts with
  // the parent of an affected node and bubbles up to root
  updateMaxOfParents() {
    if (this === null) {
      return
    }

    const thisHigh = this.getNodeHigh()
    if (this.left !== null && this.right !== null) {
      this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh)
    } else if (this.left !== null && this.right === null) {
      this.max = Math.max(this.left.max, thisHigh)
    } else if (this.left === null && this.right !== null) {
      this.max = Math.max(this.right.max, thisHigh)
    } else {
      this.max = thisHigh
    }

    if (this.parent) {
      this.parent.updateMaxOfParents()
    }
  }


  /*
  Left-Left case:

         z                                      y
        / \                                   /   \
       y   T4      Right Rotate (z)          x     z
      / \          - - - - - - - - ->       / \   / \
     x   T3                                T1 T2 T3 T4
    / \
  T1   T2

  Left-Right case:

       z                               z                           x
      / \                             / \                        /   \
     y   T4  Left Rotate (y)         x  T4  Right Rotate(z)     y     z
    / \      - - - - - - - - ->     / \      - - - - - - - ->  / \   / \
  T1   x                           y  T3                      T1 T2 T3 T4
      / \                         / \
    T2   T3                      T1 T2
  */

  // Handles Left-Left case and Left-Right case after rebalancing AVL tree
  _updateMaxAfterRightRotate() {
    // Update max of left sibling (x in first case, y in second)
    const thisParentLeftHigh = this.parent.left.getNodeHigh()
    if (this.parent.left.left === null && this.parent.left.right !== null) {
      this.parent.left.max = Math.max(thisParentLeftHigh, this.parent.left.right.max)
    } else if (this.parent.left.left !== null && this.parent.left.right === null) {
      this.parent.left.max = Math.max(thisParentLeftHigh, this.parent.left.left.max)
    } else if (this.parent.left.left === null && this.parent.left.right === null) {
      this.parent.left.max = thisParentLeftHigh
    } else {
      this.parent.left.max = Math.max(Math.max(this.parent.left.left.max,
          this.parent.left.right.max), thisParentLeftHigh)
    }

    // Update max of itself (z)
    const thisHigh = this.getNodeHigh()
    if (this.left === null && this.right !== null) {
      this.max = Math.max(thisHigh, this.right.max)
    } else if (this.left !== null && this.right === null) {
      this.max = Math.max(thisHigh, this.left.max)
    } else if (this.left === null && this.right === null) {
      this.max = thisHigh
    } else {
      this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh)
    }

    // Update max of parent (y in first case, x in second)
    this.parent.max = Math.max(Math.max(this.parent.left.max, this.parent.right.max),
        this.parent.getNodeHigh())
  }

  /*
  Right-Right case:

    z                               y
   / \                            /   \
  T1  y     Left Rotate(z)       z     x
     / \   - - - - - - - ->     / \   / \
    T2  x                      T1 T2 T3 T4
       / \
      T3 T4

  Right-Left case:

     z                            z                            x
    / \                          / \                         /   \
   T1  y   Right Rotate (y)     T1  x      Left Rotate(z)   z     y
      / \  - - - - - - - - ->      / \   - - - - - - - ->  / \   / \
     x  T4                        T2  y                   T1 T2 T3 T4
    / \                              / \
  T2   T3                           T3 T4
  */

  // Handles Right-Right case and Right-Left case in rebalancing AVL tree
  _updateMaxAfterLeftRotate() {
    // Update max of right sibling (x in first case, y in second)
    const thisParentRightHigh = this.parent.right.getNodeHigh()
    if (this.parent.right.left === null && this.parent.right.right !== null) {
      this.parent.right.max = Math.max(thisParentRightHigh, this.parent.right.right.max)
    } else if (this.parent.right.left !== null && this.parent.right.right === null) {
      this.parent.right.max = Math.max(thisParentRightHigh, this.parent.right.left.max)
    } else if (this.parent.right.left === null && this.parent.right.right === null) {
      this.parent.right.max = thisParentRightHigh
    } else {
      this.parent.right.max = Math.max(Math.max(this.parent.right.left.max,
          this.parent.right.right.max), thisParentRightHigh)
    }

    // Update max of itself (z)
    const thisHigh = this.getNodeHigh()
    if (this.left === null && this.right !== null) {
      this.max = Math.max(thisHigh, this.right.max)
    } else if (this.left !== null && this.right === null) {
      this.max = Math.max(thisHigh, this.left.max)
    } else if (this.left === null && this.right === null) {
      this.max = thisHigh
    } else {
      this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh)
    }

    // Update max of parent (y in first case, x in second)
    this.parent.max = Math.max(Math.max(this.parent.left.max, this.parent.right.max),
        this.parent.getNodeHigh())
  }

  _leftRotate() {
    const rightChild = this.right
    rightChild.parent = this.parent

    if (rightChild.parent === null) {
      this.intervalTree.root = rightChild
    } else {
      if (rightChild.parent.left === this) {
        rightChild.parent.left = rightChild
      } else if (rightChild.parent.right === this) {
        rightChild.parent.right = rightChild
      }
    }

    this.right = rightChild.left
    if (this.right !== null) {
      this.right.parent = this
    }
    rightChild.left = this
    this.parent = rightChild
    this.updateHeight()
    rightChild.updateHeight()
  }

  _rightRotate() {
    const leftChild = this.left
    leftChild.parent = this.parent

    if (leftChild.parent === null) {
      this.intervalTree.root = leftChild
    } else {
      if (leftChild.parent.left === this) {
        leftChild.parent.left = leftChild
      } else if (leftChild.parent.right === this) {
        leftChild.parent.right = leftChild
      }
    }

    this.left = leftChild.right
    if (this.left !== null) {
      this.left.parent = this
    }
    leftChild.right = this
    this.parent = leftChild
    this.updateHeight()
    leftChild.updateHeight()
  }

  // Rebalances the tree if the height value between two nodes of the same parent is greater than
  // two. There are 4 cases that can happen which are outlined in the graphics above
  _rebalance() {
    if (height(this.left) >= 2 + height(this.right)) {
      if (height(this.left.left) >= height(this.left.right)) {
        // Left-Left case
        this._rightRotate()
        this._updateMaxAfterRightRotate()
      } else {
        // Left-Right case
        this.left._leftRotate()
        this._rightRotate()
        this._updateMaxAfterRightRotate()
      }
    } else if (height(this.right) >= 2 + height(this.left)) {
      if (height(this.right.right) >= height(this.right.left)) {
        // Right-Right case
        this._leftRotate()
        this._updateMaxAfterLeftRotate()
      } else {
        // Right-Left case
        this.right._rightRotate()
        this._leftRotate()
        this._updateMaxAfterLeftRotate()
      }
    }
  }

  insert(record) {
    if (record.interval.low < this.key) {
      // Insert into left subtree
      if (this.left === null) {
        this.left = new Node(this.intervalTree, record)
        this.left.parent = this
      } else {
        this.left.insert(record)
      }
    } else {
      // Insert into right subtree
      if (this.right === null) {
        this.right = new Node(this.intervalTree, record)
        this.right.parent = this
      } else {
        this.right.insert(record)
      }
    }

    // Update the max value of this ancestor if needed
    if (this.max < record.interval.high) {
      this.max = record.interval.high
    }

    // Update height of each node
    this.updateHeight()

    // Rebalance the tree to ensure all operations are executed in O(logn) time. This is especially
    // important in searching, as the tree has a high chance of degenerating without the rebalancing
    this._rebalance()
  }

  _getOverlappingRecords(currentNode, low, high) {
    if (currentNode.key <= high && low <= currentNode.getNodeHigh()) {
      // Nodes are overlapping, check if individual records in the node are overlapping
      const tempResults = []
      for (let i = 0; i < currentNode.records.length; i++) {
        if (currentNode.records[i].interval.high >= low) {
          tempResults.push(currentNode.records[i].data)
        }
      }
      return tempResults
    }
    return null
  }

  search(low, high) {
    // Don't search nodes that don't exist
    if (this === null) {
      return Node.overlappingRecords
    }

    // If interval is to the right of the rightmost point of any interval in this node and all its
    // children, there won't be any matches
    if (low > this.max) {
      return Node.overlappingRecords
    }

    // Search left children
    if (this.left !== null && this.left.max >= low) {
      this.left.search(low, high)
    }

    // Check this node
    const tempResults = this._getOverlappingRecords(this, low, high)
    if (tempResults !== null) {
      // Add overlapping records from this node to already existing, if any, overlapping records
      for (let i = 0; i < tempResults.length; i++) {
        Node.overlappingRecords.push(tempResults[i])
      }
    }

    // If interval is to the left of the start of this interval, then it can't be in any child to
    // the right
    if (high < this.key) {
      return Node.overlappingRecords
    }

    // Otherwise, search right children
    if (this.right !== null) {
      this.right.search(low, high)
    }

    // Return accumulated results, if any
    return Node.overlappingRecords
  }

  // Searches for a node by a `key` value
  searchExisting(low) {
    if (this === null) {
      return null
    }

    if (this.key === low) {
      return this
    } else if (low < this.key) {
      if (this.left !== null) {
        return this.left.searchExisting(low)
      }
    } else {
      if (this.right !== null) {
        return this.right.searchExisting(low)
      }
    }

    return null
  }

  // Returns the smallest node of the subtree
  _minValue() {
    if (this.left === null) {
      return this
    } else {
      return this.left._minValue()
    }
  }

  remove(node) {
    if (node.key < this.key) {
      // Node to be removed is on the left side
      if (this.left !== null) {
        return this.left.remove(node)
      } else {
        return null
      }
    } else if (node.key > this.key) {
      // Node to be removed is on the right side
      if (this.right !== null) {
        return this.right.remove(node)
      } else {
        return null
      }
    } else {
      if (this.left !== null && this.right !== null) {
        // Node has two children
        const minValue = this.right._minValue()
        this.key = minValue.key
        this.records = minValue.records
        return this.right.remove(this)
      } else if (this.parent.left === this) {
        // One child or no child case on left side
        if (this.right !== null) {
          this.parent.left = this.right
          this.right.parent = this.parent
        } else {
          this.parent.left = this.left
          if (this.parent.left !== null) {
            this.left.parent = this.parent
          }
        }
        this.parent.updateMaxOfParents()
        this.parent.updateHeight()
        this.parent._rebalance()
        return this
      } else if (this.parent.right === this) {
        // One child or no child case on right side
        if (this.right !== null) {
          this.parent.right = this.right
          this.right.parent = this.parent
        } else {
          this.parent.right = this.left
          if (this.parent.right !== null) {
            this.left.parent = this.parent
          }
        }
        this.parent.updateMaxOfParents()
        this.parent.updateHeight()
        this.parent._rebalance()
        return this
      }
    }
  }
}

export default class IntervalTree {
  constructor() {
    this.root = null
    this.count = 0
  }

  insert(low, high, data) {
    const interval = new Interval(low, high)
    const record = new Record(interval, data)

    if (this.root === null) {
      // Base case: Tree is empty, new node becomes root
      this.root = new Node(this, record)
      this.count++
      return true
    } else {
      // Otherwise, check if node already exists with the same key
      const node = this.root.searchExisting(low)
      if (node !== null) {
        // Check the records in this node if there already is the one with same low, high, data
        for (let i = 0; i < node.records.length; i++) {
          if (node.records[i].interval.high === high && is(node.records[i].data, data)) {
            // This record is same as the one we're trying to insert; return false to indicate
            // nothing has been inserted
            return false
          }
        }

        // Add the record to the node
        node.records.push(record)

        // Update max of the node and its parents if necessary
        if (high > node.max) {
          node.max = high
          if (node.parent) {
            node.parent.updateMaxOfParents()
          }
        }
        this.count++
        return true
      } else {
        // Node with this key doesn't already exist. Call insert function on root's node
        this.root.insert(record)
        this.count++
        return true
      }
    }
  }

  search(low, high) {
    if (this.root === null) {
      // Tree is empty; return empty array
      return []
    } else {
      if (Node.overlappingRecords.length > 0) {
        Node.overlappingRecords.length = 0
      }
      return this.root.search(low, high)
    }
  }

  remove(low, high, data) {
    if (this.root === null) {
      // Tree is empty; nothing to remove
      return false
    } else {
      const node = this.root.searchExisting(low)
      if (node === null) {
        return false
      } else if (node.records.length > 1) {
        let removedRecord
        // Node with this key has 2 or more records. Find the one we need and remove it
        for (let i = 0; i < node.records.length; i++) {
          if (node.records[i].interval.high === high && is(node.records[i].data, data)) {
            removedRecord = node.records[i]
            node.records.splice(i, 1)
            break
          }
        }

        if (removedRecord) {
          removedRecord = null
          // Update max of that node and its parents if necessary
          if (high === node.max) {
            const nodeHigh = node.getNodeHigh()
            if (node.left !== null && node.right !== null) {
              node.max = Math.max(Math.max(node.left.max, node.right.max), nodeHigh)
            } else if (node.left !== null && node.right === null) {
              node.max = Math.max(node.left.max, nodeHigh)
            } else if (node.left === null && node.right !== null) {
              node.max = Math.max(node.right.max, nodeHigh)
            } else {
              node.max = nodeHigh
            }
            if (node.parent) {
              node.parent.updateMaxOfParents()
            }
          }
          this.count--
          return true
        } else {
          return false
        }
      } else if (node.records.length === 1) {
        // Node with this key has only 1 record. Check if the remaining record in this node is
        // actually the one we want to remove
        if (node.records[0].interval.high === high && is(node.records[0].data, data)) {
          // The remaining record is the one we want to remove. Remove the whole node from the tree
          if (this.root.key === node.key) {
            // We're removing the root element. Create a dummy node that will temporarily take
            // root's parent role
            const interval = new Interval(low, high)
            const record = new Record(interval, data)
            const rootParent = new Node(this, record)
            rootParent.left = this.root
            this.root.parent = rootParent
            let removedNode = this.root.remove(node)
            this.root = rootParent.left
            if (this.root !== null) {
              this.root.parent = null
            }
            if (removedNode) {
              removedNode = null
              this.count--
              return true
            } else {
              return false
            }
          } else {
            let removedNode = this.root.remove(node)
            if (removedNode) {
              removedNode = null
              this.count--
              return true
            } else {
              return false
            }
          }
        } else {
          // The remaining record is not the one we want to remove
          return false
        }
      } else {
        // No records at all in this node?! Shouldn't happen
        return false
      }
    }
  }

  preOrder(currentNode) {
    if (currentNode === null) {
      return
    }

    for (let i = 0; i < currentNode.records.length; i++) {
      console.log('[' + currentNode.key + ', ' + currentNode.records[i].interval.high +
          '] max =', currentNode.max, 'height =', currentNode.height,
          'count =', currentNode.records.length)
    }
    this.preOrder(currentNode.left)
    this.preOrder(currentNode.right)
  }

  inOrder(currentNode) {
    if (currentNode === null) {
      return
    }

    this.inOrder(currentNode.left)

    for (let i = 0; i < currentNode.data.length; i++) {
      console.log('[' + currentNode.key + ', ' + currentNode.records[i].interval.high +
          '] max =', currentNode.max, 'height =', currentNode.height,
          'count =', currentNode.records.length)
    }

    this.inOrder(currentNode.right)
  }
}
