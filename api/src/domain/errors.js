'use strict';

/**
 * Thrown by domain functions that have not been translated yet (PROVIDED, LOCKED).
 * The HTTP layer maps it to 501 Not Implemented, and `npm run status` reports it.
 */
class NotImplemented extends Error {
  /**
   * @param {string} task  BOB_TASKS.md task id, e.g. "T3"
   * @param {string} fn    function name, e.g. "tepRound"
   */
  constructor(task, fn) {
    super(`${fn} is not implemented yet (BOB_TASKS.md ${task})`);
    this.name = 'NotImplemented';
    this.task = task;
    this.fn = fn;
  }
}

module.exports = { NotImplemented };
