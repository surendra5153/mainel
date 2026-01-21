// utils/leaderboardHeap.js

/**
 * Max-heap implementation optimized for top-k leaderboard queries.
 * Time complexity:
 *   - insert: O(log k)
 *   - peekTopK: O(k)
 *   - replace: O(log k)
 *   - size: O(1)
 *   - clear: O(1)
 * 
 * @class LeaderboardHeap
 */
class LeaderboardHeap {
  /**
   * @param {Function} keyFn - Function to extract numeric score from item: (item) => number
   * @param {number} maxSize - Optional max heap size for top-k optimization
   */
  constructor(keyFn = (item) => item.score, maxSize = Infinity) {
    if (typeof keyFn !== 'function') {
      throw new TypeError('keyFn must be a function');
    }
    this.keyFn = keyFn;
    this.maxSize = maxSize;
    this.heap = [];
  }

  /**
   * Insert an item into the heap.
   * If heap exceeds maxSize, smallest item is removed (min-heap behavior for top-k).
   * @param {*} item - Item to insert
   * @returns {void}
   * @complexity O(log k)
   */
  insert(item) {
    if (this.heap.length < this.maxSize) {
      this.heap.push(item);
      this._bubbleUp(this.heap.length - 1);
    } else if (this.heap.length > 0) {
      const score = this.keyFn(item);
      const minScore = this.keyFn(this.heap[0]);
      if (score > minScore) {
        this.heap[0] = item;
        this._bubbleDown(0);
      }
    }
  }

  /**
   * Peek at top-k items without removing them.
   * Returns items sorted by score descending.
   * @param {number} k - Number of top items to retrieve
   * @returns {Array} Top k items
   * @complexity O(k log k)
   */
  peekTopK(k = this.heap.length) {
    const count = Math.min(k, this.heap.length);
    if (count === 0) return [];
    
    const sorted = [...this.heap].sort((a, b) => this.keyFn(b) - this.keyFn(a));
    return sorted.slice(0, count);
  }

  /**
   * Replace an item matching predicate with a new item.
   * @param {Function} predicate - Function to match item: (item) => boolean
   * @param {*} newItem - New item to insert
   * @returns {boolean} True if replacement occurred
   * @complexity O(n + log k) where n is heap size
   */
  replace(predicate, newItem) {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return false;

    const oldScore = this.keyFn(this.heap[index]);
    const newScore = this.keyFn(newItem);
    
    this.heap[index] = newItem;
    
    if (newScore > oldScore) {
      this._bubbleUp(index);
    } else if (newScore < oldScore) {
      this._bubbleDown(index);
    }
    
    return true;
  }

  /**
   * Get current heap size.
   * @returns {number}
   * @complexity O(1)
   */
  size() {
    return this.heap.length;
  }

  /**
   * Clear all items from heap.
   * @returns {void}
   * @complexity O(1)
   */
  clear() {
    this.heap = [];
  }

  /**
   * Bubble up element at index to maintain heap property (max-heap).
   * @private
   * @param {number} index
   */
  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.keyFn(this.heap[index]) <= this.keyFn(this.heap[parentIndex])) {
        break;
      }
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  /**
   * Bubble down element at index to maintain heap property (max-heap).
   * @private
   * @param {number} index
   */
  _bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.keyFn(this.heap[leftChild]) > this.keyFn(this.heap[largest])) {
        largest = leftChild;
      }
      if (rightChild < length && this.keyFn(this.heap[rightChild]) > this.keyFn(this.heap[largest])) {
        largest = rightChild;
      }
      if (largest === index) break;

      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }
}

/**
 * Factory function to create a leaderboard heap.
 * @param {Function} keyFn - Score extraction function
 * @param {number} maxSize - Maximum heap size
 * @returns {LeaderboardHeap}
 */
function createLeaderboardHeap(keyFn, maxSize) {
  return new LeaderboardHeap(keyFn, maxSize);
}

module.exports = { LeaderboardHeap, createLeaderboardHeap };
