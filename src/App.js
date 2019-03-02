import { Component } from 'preact';
import TestReporter from './components/test-reporter/TestReporter';
import TestSummary from './components/test-summary/TestSummary';
import CoverageInstrumenter from './ext/CoverageInstrumenter';
import CoverageViewer from './components/coverage-viewer/CoverageViewer';
import TestRunner from './ext/TestRunner';
import { getTestFiles, startWatcher } from './ext/utils';
import './App.scss';

let app_process = global.require('electron').remote.app;
window.__miui_iframe = document.createElement('iframe');
document.body.appendChild(window.__miui_iframe);
window.__miui_iframe.contentDocument.write('<html><head><title>Test Frame</title></head><body></body></html>');

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

        let file_parts = props.files.split(',');

        this.state = {
            stats: undefined,
            status: 'init',
            bootstrap: file_parts.length > 1? file_parts[0] : undefined,
            files: file_parts.length > 1? file_parts[1] : file_parts[0],
            showCoverage: false,
            coverage: undefined,
            grepping: false
        };

        this.onRefresh = this.onRefresh.bind(this);
        this.onRunTests = this.onRunTests.bind(this);
        this.onToggleCoverage = this.onToggleCoverage.bind(this);
        this.onGrep = this.onGrep.bind(this);
        this.onStopGrep = this.onStopGrep.bind(this);
    }

    componentDidMount () {
        if (this.state.bootstrap) {
            window.__miui_iframe.contentDocument.write(`<script>global.require('${this.state.bootstrap}');</script>`);
        }

        if (this.props.instrument) {
            CoverageInstrumenter.instrument();
        }

        if (this.props.watch) {
            startWatcher(this.onRunTests);
        }

        TestRunner.setup({ 
            console: this.props.console
        }, () => {
            this.onRunTests();
        });
    }

    onRefresh () {
        window.location.reload();
    }

    onRunTests () {
        let files = getTestFiles(this.state.files);
        window.__miui_iframe.contentDocument.body.innerHTML = '';

        CoverageInstrumenter.reset();

        TestRunner.run(files, stats => {
            this.setState({ 
                stats,
                status: 'running'
            });
        }, (code, stats) => {
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
            });
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