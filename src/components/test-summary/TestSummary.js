import { Component } from 'preact';
import './TestSummary.scss';

export default class TestSummary extends Component {
    render () {
        return (
            <div class="TestSummary">
                <div class="TestSummary-entry">
                    <span>Passed:</span>
                    <span>{this.props.passed}</span>
                </div>
                <div class="TestSummary-entry">
                    <span>Failed:</span>
                    <span>{this.props.failed}</span>
                </div>
                <div class="TestSummary-entry">
                    <span>Pending:</span>
                    <span>{this.props.pending}</span>
                </div>
                {this.props.coverage !== undefined && (
                    <div class="TestSummary-entry">
                        <span>Coverage:</span>
                        <span>{this.props.coverage}%</span>
                    </div>
                )}
            </div>
        );
    }
}
