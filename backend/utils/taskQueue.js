// utils/taskQueue.js

const EventEmitter = require('events');

/**
 * Simple in-memory FIFO queue for async/background jobs.
 * Provides event-based notifications for queue operations.
 * 
 * @class TaskQueue
 * @extends EventEmitter
 */
class TaskQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add a job to the queue.
   * Job should be a plain JS object with necessary data.
   * @param {Object} job - Job data object
   * @returns {void}
   * @emits enqueue
   */
  enqueue(job) {
    if (!job || typeof job !== 'object') {
      throw new TypeError('Job must be a plain object');
    }

    this.queue.push({ ...job, enqueuedAt: Date.now() });
    this.emit('enqueue', job);
  }

  /**
   * Remove and return the next job from queue.
   * @returns {Object|null} Next job or null if queue is empty
   * @emits dequeue
   */
  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }

    const job = this.queue.shift();
    this.emit('dequeue', job);
    return job;
  }

  /**
   * Peek at the next job without removing it.
   * @returns {Object|null} Next job or null if queue is empty
   */
  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get current queue size.
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Clear all jobs from queue.
   * @returns {void}
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    this.emit('clear', { count });
  }

  /**
   * Get all jobs in queue (without removing them).
   * @returns {Array<Object>} Copy of queue array
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Filter jobs in queue by predicate.
   * @param {Function} predicate - Function to test each job
   * @returns {Array<Object>} Filtered jobs
   */
  filter(predicate) {
    return this.queue.filter(predicate);
  }

  /**
   * Remove jobs matching a predicate.
   * @param {Function} predicate - Function to test each job
   * @returns {number} Number of jobs removed
   */
  remove(predicate) {
    const before = this.queue.length;
    this.queue = this.queue.filter(job => !predicate(job));
    return before - this.queue.length;
  }
}

/**
 * Create a worker that polls the queue and processes jobs.
 * @param {TaskQueue} queue - Task queue instance
 * @param {Function} processFn - Async function to process each job: (job) => Promise
 * @param {Object} options - Worker configuration
 * @param {number} options.pollIntervalMs - Polling interval in ms (default: 1000)
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {number} options.retryDelayMs - Initial retry delay in ms (default: 1000)
 * @param {number} options.backoffMultiplier - Backoff multiplier for retries (default: 2)
 * @param {Function} options.onError - Error handler: (error, job) => void
 * @returns {Object} Worker control object with start, stop, isRunning methods
 */
function createWorker(queue, processFn, options = {}) {
  if (!(queue instanceof TaskQueue)) {
    throw new TypeError('queue must be an instance of TaskQueue');
  }
  if (typeof processFn !== 'function') {
    throw new TypeError('processFn must be a function');
  }

  const config = {
    pollIntervalMs: options.pollIntervalMs || 1000,
    maxRetries: options.maxRetries || 3,
    retryDelayMs: options.retryDelayMs || 1000,
    backoffMultiplier: options.backoffMultiplier || 2,
    onError: options.onError || (() => {})
  };

  let running = false;
  let pollTimer = null;
  let currentJob = null;

  /**
   * Process a single job with retry logic.
   * @private
   * @param {Object} job
   */
  async function processJob(job) {
    currentJob = job;
    let attempt = 0;
    let lastError = null;

    while (attempt < config.maxRetries) {
      try {
        await processFn(job);
        currentJob = null;
        return;
      } catch (error) {
        attempt++;
        lastError = error;
        
        if (attempt < config.maxRetries) {
          const delay = config.retryDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    currentJob = null;
    queue.emit('error', { error: lastError, job, attempts: attempt });
    config.onError(lastError, job);
  }

  /**
   * Poll queue for jobs.
   * @private
   */
  async function poll() {
    if (!running) return;

    try {
      const job = queue.dequeue();
      if (job) {
        await processJob(job);
      }
    } catch (error) {
      queue.emit('error', { error, message: 'Worker polling error' });
    }

    if (running) {
      pollTimer = setTimeout(poll, config.pollIntervalMs);
    }
  }

  return {
    /**
     * Start the worker.
     * @returns {void}
     */
    start() {
      if (running) return;
      running = true;
      poll();
    },

    /**
     * Stop the worker gracefully.
     * Waits for current job to complete.
     * @returns {Promise<void>}
     */
    async stop() {
      running = false;
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
      
      while (currentJob) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    },

    /**
     * Check if worker is running.
     * @returns {boolean}
     */
    isRunning() {
      return running;
    },

    /**
     * Get current job being processed.
     * @returns {Object|null}
     */
    getCurrentJob() {
      return currentJob;
    },

    /**
     * Get worker configuration.
     * @returns {Object}
     */
    getConfig() {
      return { ...config };
    }
  };
}

/**
 * Factory function to create a task queue.
 * @returns {TaskQueue}
 */
function createTaskQueue() {
  return new TaskQueue();
}

module.exports = { TaskQueue, createTaskQueue, createWorker };
