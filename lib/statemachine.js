"use strict";

var EventEmitter = require("events").EventEmitter;
var StateNotFoundError = require("./errors.js").StateNotFoundError;
var AsyncDispatcher = require("./asyncDispatcher.js");
var SyncDispatcher = require("./syncDispatcher.js");

/**
 *
 */
class StateMachine extends EventEmitter {

    /**
     *
     * @param name
     * @returns {{}}
     */
    static resolveStatename(name) {
        var ret = {};
        var split = name.split(":");

        if (split.length === 2) {
            ret.machine = split[0];
            ret.name = split[1];
        } else {
            ret.name = split[0];
        }

        return ret;
    }

    setContext(ctx) {
        this._externalContext = ctx
        return this;
    }

    getExternalContext() {
        return this._externalContext;
    }

    /**
     *
     * @param name
     */
    constructor(name) {
        super();

        this._name = name || "this";
        this._stateRules = {};
        this._currentState = null;
        this._states = {};
        this._stateMachines = {};
        this._isAsync = false;

        this.addStateMachine(this._name, this);
        this.setCurrentStateMachine(this);

    }

    /**
     *
     * @returns {*|string}
     */
    getName() {
      return this._name;
    }

    /**
     *
     * @returns {*|string}
     */
    setAsync(isAsync) {
      this._isAsync = isAsync;
      return this;
    }

    /**
     *
     * @param rule
     * @returns {StateMachine}
     */
    addTransition(rule) {

        var self = this;

        if (Array.isArray(rule)) {
            rule.forEach(function (r) {
                self.addTransition(r);
            });
            return this;
        }

        Object
            .keys(rule.to)
            .forEach(function (key) {
                this._stateRules[rule.from + "." + key] = rule.to[key];
            }.bind(this));

        return this;
    }

    /**
     *
     * @param name
     * @param stateFn
     * @returns {StateMachine}
     */
    addState(name, stateFn) {
        var self = this;

        if (!stateFn) {
            Object.keys(name).forEach(function (key) {
                var stateFunc = name[key];
                self.addState(key, stateFunc);
            });
            return this;
        }

        this._states[name] = {
            name: name,
            action: stateFn
        };

        return this;
    }


    dispatch() {

      if (this._isAsync === true) {

        return new AsyncDispatcher(this).dispatch();

      } else {

        try {
          return new SyncDispatcher(this).dispatch();
        } catch (err) {
          return this.emit("error", err);
        }

      }

    }


    getCurrentState() {
        return this._currentState;
    }


    setCurrentState(state) {
        this._currentState = state;
        return this;
    }


    getStateByOutcome(outcome, currentState) {
        var key = currentState.name + "." + outcome,
            stateName = this._stateRules[key],
            stateInfo = StateMachine.resolveStatename(stateName);

        if (stateInfo.machine) {
            return this.getStateMachine(stateInfo.machine).getState(stateInfo.name);
        }
        return this.getState(stateInfo.name);
    }

    getStateMachineByOutcome(outcome, currentState) {
        var key = currentState.name + "." + outcome,
            stateName = this._stateRules[key],
            stateInfo = StateMachine.resolveStatename(stateName);

        if (!stateInfo.machine) {
            return this;
        }

        return this.getStateMachine(stateInfo.machine);

    }



    /**
     *
     * @param name
     * @returns {*}
     */
    getState(name) {
        return this._states[name];
    }

    addStateMachine(name, m) {
        this._stateMachines[name] = m;
        if (!m.getStateMachine(this.getName())) {
            m.addStateMachine(this.getName(), this);
        }
        return this;
    }

    getStateMachines() {
        return this._stateMachines;
    }

    getStateMachine(name) {
        return this._stateMachines[name];
    }

    getCurrentStateMachine() {
        return this._currentStateMachine;
    }

    setCurrentStateMachine(m) {
        this._currentStateMachine = m;
        return this;
    }


    /**
     *
     * @param stateName
     * @returns {StateMachine}
     */
    initializeWith(stateName) {
        return this.setCurrentState(this.getState(stateName));
    }

    /**
     *
     * @returns {StateMachine}
     */
    run() {
        this.dispatch();
        return this;
    }
}

module.exports = StateMachine;

function log(message) {
    this.emit("info", "INFO: " + message);
}
