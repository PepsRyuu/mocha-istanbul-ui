import { Component } from 'preact';
import FileSelector from './file-selector/FileSelector';
import './CoverageViewer.scss';

let fs = global.require('fs');

const COLOR_GREEN = '#42c0c0';
const COLOR_RED = '#d4426d';
const COLOR_YELLOW = '#fbb316';

function Source (props) {
    let data = props.data;
    let code = fs.readFileSync(props.file, 'utf8').split('\n');
    let total_lines = code.length;
    let line_number_width = total_lines.toString().length * 8 + 30;

    let lines = code.map((line, index) => {
        return {
            text: line,
            number: index + 1,
            color: undefined
        }
    });

    let sLength = Object.keys(data.s).length;
    for (let i = 0; i < sLength; i++) {
        let start = data.statementMap[i].start.line - 1;
        let end = data.statementMap[i].end.line - 1;

        for (let j = start; j <= end; j++) {
            let covered = data.s[i] > 0;
            lines[j].covered = covered;
            lines[j].color = covered ? COLOR_GREEN : COLOR_RED;
        }
    }

    let bLength = Object.keys(data.b).length;
    for (let i = 0; i < bLength; i++) {
        let bEntry = data.b[i];
        for (let j = 0; j < bEntry.length; j++) {
            if (bEntry[j] === 0) {
                let line = lines[data.branchMap[i].locations[j].start.line - 1];
                line.color = line.covered? COLOR_YELLOW : COLOR_RED;
            }
        }
    }

    return (
        <div>
            {lines.map(line => (
                <div style={`background-color: ${line.color}`}>
                    <span style={`width: ${line_number_width}px`}>{line.number}</span>
                    <span>{line.text}</span>
                </div>
            ))}
        </div>
    )
}

export default class CoverageViewer extends Component {
    constructor () {
        super();

        this.state = {
            selected: ''
        };
    }

    onFileSelect (file) {
        this.setState({
            selected: file
        });
    }

    render ({ coverage, onClose }, { selected }) {
        return (
            <div class="CoverageViewer">
                <div class="CoverageViewer-files scrollbar">
                    <FileSelector 
                        files={Object.keys(coverage)}
                        selected={selected}
                        onSelect={(f) => this.onFileSelect(f)}
                    />
                </div>
                <div class="CoverageViewer-source scrollbar">
                    {coverage[selected] && <Source file={selected} data={coverage[selected]} />}
                </div>
                <div class="CoverageViewer-close" onClick={onClose}>✖</div>
            </div>
        );
    }

}