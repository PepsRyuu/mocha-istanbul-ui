import { Component } from 'preact';
import './TestReporter.scss';

function PrintSuite (props) {
    return (
        <div class="TestReporter-suite">
           {props.title && (
                <div class="TestReporter-suiteHeader" onClick={() => props.onGrep(props.title)}>
                    {props.title}
                </div>
            )}
            {props.tests.length > 0 && (
                <div class="TestReporter-suiteTests">
                    {props.tests.map(test => (
                        <div class="TestReporter-suiteTest">
                            <span data-state={test.state}>{test.title}</span>
                            <span onClick={() => props.onGrep(test.title)}>&gt;</span>
                            {test.error && (
                                <div class="TestReporter-suiteTestError scrollbar">{test.error}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {props.suites.length > 0 && props.suites.map(suite => (
                <PrintSuite {...suite} onGrep={props.onGrep}/> 
            ))}
        </div>
    );
}

export default class TestReporter extends Component {
    render () {
        return (
            <div class="TestReporter scrollbar">
                {this.props.suites.map(suite => <PrintSuite {...suite} onGrep={this.props.onGrep}/>)}
            </div>
        );
    }    
}