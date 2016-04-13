"use strict";

var StateNotFoundError = require("./errors.js").StateNotFoundError;

/**
 *
 */
class AsyncDispatcher {


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

        return Promise
            .resolve()
            .then(function () {
                currentMaschine.emit("beforeEach");
                currentMaschine.emit("before " + currentState.name);
            })
            .then(function () {
                return new Promise(function (resolve, reject) {
                    var externalContext = currentMaschine.getExternalContext();
                    try {
                        currentState.action(function (err, next) {
                            if (err) {
                                return reject(err);
                            }
                            resolve(next);
                        }, externalContext);
                    } catch (err) {
                        reject(err);
                    }
                });
            })
            .then(function (outcome) {

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
                    return Promise
                        .reject(new StateNotFoundError("No target state found for outcome '" +
                            outcome + "' on state machine '" + currentMaschine.getName() +"'"));
                }

                nextStateMachine.setCurrentState(nextState);

                currentMaschine.emit("afterEach");
                currentMaschine.emit("after " + currentState.name);

                currentMaschine.setCurrentStateMachine(nextStateMachine);

                currentMaschine.dispatch();
            })
            .catch(function (err) {
                currentMaschine.emit("error", err);
            });

    }

}

module.exports = AsyncDispatcher;

function log(message) {
    this.emit("info", "INFO: " + message);
}
