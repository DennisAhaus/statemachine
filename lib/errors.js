"use strict";



/**
 *
 */
class StateMachineError extends Error {
  constructor(message, rootCause) {
    super(message);
    this.rootCause = rootCause;
  }
}

/**
 *
 */
class StateNotFoundError extends StateMachineError {
}

exports.StateMachineError = StateMachineError;
