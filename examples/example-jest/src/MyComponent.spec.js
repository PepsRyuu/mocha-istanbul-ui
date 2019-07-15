import React from 'react';
import { createRenderer } from 'react-test-renderer/shallow';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
    it ('should render message prop', () => {
        let renderer = createRenderer();
        renderer.render(<MyComponent message="Hello World" />);
        let output = renderer.getRenderOutput();
        expect(output.type).toBe('div');
        expect(output.props.children).toEqual('Hello World');
    });

    it ('should allow click events', () => {
        let renderer = createRenderer();
        let click_spy = jest.fn();
        renderer.render(<MyComponent message="lol" onClick={click_spy} />);
        let output = renderer.getRenderOutput();
        expect(click_spy).not.toBeCalled();
        output.props.onClick();
        expect(click_spy).toBeCalled();
    });
});