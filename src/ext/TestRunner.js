import TestRunnerIframe from './TestRunnerIframe';
import Iframe from '../Iframe';
import { stdout, stderr } from './utils';

let test_stats, parent_suites, active_suite, options;

function setup (opts, callback) {
    options = opts;

    let indentation = 0;
    let indent = () => Array(indentation).join(' ');

    Iframe.getWindow().onMochaEvent = (type, data) => {
        if (type === 'init') {
            callback();
        }

        if (type === 'suite') {
            let obj = { 
                title: data.title, 
                tests: [],
                suites: []
            };

            indentation++;
            opts.console && stdout(indent() + data.title);

            active_suite.suites.push(obj);
            parent_suites.push(active_suite);
            active_suite = obj;
            opts.onTestProgress(test_stats);
        }

        if (type === 'pending') {
            opts.console && stdout(indent() + ' - ' + data.title);
        }

        if (type === 'pass') {
            opts.console && stdout(indent() + '\x1b[32m ✓ \x1b[0m' + data.title);
        }

        if (type === 'fail') {
            opts.console && stderr(indent() + ' ✖ ' + data.title);
            opts.console && stderr(data.error.split('\\n').map(s => indent() + '       ' + s).join('\\n'));
        }

        if (type === 'pass' || type === 'fail' || type === 'pending') {
            active_suite.tests.push(data);
            test_stats[data.state]++;
            opts.onTestProgress(test_stats);
        }

        if (type === 'suite end') {
            indentation--;
            if (indentation === 1) {
                opts.console && stdout(' ');
            }
            active_suite = parent_suites.pop();
        }

        if (type === 'done') {
            opts.onTestDone(test_stats.failed > 0? 1 : 0, test_stats);
        }

        if (type === 'crash') {
            opts.onTestDone(1, test_stats);
        }
    };

    Iframe.evaluate(TestRunnerIframe, {
        files: opts.files
    });
}

function statsReset () {
    test_stats = {
        passed: 0,
        failed: 0,
        pending: 0,
        suites: []
    };

    parent_suites = [];
    active_suite = test_stats;
}

export default class TestRunner {
    static setup (opts, callback) {
        setup(opts, callback);
    }

    static grep (pattern) {
        Iframe.evaluate(pattern => window.__miui_testrunner.grep(pattern), pattern);
    }

    static clear () {
        Iframe.evaluate(() => window.__miui_testrunner.clear());
    }

    static run () {
        statsReset();
        Iframe.evaluate(() => window.__miui_testrunner.run());
    }
}