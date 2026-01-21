// utils/simpleCache.js

/**
 * Cache entry with TTL metadata.
 * @private
 */
class CacheEntry {
  constructor(value, ttl) {
    this.value = value;
    this.expiresAt = Date.now() + ttl;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }
}

/**
 * In-memory TTL cache with lazy expiration and periodic sweeping.
 * Time complexity:
 *   - get: O(1) average
 *   - set: O(1) average
 *   - del: O(1)
 * 
 * @class SimpleCache
 */
class SimpleCache {
  /**
   * @param {Object} options - Cache configuration options
   * @param {number} options.sweepIntervalMs - Interval for periodic cleanup (default: 60000ms)
   * @param {number} options.maxSize - Maximum cache entries (default: 1000)
   */
  constructor(options = {}) {
    this.cache = new Map();
    this.sweepIntervalMs = options.sweepIntervalMs || 60000;
    this.maxSize = options.maxSize || 1000;
    this.sweepTimer = null;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    if (this.sweepIntervalMs > 0) {
      this._startSweep();
    }
  }

  /**
   * Set a value in cache with TTL.
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlMs - Time-to-live in milliseconds
   * @returns {void}
   * @complexity O(1) average
   */
  set(key, value, ttlMs) {
    if (typeof key !== 'string' || !key) {
      throw new TypeError('Cache key must be a non-empty string');
    }
    if (typeof ttlMs !== 'number' || ttlMs <= 0) {
      throw new TypeError('TTL must be a positive number');
    }

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }

    this.cache.set(key, new CacheEntry(value, ttlMs));
    this.stats.sets++;
  }

  /**
   * Get a value from cache.
   * Returns undefined if key doesn't exist or has expired.
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   * @complexity O(1) average
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Delete a key from cache.
   * @param {string} key - Cache key
   * @returns {boolean} True if key existed and was deleted
   * @complexity O(1)
   */
  del(key) {
    return this.cache.delete(key);
  }

  /**
   * Wrap a computation with caching.
   * Checks cache first; if miss, computes value, stores it, and returns.
   * @param {string} key - Cache key
   * @param {number} ttlMs - Time-to-live in milliseconds
   * @param {Function} computeFn - Async or sync function to compute value
   * @returns {Promise<*>} Cached or computed value
   * @complexity O(1) cache operations + O(computeFn)
   */
  async wrap(key, ttlMs, computeFn) {
    if (typeof computeFn !== 'function') {
      throw new TypeError('computeFn must be a function');
    }

    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const value = await Promise.resolve(computeFn());
      this.set(key, value, ttlMs);
      return value;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a key exists and is not expired.
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }
    
    return true;
  }

  /**
   * Get current cache size.
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clear all entries from cache.
   * @returns {void}
   */
  clear() {
    this.cache.clear();
    this.stats.evictions += this.cache.size;
  }

  /**
   * Get cache statistics.
   * @returns {Object} Stats object with hits, misses, sets, evictions
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Reset cache statistics.
   * @returns {void}
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
  }

  /**
   * Start periodic sweep to clean expired entries.
   * @private
   */
  _startSweep() {
    if (this.sweepTimer) return;

    this.sweepTimer = setInterval(() => {
      this._sweep();
    }, this.sweepIntervalMs);

    if (this.sweepTimer.unref) {
      this.sweepTimer.unref();
    }
  }

  /**
   * Stop periodic sweep.
   * @returns {void}
   */
  stopSweep() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * Manually trigger a sweep to remove expired entries.
   * @returns {number} Number of entries removed
   */
  _sweep() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.evictions += removed;
    return removed;
  }

  /**
   * Evict oldest entry when cache is full (LRU-like behavior).
   * @private
   */
  _evictOldest() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Destroy cache and clean up resources.
   * @returns {void}
   */
  destroy() {
    this.stopSweep();
    this.clear();
  }
}

/**
 * Factory function to create a simple cache.
 * @param {Object} options - Cache configuration options
 * @returns {SimpleCache}
 */
function createSimpleCache(options) {
  return new SimpleCache(options);
}

module.exports = { SimpleCache, createSimpleCache };
