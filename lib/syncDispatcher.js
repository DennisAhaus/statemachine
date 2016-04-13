"use strict";

var StateNotFoundError = require("./errors.js").StateNotFoundError;

/**
 *
 */
class SyncDispatcher {


    /**
     *
     * @param name
     */
    constructor(stateMachine) {
        this._stateMachine =  stateMachine;
    }

    dispatch() {

        var currentState,
            currentMaschine = this._stateMachine.getCurrentStateMachine();

        currentMaschine.emit("dispatch");

        if (currentMaschine.getCurrentState() === null) {
            currentMaschine.initializeWith("start");
        }

        currentState = currentMaschine.getCurrentState();


        currentMaschine.emit("beforeEach");
        currentMaschine.emit("before " + currentState.name);


        var externalContext = currentMaschine.getExternalContext();

        function callback(outcome){

          if (!outcome) {
              // final step reached!
              currentMaschine.emit("afterEach");
              currentMaschine.emit("after " + currentState.name);
              currentMaschine.emit("final");
              return;
          }

          var nextStateMachine = currentMaschine.getStateMachineByOutcome(outcome,
              currentState);

          var nextState = currentMaschine.getStateByOutcome(outcome, currentState);

          if (nextState === undefined) {
              throw new StateNotFoundError("No target state found for outcome '" +
                      outcome + "' on state machine '" + currentMaschine.getName() +"'");
          }

          nextStateMachine.setCurrentState(nextState);

          currentMaschine.emit("afterEach");
          currentMaschine.emit("after " + currentState.name);

          currentMaschine.setCurrentStateMachine(nextStateMachine);

          currentMaschine.dispatch();

        }

        currentState.action(function (err, next) {
            if (err) {
                throw err;
            }
            callback(next);
        }, externalContext);


    }

}

module.exports = SyncDispatcher;

function log(message) {
    this.emit("info", "INFO: " + message);
}
