# Mocha Istanbul UI

Allows developers to run their tests with the standard Mocha UI extended to support code coverage. 
Functions similarly to Mocha CLI where you can pass a matcher for the test cases to run. 

## Motivation

Testing in JavaScript has taken a huge step backwards.
Test cases used to be ran directly inside the browser, which allowed easy access to the debugger and made it really easy to write your test cases.
However, nowadays developers appear to have began using Mocha CLI instead. 
I presume this is because it requires minimal setup, can easily integrate with CI without the need for PhantomJS, and allows you to place your test files anywhere.
The downside to this however, is that it makes it a frustrating experience to debug tests if you run into a problem.

This project aims to keep the simple workflow, but also provide a full browser experience using Electron. 

## How to Run

```npm install mocha-istanbul-ui```

```
{
    "test:ui": "mocha-istanbul-ui test-setup-script.js \"**/*.spec.js\""
} 
```

First argument should point to a setup script. For example, you may want to use ```babel-register``` and disable CSS imports.
The second argument is the matcher that will be used for test files. 

## Future Plans

* Currently assumes that code is instrumented with ```babel-plugin-istanbul``` using ```.babelrc```.
* Assuming headless Electron becomes available, provide a way to run the tests headless.