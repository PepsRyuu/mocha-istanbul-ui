import { render, h, Component } from 'preact';
import App from './App';
import { getQuery } from './ext/utils';

// Shorthand
window.h = h;

// Disable component recycling.
Object.defineProperty(Component.prototype, 'nextBase', {
  get() { return null; },
  set() { return; }
});

let query = getQuery();

render(<App {...query} />, document.getElementById('app'));
