// An augmented AVL Tree where each node maintains a list of records and their search intervals.
// Record is composed of an interval and its underlying data, sent by a client. This allows the
// interval tree to have the same interval inserted multiple times, as long its data is different.
// Both insertion and deletion require O(log n) time. Searching requires O(k*logn) time, where `k`
// is the number of intervals in the output list.

import isSame = require('immutable-is')

export class Interval {
  constructor(public low: number, public high: number) {
    if (low > high) {
      throw new Error('`low` value must be lower or equal to `high` value')
    }
  }
}

export class Record {
  constructor(public interval: Interval, public data: any) {
  }
}

function height(node?: Node) {
  if (node === undefined) {
    return -1
  } else {
    return node.height
  }
}

export class Node {
  public key: number
  public max: number
  public records: Record[] = []
  public parent?: Node
  public height = 0
  public left?: Node
  public right?: Node

  public static overlappingRecords: any[]


  constructor(public intervalTree: IntervalTree, record: Record) {
    this.key = record.interval.low
    this.max = record.interval.high

    // Save the array of all records with the same key for this node
    this.records.push(record)

    // Save the results of search in a static variable
    Node.overlappingRecords = []
  }

  // Gets the highest record.interval.high value for this node
  public getNodeHigh() {
    let high = this.records[0].interval.high

    for (let i = 1; i < this.records.length; i++) {
      if (this.records[i].interval.high > high) {
        high = this.records[i].interval.high
      }
    }

    return high
  }

  // Updates height value of the node. Called during insertion, rebalance, removal
  public updateHeight() {
    this.height = Math.max(height(this.left), height(this.right)) + 1
  }

