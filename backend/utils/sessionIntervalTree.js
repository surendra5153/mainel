// utils/sessionIntervalTree.js

/**
 * Interval tree node for schedule conflict detection.
 * @private
 */
class IntervalNode {
  constructor(interval) {
    this.interval = interval;
    this.max = interval.end;
    this.left = null;
    this.right = null;
  }
}

/**
 * Interval tree for efficient session scheduling and overlap detection.
 * Intervals represent sessions: { id, start: Date, end: Date, mentorId, studentId, ...metadata }
 * Time complexity:
 *   - insert: O(log n)
 *   - build: O(n log n)
 *   - findOverlaps: O(log n + k) where k is number of overlaps
 * 
 * @class SessionIntervalTree
 */
class SessionIntervalTree {
  constructor() {
    this.root = null;
    this.intervals = [];
  }

  /**
   * Validate interval object structure and types.
   * @private
   * @param {Object} interval
   * @throws {Error} If interval is invalid
   */
  _validateInterval(interval) {
    if (!interval || typeof interval !== 'object') {
      throw new TypeError('Interval must be an object');
    }
    if (!interval.id) {
      throw new Error('Interval must have an id');
    }
    if (!(interval.start instanceof Date) || !(interval.end instanceof Date)) {
      throw new TypeError('Interval start and end must be Date objects');
    }
    if (interval.start >= interval.end) {
      throw new Error('Interval start must be before end');
    }
  }

  /**
   * Insert a single interval into the tree.
   * @param {Object} interval - Session interval object
   * @returns {void}
   * @complexity O(log n)
   */
  insert(interval) {
    this._validateInterval(interval);
    
    const normalizedInterval = {
      ...interval,
      start: new Date(interval.start),
      end: new Date(interval.end)
    };
    
    this.intervals.push(normalizedInterval);
    this.root = this._insertNode(this.root, normalizedInterval);
  }

  /**
   * Build tree from array of intervals (more efficient than sequential inserts).
   * @param {Array<Object>} intervalsArray - Array of interval objects
   * @returns {void}
   * @complexity O(n log n)
   */
  build(intervalsArray) {
    if (!Array.isArray(intervalsArray)) {
      throw new TypeError('intervalsArray must be an array');
    }

    this.root = null;
    this.intervals = [];

    const sorted = intervalsArray
      .map(interval => {
        this._validateInterval(interval);
        return {
          ...interval,
          start: new Date(interval.start),
          end: new Date(interval.end)
        };
      })
      .sort((a, b) => a.start - b.start);

    this.intervals = sorted;
    this.root = this._buildBalanced(sorted, 0, sorted.length - 1);
  }

  /**
   * Find all intervals that overlap with the query interval.
   * @param {Object} queryInterval - Interval to check for overlaps
   * @returns {Array<Object>} Array of overlapping intervals with full session data
   * @complexity O(log n + k) where k is number of overlaps
   */
  findOverlaps(queryInterval) {
    this._validateInterval(queryInterval);
    
    const query = {
      start: new Date(queryInterval.start),
      end: new Date(queryInterval.end)
    };
    
    const overlaps = [];
    this._searchOverlaps(this.root, query, overlaps);
    return overlaps;
  }

  /**
   * Check if two intervals overlap.
   * @private
   * @param {Object} a - First interval
   * @param {Object} b - Second interval
   * @returns {boolean}
   */
  _overlaps(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  /**
   * Insert node into tree (recursive).
   * @private
   * @param {IntervalNode|null} node
   * @param {Object} interval
   * @returns {IntervalNode}
   */
  _insertNode(node, interval) {
    if (!node) {
      return new IntervalNode(interval);
    }

    if (interval.start < node.interval.start) {
      node.left = this._insertNode(node.left, interval);
    } else {
      node.right = this._insertNode(node.right, interval);
    }

    if (node.max < interval.end) {
      node.max = interval.end;
    }

    return node;
  }

  /**
   * Build balanced tree from sorted array (recursive).
   * @private
   * @param {Array} sortedIntervals
   * @param {number} start
   * @param {number} end
   * @returns {IntervalNode|null}
   */
  _buildBalanced(sortedIntervals, start, end) {
    if (start > end) return null;

    const mid = Math.floor((start + end) / 2);
    const node = new IntervalNode(sortedIntervals[mid]);

    node.left = this._buildBalanced(sortedIntervals, start, mid - 1);
    node.right = this._buildBalanced(sortedIntervals, mid + 1, end);

    node.max = sortedIntervals[mid].end;
    if (node.left) {
      node.max = node.max > node.left.max ? node.max : node.left.max;
    }
    if (node.right) {
      node.max = node.max > node.right.max ? node.max : node.right.max;
    }

    return node;
  }

  /**
   * Search for overlapping intervals (recursive).
   * @private
   * @param {IntervalNode|null} node
   * @param {Object} query
   * @param {Array} results
   */
  _searchOverlaps(node, query, results) {
    if (!node) return;

    if (this._overlaps(node.interval, query)) {
      results.push({ ...node.interval });
    }

    if (node.left && node.left.max >= query.start) {
      this._searchOverlaps(node.left, query, results);
    }

    if (node.right && node.interval.start < query.end) {
      this._searchOverlaps(node.right, query, results);
    }
  }

  /**
   * Get total number of intervals in the tree.
   * @returns {number}
   */
  size() {
    return this.intervals.length;
  }

  /**
   * Clear all intervals from the tree.
   * @returns {void}
   */
  clear() {
    this.root = null;
    this.intervals = [];
  }

  /**
   * Find conflicts for a specific participant (mentor or student).
   * Useful for checking scheduling conflicts for a user.
   * @param {Object} queryInterval - Time interval to check
   * @param {string} participantId - User ID to check conflicts for
   * @param {string} role - Role type: 'mentor' or 'student'
   * @returns {Array<Object>} Conflicting sessions
   */
  findConflictsForParticipant(queryInterval, participantId, role = 'mentor') {
    const overlaps = this.findOverlaps(queryInterval);
    const roleKey = role === 'mentor' ? 'mentorId' : 'studentId';
    
    return overlaps.filter(interval => 
      interval[roleKey] && interval[roleKey].toString() === participantId.toString()
    );
  }
}

/**
 * Factory function to create a session interval tree.
 * @param {Array} intervalsArray - Optional initial intervals array
 * @returns {SessionIntervalTree}
 */
function createSessionIntervalTree(intervalsArray) {
  const tree = new SessionIntervalTree();
  if (intervalsArray && intervalsArray.length > 0) {
    tree.build(intervalsArray);
  }
  return tree;
}

module.exports = { SessionIntervalTree, createSessionIntervalTree };
