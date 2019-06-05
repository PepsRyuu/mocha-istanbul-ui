import TestRunnerIframe from './TestRunnerIframe';

let test_stats, parent_suites, active_suite, progress_callback, reset_callback, done_callback;

function setup (opts, callback) {
    progress_callback = opts.onTestProgress;
    reset_callback = opts.onTestReset;
    done_callback = opts.onTestDone;

    window.__miui__.subscribe((type, data) => {
        if (type === 'init') {
            callback();
        }

        if (type === 'suite') {
            let obj = { 
                title: data.title, 
                tests: [],
                suites: []
            };

            active_suite.suites.push(obj);
            parent_suites.push(active_suite);
            active_suite = obj;
            progress_callback(test_stats);
        }

        if (type === 'suite end') {
            active_suite = parent_suites.pop();
        }

        if (type === 'pass' || type === 'fail' || type === 'pending') {
            active_suite.tests.push(data);
            progress_callback(test_stats);
            test_stats[data.state]++;
        }

        if (type === 'reset') {
            statsReset();
            reset_callback();
        }

        if (type === 'done') {
            done_callback(test_stats.failed > 0? 1 : 0, test_stats);
        }

        if (type === 'crash') {
            done_callback(1, test_stats);
        }
    });

    window.__miui_iframe.contentDocument.write(`
        <script>
        (
           ${TestRunnerIframe.toString()}
        )({
            console: ${opts.console},
            files: ${JSON.stringify(opts.files)}
        })
        </script>
    `);
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
        window.__miui_iframe.contentWindow.__miui_testrunner.grep(pattern);
    }

    static clear () {
        window.__miui_iframe.contentWindow.__miui_testrunner.clear();
    }

    static run () {
        statsReset();
        window.__miui_iframe.contentWindow.__miui_testrunner.run();
    }
}