import React from 'react';

export default class MyComponent extends React.Component {
    render () {
        return (
            <div class="MyComponent" onClick={this.props.onClick}>
                {this.props.message}
            </div>
        );
    }
}
