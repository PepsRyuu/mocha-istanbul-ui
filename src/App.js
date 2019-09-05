import { Component } from 'preact';
import TestReporter from './components/test-reporter/TestReporter';
import TestSummary from './components/test-summary/TestSummary';
import CoverageInstrumenter from './ext/CoverageInstrumenter';
import CoverageViewer from './components/coverage-viewer/CoverageViewer';
import TestRunner from './ext/TestRunner';
import { startWatcher } from './ext/utils';
import Iframe from './Iframe';
import './App.scss';

let path = global.require('path');
let app_process = global.require('electron').remote.app;
Iframe.init();

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
        this.onStopGrep = this.onGrep.bind(this, '');
        this.onTestProgress = this.onTestProgress.bind(this);
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
            files: this.props.files? this.props.files.split(',') : [],
            console: this.props.console,
            onTestProgress: this.onTestProgress,
            onTestDone: this.onTestDone
        }, () => {
            if (this.props.require) {
                let parts = this.props.require.split(',');
                parts.forEach(p => {
                    Iframe.evaluate(p => global.require(p), p);
                });
            }

            if (this.props.bootstrap) {
                let bootstrap = path.normalize(path.resolve(process.cwd(), this.props.bootstrap)).replace(/\\/g, '\\\\');
                Iframe.evaluate(b => global.require(b), bootstrap);
            }

            this.onRunTests();
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

        this.setState({
            status: 'running'
        }, () => {
            TestRunner.clear();
            CoverageInstrumenter.reset();
            TestRunner.run();
        });
    }

    onTestProgress (stats) {
        this.setState({ 
            stats
        });
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
        this.setState({ grepping: value });
        TestRunner.grep(value);
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