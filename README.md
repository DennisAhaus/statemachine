# Statemachine  [![Build Status](https://travis-ci.org/DennisAhaus/statemachine.svg?branch=master)](https://travis-ci.org/DennisAhaus/statemachine)

The only statemachine where rules and states are fully handled independent.
It is also possible to add a statemachine to another statemachine and transit
step to step from machine to machine. Each machine can be used in sync or async
mode.

Content:

1. [Usage](#usage)
1. [API](#api)
  1. [addTransition](#addtransition)
  1. [addState](#addstate)
  1. [setContext](#setcontext)
1. [Events](#events)
  1. [final](#final)
  1. [final](#error)
1. [Errorhandling](#errorhandling)
1. [Test](#test)

## Usage

```js

var StateMachine = require("smachine").StateMachine;

var machine = new StateMachine();

// Adding state transition rules
machine.addTransition({
        from: "start",
        to: {
            "myOutcome": "final"
        }
    });
    // Adding states
    .addState("start", function (next) {
      // First parameter is an error (if there is one), second parameter is the
      // outcome as defined by the stateMachine rules
      next(null, "myOutcome");
    })
    .addState("final", function (next) {
        // Calling next() without any parameter will lead the stateMachine to
        // final state
       next();
     });

// Run the stateMachine
machine.run();

```

## API

##### addTransition

Signature: `.addTransition( object | array of objects )`

Adds a new transition rule to the statemachine. A transition rule defines the "route"
how to transit from one state to another. The expected parameter must be an object defined
as follows:

```js
.addTransition({
        from: "start",
        to: {
            "yourOutcome": "state1"
        }
    });
```

This example expects the outcome of state `start` to be `yourOutcome` and will transit to state
`state1`. If the outcome of state `start` is not available via rules a
`StateNotFoundError` will be the result. See [Errorhandling](#errorhandling)

##### addState

Signature: `.addState( string, function ) | .addState( object )`

Adds a state to the statemachine. The name of the state is used in transitions to
identify the state in dependency of the outcome of each state.

```js
.addStrate("myState", function (next) {
    next(null, "yourOutcome")
});
```


##### setContext

Signature: `.setContext( object | any )`

Adds a context object to the statemachine. If a context object is provided,
the second parameter of the stats's function is the reference to this context object.

```js
.setContext({
    name: "John"
})
.addState("myState", function (next, context) {
    context.name // "John"
});
```

## Events

##### final

When the stateMachine reaches the final state an event `final`is emitted.

```js
statemachine.on("final", function () {
  // statemachine is in final state;
})
```

##### error

If any error occurs (async or sync mode) the event `error`is emitted;

```js
statemachine.on("error", function (error) {
  // handle the error
})
```
> See also [Errorhandling](#errorhandling)

## Errorhandling

Errorhandling is done by emitting an error if any error occurs.
Each state error is catched either the error is thrown with `throw` or by
calling `next(new Error(...), ...)`.
Because the statemachine is an original node event emitter you can register
an error listener to receive all errors:

```js
statemachine.on("error", function (err) {
  // do something with the error
})
```

> The error will be the original error thrown with `throw` or provided by the
state's `next(new Error(...))` method.


## Test

There are no dependencies. Just run `npm test`
