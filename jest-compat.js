window.jasmine = {
    Spec: class Spec {}
};

require('jest-jasmine2/build/jestExpect').default({});

let moduleMocker = require('jest-mock');

let timerConfig = {
    idToRef: id => ({ 
        id,
        ref() {
            return this;
        },
        unref() {
            return this;
        }
    }),
    refToId: timer => (timer && timer.id) || undefined
};

let timers = new (require('@jest/fake-timers')).JestFakeTimers({
    global,
    moduleMocker, 
    timerConfig, 
    config: {}, 
    maxLoops: 5
});

let jss = require('jest-snapshot');
let snapshotState;

window.__miui_testrunner.__beforeEach(function () {
    let { setState } = require('expect');
    let snapshotResolver = jss.buildSnapshotResolver({});
    let snapshotPath = snapshotResolver.resolveSnapshotPath(this.currentTest.file);
    snapshotState = new jss.SnapshotState(snapshotPath, {
        expand: true,
        getBabelTraverse: () => require('@babel/traverse').default,
        getPrettier: null,
        updateSnapshot: 'new'
    });

    setState({ 
        snapshotState, 
        testPath: this.currentTest.file, 
        dontThrow: false,
        currentTestName: this.currentTest.parent.title + ' ' + this.currentTest.title,
    });
});

window.__miui_testrunner.__afterEach(function () {
    snapshotState.save();
});

window.jest = {};

[
    'clearAllMocks', 'fn', 'generateFromMetadata', 'getMetadata', 
    'isMockFunction', 'resetAllMocks', 'restoreAllMocks', 'spyOn'
].forEach(prop => {
    window.jest[prop] = moduleMocker[prop].bind(moduleMocker);
});

[
    'advanceTimersByTime', 'clearAllTimers', 'getTimerCount', 'reset', 'runAllImmediates', 
    'runAllTicks', 'runAllTimers', 'runOnlyPendingTimers', 'runWithRealTimers', 
    'useFakeTimers', 'useRealTimers'
].forEach(prop => {
    window.jest[prop] = timers[prop].bind(timers);
});