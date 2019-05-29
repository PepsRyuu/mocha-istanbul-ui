import { Component } from 'preact';
import TestReporter from './components/test-reporter/TestReporter';
import TestSummary from './components/test-summary/TestSummary';
import CoverageInstrumenter from './ext/CoverageInstrumenter';
import CoverageViewer from './components/coverage-viewer/CoverageViewer';
import TestRunner from './ext/TestRunner';
import { getTestFiles, startWatcher } from './ext/utils';
import './App.scss';

let app_process = global.require('electron').remote.app;

// All of the tests run in blank iframe.
// The reason for this is so that if any tests want to create any DOM elements
// or add some styles, they won't conflict with the styles and DOM for the test reporter.
window.__miui_iframe = document.createElement('iframe');
document.body.appendChild(window.__miui_iframe);
window.__miui_iframe.contentDocument.write('<html><head><title>Test Frame</title></head><body></body></html>');

// Need to modify require in the iframe
// so that they resolve relatively to node_modules for the project
// and not to the embedded iframe.
window.__miui_iframe.contentDocument.write(`
    <script>
    (function () {
        let parent_require = window.top.require;
        let global_require = global.require;
        global.require = function (mod) {
            return global_require(parent_require.resolve(mod));
        };
    })();
    </script>
`);

let subscribers = [];
window.__miui__ = {
    publish: function (type, data) {
        subscribers.forEach(fn => fn(type, data));
    },

    subscribe: function (fn) {
        subscribers.push(fn);
    }
}

export default class App extends Component {
    constructor (props) {
        super();

        this.state = {
            stats: undefined,
            status: 'init',
            showCoverage: false,
            coverage: undefined,
            grepping: false
        };

        this.pendingRunTest = false;

        this.onRefresh = this.onRefresh.bind(this);
        this.onRunTests = this.onRunTests.bind(this);
        this.onToggleCoverage = this.onToggleCoverage.bind(this);
        this.onGrep = this.onGrep.bind(this);
        this.onStopGrep = this.onStopGrep.bind(this);

        this.onTestProgress = this.onTestProgress.bind(this);
        this.onTestReset = this.onTestReset.bind(this);
        this.onTestDone = this.onTestDone.bind(this);
    }

    componentDidMount () {
        if (this.props.instrument) {
            CoverageInstrumenter.instrument();
        } 

        if (this.props.watch) {
            startWatcher(this.onRunTests);
        }

        TestRunner.setup({ 
            console: this.props.console,
            onTestProgress: this.onTestProgress,
            onTestReset: this.onTestReset,
            onTestDone: this.onTestDone
        }, () => {
            if (this.props.bootstrap) {
                let path = global.require('path');
                let bootstrap = path.normalize(path.resolve(process.cwd(), this.props.bootstrap)).replace(/\\/g, '\\\\');
                window.__miui_iframe.contentDocument.write(`<script>global.require('${bootstrap}');</script>`);
            }

            if (!this.props.manual) {
                this.onRunTests();
            }
        });
    }

    onRefresh () {
        window.location.reload();
    }

    onRunTests () {
        if (this.state.status === 'running') {
            this.pendingRunTest = true;
            return;
        }

        let files = getTestFiles(this.props.files);
        TestRunner.run(files);
    }

    onTestProgress (stats) {
        this.setState({ 
            stats,
            status: 'running'
        });
    }

    onTestReset () {
        CoverageInstrumenter.reset();
    }

    onTestDone (code, stats) {
        if (this.props.console) {
            app_process.console.log('  Passed: ' + stats.passed);
            app_process.console.log('  Failed: ' + stats.failed);
            app_process.console.log('  Pending: ' + stats.pending);

            if (CoverageInstrumenter.isCoverageAvailable()) {
                app_process.console.log('  Coverage: ' + CoverageInstrumenter.getCoverage().percentage + '%');
            }
        }

        if (this.props.once) {
            CoverageInstrumenter.saveCoverageToFile();
            return app_process.process.exit(code);
        }

        this.setState({
            status: 'finished',
            coverage: CoverageInstrumenter.getCoverage()
        }, () => {
            if (this.pendingRunTest) {
                this.pendingRunTest = false;
                this.onRunTests();
            }
        });
    }

    onToggleCoverage () {
        this.setState({
            showCoverage: !this.state.showCoverage
        });
    }

    onGrep (value) {
        this.setState({
            grepping: value
        });

        TestRunner.grep(value);
        this.onRunTests();
    }

    onStopGrep () {
        this.setState({
            grepping: ''
        });

        TestRunner.grep('');
        this.onRunTests();
    }

    render ({}, { stats, status, coverage, showCoverage, grepping }) {
        return (
            <div class="MIUI-App">
                {status === 'init' && (
                    <p>Loading...</p>
                )}
                {stats && (
                    <TestReporter {...stats} onGrep={this.onGrep} />
                )}
                {status === 'finished' && (
                    <div class="MIUI-App-controls">
                        {grepping && (
                            <div class="grepping">
                                <span>Grep:</span>
                                <span>{grepping}</span>
                            </div>
                        )}
                        {grepping && <button onClick={this.onStopGrep}>Ungrep</button>}
                        {CoverageInstrumenter.isCoverageAvailable() && (
                            <button onClick={this.onToggleCoverage}>Coverage</button>
                        )}
                        <button onClick={this.onRefresh}>Refresh</button>
                        <button onClick={this.onRunTests}>Restart</button>
                    </div>
                )}
                {stats && (
                    <TestSummary 
                        passed={stats.passed} 
                        failed={stats.failed}
                        pending={stats.pending}
                        coverage={coverage && coverage.percentage}
                    />
                )}
                {showCoverage && (
                    <CoverageViewer 
                        coverage={coverage.coverage} 
                        onClose={this.onToggleCoverage}
                    />
                )}
            </div>
        );
    }
}