  // Updates the max value of all the parents after inserting into already existing node, as well as
  // removing the node completely or removing the record of an already existing node. Starts with
  // the parent of an affected node and bubbles up to root
  public updateMaxOfParents() {
    if (this === undefined) {
      return
    }

    const thisHigh = this.getNodeHigh()
    if (this.left !== undefined && this.right !== undefined) {
      this.max = Math.max(Math.max(this.left.max, this.right.max), thisHigh)
    } else if (this.left !== undefined && this.right === undefined) {
      this.max = Math.max(this.left.max, thisHigh)
    } else if (this.left === undefined && this.right !== undefined) {
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
  private _updateMaxAfterRightRotate() {
    const parent = this.parent as Node
    const left = parent.left as Node
    // Update max of left sibling (x in first case, y in second)
    const thisParentLeftHigh = left.getNodeHigh()
    if (left.left === undefined && left.right !== undefined) {
      left.max = Math.max(thisParentLeftHigh, left.right.max)
    } else if (left.left !== undefined && left.right === undefined) {
      left.max = Math.max(thisParentLeftHigh, left.left.max)
    } else if (left.left === undefined && left.right === undefined) {
      left.max = thisParentLeftHigh
    } else {
      left.max = Math.max(Math.max((left.left as Node).max,
          (left.right as Node).max), thisParentLeftHigh)
    }

    // Update max of itself (z)
    const thisHigh = this.getNodeHigh()
    if (this.left === undefined && this.right !== undefined) {
      this.max = Math.max(thisHigh, this.right.max)
    } else if (this.left !== undefined && this.right === undefined) {
      this.max = Math.max(thisHigh, this.left.max)
    } else if (this.left === undefined && this.right === undefined) {
      this.max = thisHigh
    } else {
      this.max = Math.max(Math.max((this.left as Node).max, (this.right as Node).max), thisHigh)
    }

    // Update max of parent (y in first case, x in second)
    parent.max = Math.max(Math.max((parent.left as Node).max, (parent.right as Node).max),
        parent.getNodeHigh())
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
  private _updateMaxAfterLeftRotate() {
    const parent = this.parent as Node
    const right = parent.right as Node
    // Update max of right sibling (x in first case, y in second)
    const thisParentRightHigh = right.getNodeHigh()
    if (right.left === undefined && right.right !== undefined) {
      right.max = Math.max(thisParentRightHigh, (right.right as Node).max)
    } else if (right.left !== undefined && right.right === undefined) {
      right.max = Math.max(thisParentRightHigh, (right.left as Node).max)
    } else if (right.left === undefined && right.right === undefined) {
      right.max = thisParentRightHigh
    } else {
      right.max = Math.max(Math.max((right.left as Node).max,
          (right.right as Node).max), thisParentRightHigh)
    }

    // Update max of itself (z)
    const thisHigh = this.getNodeHigh()
    if (this.left === undefined && this.right !== undefined) {
      this.max = Math.max(thisHigh, (this.right as Node).max)
    } else if (this.left !== undefined && this.right === undefined) {
      this.max = Math.max(thisHigh, (this.left as Node).max)
    } else if (this.left === undefined && this.right === undefined) {
      this.max = thisHigh
    } else {
      this.max = Math.max(Math.max((this.left as Node).max, (this.right as Node).max), thisHigh)
    }

    // Update max of parent (y in first case, x in second)
    parent.max = Math.max(Math.max((parent.left as Node).max, right.max),
        parent.getNodeHigh())
  }

  private _leftRotate() {
    const rightChild = this.right as Node
    rightChild.parent = this.parent

    if (rightChild.parent === undefined) {
      this.intervalTree.root = rightChild
    } else {
      if ((rightChild.parent as Node).left === this) {
        (rightChild.parent as Node).left = rightChild
      } else if ((rightChild.parent as Node).right === this) {
        (rightChild.parent as Node).right = rightChild
      }
    }

    this.right = rightChild.left
    if (this.right !== undefined) {
      this.right.parent = this
    }
    rightChild.left = this
    this.parent = rightChild
    this.updateHeight()
    rightChild.updateHeight()
  }

  private _rightRotate() {
    const leftChild = this.left as Node
    leftChild.parent = this.parent

    if (leftChild.parent === undefined) {
      this.intervalTree.root = leftChild
    } else {
      if (leftChild.parent.left === this) {
        leftChild.parent.left = leftChild
      } else if (leftChild.parent.right === this) {
        leftChild.parent.right = leftChild
      }
    }

    this.left = leftChild.right
    if (this.left !== undefined) {
      this.left.parent = this
    }
    leftChild.right = this
    this.parent = leftChild
    this.updateHeight()
    leftChild.updateHeight()
  }

   // Rebalances the tree if the height value between two nodes of the same parent is greater than
  // two. There are 4 cases that can happen which are outlined in the graphics above
  private _rebalance() {
    if (height(this.left) >= 2 + height(this.right)) {
      const left = this.left as Node
      if (height(left.left) >= height(left.right)) {
        // Left-Left case
        this._rightRotate()
        this._updateMaxAfterRightRotate()
      } else {
        // Left-Right case
        left._leftRotate()
        this._rightRotate()
        this._updateMaxAfterRightRotate()
      }
    } else if (height(this.right) >= 2 + height(this.left)) {
      const right = this.right as Node
      if (height(right.right) >= height(right.left)) {
        // Right-Right case
        this._leftRotate()
        this._updateMaxAfterLeftRotate()
      } else {
        // Right-Left case
        right._rightRotate()
        this._leftRotate()
        this._updateMaxAfterLeftRotate()
      }
    }
  }

  public insert(record: Record) {
    if (record.interval.low < this.key) {
      // Insert into left subtree
      if (this.left === undefined) {
        this.left = new Node(this.intervalTree, record)
        this.left.parent = this
      } else {
        this.left.insert(record)
      }
    } else {
      // Insert into right subtree
      if (this.right === undefined) {
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


  private _getOverlappingRecords(currentNode: Node, low: number, high: number) {
    if (currentNode.key <= high && low <= currentNode.getNodeHigh()) {
      // Nodes are overlapping, check if individual records in the node are overlapping
      const tempResults: any[] = []
      for (let i = 0; i < currentNode.records.length; i++) {
        if (currentNode.records[i].interval.high >= low) {
          tempResults.push(currentNode.records[i].data)
        }
      }
      return tempResults
    }
    return undefined
  }

  public search(low: number, high: number) {
    // Don't search nodes that don't exist
    if (this === undefined) {
      return Node.overlappingRecords
    }

    // If interval is to the right of the rightmost point of any interval in this node and all its
    // children, there won't be any matches
    if (low > this.max) {
      return Node.overlappingRecords
    }

    // Search left children
    if (this.left !== undefined && this.left.max >= low) {
      this.left.search(low, high)
    }

    // Check this node
    const tempResults = this._getOverlappingRecords(this, low, high)
    if (tempResults !== undefined) {
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
    if (this.right !== undefined) {
      this.right.search(low, high)
    }

    // Return accumulated results, if any
    return Node.overlappingRecords
  }

  // Searches for a node by a `key` value
  public searchExisting(low: number): Node | undefined {
    if (this === undefined) {
      return undefined
    }

    if (this.key === low) {
      return this
    } else if (low < this.key) {
      if (this.left !== undefined) {
        return this.left.searchExisting(low)
      }
    } else {
      if (this.right !== undefined) {
        return this.right.searchExisting(low)
      }
    }

    return undefined
  }

  // Returns the smallest node of the subtree
  private _minValue(): Node {
    if (this.left === undefined) {
      return this
    } else {
      return this.left._minValue()
    }
  }

  public remove(node: Node): Node | undefined {
    const parent = this.parent as Node

    if (node.key < this.key) {
      // Node to be removed is on the left side
      if (this.left !== undefined) {
        return this.left.remove(node)
      } else {
        return undefined
      }
    } else if (node.key > this.key) {
      // Node to be removed is on the right side
      if (this.right !== undefined) {
        return this.right.remove(node)
      } else {
        return undefined
      }
    } else {
      if (this.left !== undefined && this.right !== undefined) {
        // Node has two children
        const minValue = this.right._minValue()
        this.key = minValue.key
        this.records = minValue.records
        return this.right.remove(this)
      } else if (parent.left === this) {
        // One child or no child case on left side
        if (this.right !== undefined) {
          parent.left = this.right
          this.right.parent = parent
        } else {
          parent.left = this.left
          if (this.left !== undefined) {
            this.left.parent = parent
          }
        }
        parent.updateMaxOfParents()
        parent.updateHeight()
        parent._rebalance()
        return this
      } else if (parent.right === this) {
        // One child or no child case on right side
        if (this.right !== undefined) {
          parent.right = this.right
          this.right.parent = parent
        } else {
          parent.right = this.left
          if (this.left !== undefined) {
            this.left.parent = parent
          }
        }
        parent.updateMaxOfParents()
        parent.updateHeight()
        parent._rebalance()
        return this
      }
    }
  }
}

export default class IntervalTree {
  public root?: Node
  public count = 0

  public insert(low: number, high: number, data?: any) {
    const interval = new Interval(low, high)
    const record = new Record(interval, data)

    if (this.root === undefined) {
      // Base case: Tree is empty, new node becomes root
      this.root = new Node(this, record)
      this.count++
      return true
    } else {
      // Otherwise, check if node already exists with the same key
      const node = this.root.searchExisting(low)
      if (node !== undefined) {
        // Check the records in this node if there already is the one with same low, high, data
        for (let i = 0; i < node.records.length; i++) {
          if (node.records[i].interval.high === high && isSame(node.records[i].data, data)) {
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

  public search(low: number, high: number) {
    if (this.root === undefined) {
      // Tree is empty; return empty array
      return []
    } else {
      if (Node.overlappingRecords.length > 0) {
        Node.overlappingRecords.length = 0
      }
      return this.root.search(low, high)
    }
  }

  public remove(low: number, high: number, data?: any) {
    if (this.root === undefined) {
      // Tree is empty; nothing to remove
      return false
    } else {
      const node = this.root.searchExisting(low)
      if (node === undefined) {
        return false
      } else if (node.records.length > 1) {
        let removedRecord: Record | undefined
        // Node with this key has 2 or more records. Find the one we need and remove it
        for (let i = 0; i < node.records.length; i++) {
          if (node.records[i].interval.high === high && isSame(node.records[i].data, data)) {
            removedRecord = node.records[i]
            node.records.splice(i, 1)
            break
          }
        }

        if (removedRecord) {
          removedRecord = undefined
          // Update max of that node and its parents if necessary
          if (high === node.max) {
            const nodeHigh = node.getNodeHigh()
            if (node.left !== undefined && node.right !== undefined) {
              node.max = Math.max(Math.max(node.left.max, node.right.max), nodeHigh)
            } else if (node.left !== undefined && node.right === undefined) {
              node.max = Math.max(node.left.max, nodeHigh)
            } else if (node.left === undefined && node.right !== undefined) {
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
        if (node.records[0].interval.high === high && isSame(node.records[0].data, data)) {
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
            if (this.root !== undefined) {
              this.root.parent = undefined
            }
            if (removedNode) {
              removedNode = undefined
              this.count--
              return true
            } else {
              return false
            }
          } else {
            let removedNode = this.root.remove(node)
            if (removedNode) {
              removedNode = undefined
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

  public * preOrder(currentNode?: Node): Iterable<Node> {
    if (currentNode === undefined) {
      return
    }

    for (let i = 0; i < currentNode.records.length; i++) {
      yield currentNode.records[i].data
    }
    yield* this.preOrder(currentNode.left)
    yield* this.preOrder(currentNode.right)
  }

  public * inOrder(currentNode?: Node): Iterable<Node> {
    if (currentNode === undefined) {
      return
    }

    yield* this.inOrder(currentNode.left)

    for (let i = 0; i < currentNode.records.length; i++) {
      yield currentNode.records[i].data
    }

    yield* this.inOrder(currentNode.right)
  }
}
