/**
 *
 */
export class StateMachineError extends Error {
  constructor(message, rootCause) {
    super(message);
    this.rootCause = rootCause;
  }
}

/**
 *
 */
export class StateNotFoundError extends StateMachineError {
}
