"use strict";

var expect = require("expect"),
    StateMachine = require("../").StateMachine,
    sinon = require("sinon");

describe(__filename, function () {

  
    /**
     *
     */
    it("Should use sync dispatcher", sinon.test(function (done) {

      var isFinal = false;

        var m1 = new StateMachine()
          .setAsync(false)
          .addTransition({
              from: "start",
              to: {
                  "out1": "final"
              }
          })
          .addState("start", function (next, ctx) {
              next(null, "out1");
          })
          .addState("final", function (next, ctx) {
              next();
          })
          .on("final", function () {
              isFinal = true;
          })
          .on("error", function (err) {
              done(err);
          });


       m1.run();

       expect(isFinal).toBe(true, "Machine did not run in sync mode");

       done();

    }));


    /**
     *
     */
    it("Should use async dispatcher", sinon.test(function (done) {

        var m1 = new StateMachine()
          .setAsync(true)
          .addTransition({
              from: "start",
              to: {
                  "out1": "final"
              }
          })
          .addState("start", function (next, ctx) {
              next(null, "out1");
          })
          .addState("final", function (next, ctx) {
              next();
          })
          .on("final", done)
          .on("error", function (err) {
              done(err);
          });


       m1.run();

    }));

    /**
     *
     */
    it("Should use external context", sinon.test(function (done) {

        var m1,
            mainCtx = {};

        m1 = new StateMachine("m1")
            .setContext(mainCtx)
            .addTransition({
                from: "start",
                to: {
                    "out1": "final"
                }
            })
            .addState("start", function (next, ctx) {
                expect(ctx).toBe(mainCtx);
                mainCtx.whoIam = "me";
                next(null, "out1");
            })
            .addState("final", function (next, ctx) {
                expect(ctx).toBe(mainCtx);
                expect(ctx.whoIam).toBe("me");
                next();
            })
            .on("final", done)
            .on("error", function (err) {
                done(err);
            });

       m1.run();

    }));

    /**
     *
     */
    it("Should use second statemaschine", sinon.test(function (done) {

        var m1, m2, stateSpy = sinon.spy();

        function finalExpectation() {

            expect(stateSpy.withArgs("m1:start").callCount).toBe(1);
            expect(stateSpy.withArgs("m2:step1").callCount).toBe(1);
            expect(stateSpy.withArgs("m1:final").callCount).toBe(1);

            expect(m1.getStateMachines()).toEqual({
                "m1": m1,
                "m2": m2
            });

            expect(m2.getStateMachines()).toEqual({
                "m1": m1,
                "m2": m2
            });

            done();
        }

        m1 = new StateMachine("m1")
            .addTransition({
                from: "start",
                to: {
                    "out1": "m2:step1"
                }
            })
            .addState("start", function (next) {
                stateSpy("m1:start");
                next(null, "out1");
            })
            .addState("final", function (next) {
                stateSpy("m1:final");
                next();
            })
            .on("final", finalExpectation)
            .on("error", function (err) {
                done(err);
            });

        m2 = new StateMachine("m2")
            .addTransition({
                from: "step1",
                to: {
                    "out2": "m1:final"
                }
            })
            .addState("step1", function (next) {
                stateSpy("m2:step1");
                next(null, "out2");
            })
            .on("error", function (err) {
                done(err);
            });

        m1.addStateMachine("m2", m2);

        m1.run();

    }));


    /**
     *
     */
    it("Should catch async error in state", sinon.test(function (done) {

        var finalSpy = sinon.spy(),
            statemachine = new StateMachine();

        statemachine
            .addTransition([
                {
                    from: "start",
                    to: {
                        "outcome1": "final"
                    }
                }
            ])
            .addState({
                start: function (next) {
                    next(new Error("TestError"));
                },
                final: finalSpy
            })
            .on("final", finalSpy)
            .on("error", function (err) {

                expect(finalSpy.callCount).toBe(0);
                expect(err.message).toBe("TestError");
                expect(statemachine.getCurrentState().name).toBe("start");

                done();
            })
            .run();

    }));


    /**
     *
     */
    it("Should catch sync error in state", sinon.test(function (done) {

        var finalSpy = sinon.spy(),
            statemachine = new StateMachine();

        statemachine
            .addTransition([
                {
                    from: "start",
                    to: {
                        "outcome1": "final"
                    }
                }
            ])
            .addState({
                start: function (next) {
                    throw new Error("TestError");
                },
                final: finalSpy
            })
            .on("final", finalSpy)
            .on("error", function (err) {

                expect(finalSpy.callCount).toBe(0);
                expect(err.message).toBe("TestError");
                expect(statemachine.getCurrentState().name).toBe("start");

                done();
            })
            .run();

    }));


    /**
     *
     */
    it("Should run statemachine", sinon.test(function (done) {

        var stateSpy = sinon.spy(),
            beforeSpy = sinon.spy(),
            beforeEachSpy = sinon.spy(),
            afterSpy = sinon.spy(),
            afterEachSpy = sinon.spy(),
            statemachine = new StateMachine();



        statemachine
            .addTransition([
                {
                    from: "start",
                    to: {
                        "outcome1": "step1"
                    }
                },
                {
                    from: "step1",
                    to: {
                        "outcome2": "final"
                    }
                }
            ])
            .addState("start", function (next) {
                stateSpy("start");
                next(null, "outcome1");
            })
            .addState({
                step1: function (next) {
                    stateSpy("step1");
                    next(null, "outcome2");
                },
                final: function (next) {
                    stateSpy("final");
                    next();
                }
            })
            .on("final", function () {
                expect(stateSpy.withArgs("start").callCount).toBe(1);
                expect(stateSpy.withArgs("step1").callCount).toBe(1);
                expect(stateSpy.withArgs("final").callCount).toBe(1);

                expect(beforeSpy.callCount).toBe(2);
                expect(beforeSpy.callCount).toBe(afterSpy.callCount);

                expect(beforeEachSpy.callCount).toBe(3);
                expect(beforeEachSpy.callCount).toBe(afterEachSpy.callCount);

                done();
            })
            .on("error", function (err) {
                done(err);
            })
            .on("beforeEach", beforeEachSpy)
            .on("before step1", beforeSpy)
            .on("before final", beforeSpy)
            .on("after step1", afterSpy)
            .on("after final", afterSpy)
            .on("afterEach", afterEachSpy)
            .run();

    }));


    /**
     *
     */
    it("Should add transition rule to statemachine", sinon.test(function () {
        var stateMachine = new StateMachine()
          .addTransition({
              from: "start",
              to: {
                  "step1": "step1",
                  "final": "final"
              }
          });

        expect(stateMachine._stateRules).toEqual({
            "start.step1": "step1",
            "start.final": "final"
        });

        expect(stateMachine).toBeA(StateMachine);
    }));

    /**
     *
     */
    it("Should create statemachine", sinon.test(function () {

        var statemachine = new StateMachine();
        expect(statemachine).toBeA(StateMachine);

    }));


});
