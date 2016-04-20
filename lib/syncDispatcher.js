import { StateNotFoundError } from './errors';

/**
 *
 */
export class SyncDispatcher {

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

    currentMaschine.emit('beforeEach');
    currentMaschine.emit(`before ${currentState.name}`);

    const externalContext = currentMaschine.getExternalContext();

    function callback(outcome) {
      if (!outcome) {
        // final step reached!
        currentMaschine.emit('afterEach');
        currentMaschine.emit(`after ${currentState.name}`);
        currentMaschine.emit('final');
        return;
      }

      const nextStateMachine = currentMaschine.getStateMachineByOutcome(outcome,
          currentState);

      const nextState = currentMaschine.getStateByOutcome(outcome, currentState);

      if (nextState === undefined) {
        throw new StateNotFoundError('No target state found for outcome' +
          `${outcome} on state machine ${currentMaschine.getName()}`);
      }

      nextStateMachine.setCurrentState(nextState);

      currentMaschine.emit('afterEach');
      currentMaschine.emit(`after ${currentState.name}`);

      currentMaschine.setCurrentStateMachine(nextStateMachine);

      currentMaschine.dispatch();
    }

    currentState.action((err, outcome) => {
      if (err) {
        throw err;
      }
      callback(outcome);
    }, externalContext);
  }
}
