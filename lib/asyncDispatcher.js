"use strict";

var StateNotFoundError = require('./errors').StateNotFoundError;

/**
 *
 */
class AsyncDispatcher {

  /**
   *
   * @param name
   */
  constructor(stateMachine) {
    this._stateMachine = stateMachine;
  }

  dispatch() {
    const currentMaschine = this._stateMachine.getCurrentStateMachine();

    currentMaschine.emit('dispatch');

    if (currentMaschine.getCurrentState() === null) {
      currentMaschine.initializeWith('start');
    }

    const currentState = currentMaschine.getCurrentState();

    /**
     *
     */
    function emitBeforeEvents() {
      currentMaschine.emit('beforeEach');
      currentMaschine.emit(`before ${currentState.name}`);
    }

    /**
     *
     */
    function runStateAction() {
      return new Promise((resolve, reject) => {
        function action(err, next) {
          if (err) {
            return reject(err);
          }
          return resolve(next);
        }

        const externalContext = currentMaschine.getExternalContext();
        try {
          currentState.action(action, externalContext);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     *
     */
    function emitAfterEvents(outcome) {
      if (!outcome) {
        // final step reached!
        currentMaschine.emit('afterEach');
        currentMaschine.emit(`after ${currentState.name}`);
        currentMaschine.emit('final');
        return null;
      }
      return outcome;
    }

    /**
     *
     */
    function processNextState(outcome) {
      if (!outcome) {
        return null;
      }

      const nextStateMachine = currentMaschine.getStateMachineByOutcome(outcome,
          currentState);

      const nextState = currentMaschine.getStateByOutcome(outcome, currentState);

      if (nextState === undefined) {
        return Promise
          .reject(new StateNotFoundError('No target state found for outcome ' +
              `${outcome} on state machine ${currentMaschine.getName()}`));
      }

      nextStateMachine.setCurrentState(nextState);
      currentMaschine.setCurrentStateMachine(nextStateMachine);
      currentMaschine.emit('afterEach');
      currentMaschine.emit(`after ${currentState.name}`);

      currentMaschine.dispatch();
      return null;
    }

    /**
     *
     */
    function handleError(err) {
      currentMaschine.emit('error', err);
    }

    return Promise
        .resolve()
        .then(emitBeforeEvents)
        .then(runStateAction)
        .then(emitAfterEvents)
        .then(processNextState)
        .catch(handleError);
  }
}


module.exports = AsyncDispatcher;
