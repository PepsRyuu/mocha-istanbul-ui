import { Component } from 'preact';
import './FileSelector.scss';

function convertToNodes (files) {
    let nodes = [];

    let trace = path => {
        let short_path = path.replace(process.cwd(), '');
        let parts = short_path.split(/\\|\//).filter(p => p.trim() !== '');
        let parent = { children: nodes };

        parts.forEach((part, index) => {
            let found;

            for (let i = 0; i < parent.children.length; i++) {
                let node = parent.children[i];
                if (node.name === part) {
                    found = node;
                }
            }

            if (!found) {
                parent.children.push({
                    name: part,
                    children: [],
                    isExpanded: false,
                    isParent: index !== parts.length - 1,
                    path: index === parts.length - 1? path : null
                });

                found = parent.children[parent.children.length - 1];
            }

            parent = found;
        });
    }

    if (files) {
        files.forEach(f => trace(f));
    }

    return nodes;
}

export default class FileSelector extends Component {
    
    constructor (props) {
        super();

        this.state = {
            nodes: convertToNodes(props.files)
        };
    }

    onItemClick (e, node) {
        e.stopPropagation();

        if (node.isParent) {
            node.isExpanded = !node.isExpanded;
            this.forceUpdate();
        } else {
            this.props.onSelect(node.path);
        }
    }

    render ({ selected }, { nodes }) {

        let printNodeLevel = (nodes, indentation) => {
            return nodes.map(n => (
                <div 
                    class="FileSelector-entry"
                    data-selected={selected === n.path}
                    data-parent={n.isParent}
                    data-expanded={n.isExpanded}
                >
                    <div 
                        class="FileSelector-entryName"
                        onClick={(e) => this.onItemClick(e, n)}
                    >{n.name}</div>
                    {n.isParent && n.isExpanded && (
                        <div>{printNodeLevel(n.children, indentation + 1)}</div>
                    )}
                </div>
            ))
        }

        return (
            <div class="FileSelector">
                {printNodeLevel(nodes, 1)}
            </div>
        );

    }

}