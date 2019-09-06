import TestRunner from '../../src/ext/TestRunner';
import Iframe from '../../src/Iframe';

let { expect } = global.require('chai');

describe('TestRunner', function () {
    this.timeout(10000);

    it ('should exist', function () {
        expect(TestRunner).not.to.be.undefined;
    }); 

    it ('should run tests', function (done) {
        Iframe.init();

        TestRunner.setup({
            files: ['test/samples/simple/*'],
            onTestProgress: () => { },
            onTestDone: () => { 
                // rAF prevents crash when Iframe is destroyed.
                requestAnimationFrame(() => { 
                    Iframe.destroy(); 
                    done(); 
                });  
            }
        }, () => {
            TestRunner.run();
        });
    });

    it ('should give incremental progress', function (done) {
        Iframe.init();
        let step = 0;

        TestRunner.setup({
            files: ['test/samples/simple/*'],
            onTestProgress: (stats) => { 
                step++;

                if (step === 1) {
                    expect(stats.passed).to.equal(0);
                    expect(stats.failed).to.equal(0);
                    expect(stats.pending).to.equal(0);
                    expect(stats.suites[0].title).to.equal('');
                    expect(stats.suites[0].suites.length).to.equal(0);
                    expect(stats.suites[0].tests.length).to.equal(0);
                }

                if (step === 2) {
                    expect(stats.passed).to.equal(0);
                    expect(stats.failed).to.equal(0);
                    expect(stats.suites[0].suites[0].title).to.equal('Simple Tests');
                    expect(stats.suites[0].suites[0].tests.length).to.equal(0);
                }

                if (step === 3) {
                    expect(stats.passed).to.equal(1);
                    expect(stats.failed).to.equal(0);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(1);
                    expect(stats.suites[0].suites[0].tests[0].title).to.equal('should add two numbers');
                    expect(stats.suites[0].suites[0].tests[0].state).to.equal('passed');
                    expect(stats.suites[0].suites[0].tests[0].duration >= 0).to.be.true;
                }

                if (step === 4) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(0);
                    expect(stats.suites[0].suites[0].suites.length).to.equal(0);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(2);
                    expect(stats.suites[0].suites[0].tests[1].title).to.equal('should subtract two numbers');
                }

                if (step === 5) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(1);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(3);
                    expect(stats.suites[0].suites[0].tests[2].title).to.equal('should fail this test');
                    expect(stats.suites[0].suites[0].tests[2].state).to.equal('failed');
                    expect(stats.suites[0].suites[0].tests[2].error.indexOf('Assertion') > -1).to.be.true;
                }

                if (step === 6) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(1);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(3);
                    expect(stats.suites[0].suites[0].suites.length).to.equal(1);
                    expect(stats.suites[0].suites[0].suites[0].title).to.equal('Nested Suite');
                    expect(stats.suites[0].suites[0].suites[0].tests.length).to.equal(0);
                }

                if (step === 7) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(1);
                    expect(stats.pending).to.equal(1);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(3);
                    expect(stats.suites[0].suites[0].suites.length).to.equal(1);
                    expect(stats.suites[0].suites[0].suites[0].tests.length).to.equal(1);
                    expect(stats.suites[0].suites[0].suites[0].tests[0].title).to.equal('should be pending');
                    expect(stats.suites[0].suites[0].suites[0].tests[0].state).to.equal('pending');
                }

                if (step === 8) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(1);
                    expect(stats.pending).to.equal(1);
                    expect(stats.suites[0].suites.length).to.equal(2);
                    expect(stats.suites[0].suites[1].title).to.equal('second suite');
                }

                if (step === 9) {
                    expect(stats.passed).to.equal(2);
                    expect(stats.failed).to.equal(1);
                    expect(stats.pending).to.equal(2);
                    expect(stats.suites[0].suites[0].tests.length).to.equal(3);
                    expect(stats.suites[0].suites[0].suites[0].tests.length).to.equal(1);
                    expect(stats.suites[0].suites[1].tests.length).to.equal(1);
                    expect(stats.suites[0].suites[1].tests[0].title).to.equal('should also be pending');
                }
            },
            onTestDone: () => { 
                requestAnimationFrame(() => { 
                    Iframe.destroy(); 
                    done(); 
                });  
            }
        }, () => {
            TestRunner.run();
        });
    });

    it ('should crash gracefully if problem with loaded scripts');
    it ('should allow loading external http javascript files');
    it ('should allow loading external http css files');
    it ('should clear cache of local filesystem files when restarting');
    it ('should clear cache of http files when restarting');
    it ('should support grepping and run those tests only');
});