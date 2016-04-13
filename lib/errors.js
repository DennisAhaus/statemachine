'use strict';

var util = require('util');

/**
 *
 */
class StateMachineError extends Error {

    constructor(message, rootCause){
        super(message);
        this.rootCause = rootCause
    }
}

/**
 *
 */
class StateNotFoundError extends StateMachineError {

    constructor(message, rootCause){
        super(message, rootCause);
    }
}

/**
 *
 * @type {StateNotFoundError}
 */
module.exports = {
    StateNotFoundError: StateNotFoundError
};
