# Mocha Istanbul UI

An Electron-based testing application that provides the Mocha UI along with code coverage support provided by Istanbul.

## Motivation

For the majority of my JavaScript career, I've been working on creating custom frameworks and custom tools for a large enterprise developer community. While I've been keeping tabs on what the web community has been doing, one area that I didn't pay much attention to was testing. It wasn't until recently that I had a chance to properly experience what the web community has been promoting for best practices. To my shock, testing has taken a huge step backwards.

Personally what I was used to, was running test cases in a browser, with full debugging capabilities. Nowadays, developers seem to be encouraging the use of a CLI and running test cases in either NodeJS or using a runner like Karma with headless browsers. For debugging, you would have to use something like node-inspect or a remote debugger (with hopefully source maps). For code coverage, you're pretty limited in what you could do, other than getting general statistics with NYC and generating files into a "coverage" directory with Istanbul.

The developer experience for writing test cases, is awful.

With this project, I'm hoping to introduce a simple workflow, and provide a nice smooth experience for writing test cases.

## Features

* Mocha UI for running test cases.
* Full code coverage available in the UI. See exactly what was covered immediately without needing separate files.
* Watches files for changes and automatically restarts the test cases.
* Supports CI environments with XVFB with options to print to console, run once, and generate coverage files.
* Support for setup scripts to run babel-register (including source maps) and external Istanbul instrumentation.

## How to Run

```npm install mocha-istanbul-ui```

```
{
    "test": "mocha-istanbul-ui [setup-file.js] <glob-pattern> [--flags]
} 
```

eg. ```mocha-istanbul-ui setup.js "src/*.spec.js" --instrument```

## Options

**--instrument** By default, it is assumed instrumentation is done externally. Passing this flag will instrument the code for code coverage internally.

**--console** Print test results to the console.

**--once** Execute test cases once and exit immediately. An exit code of 1 is passed if any test case fails.

## Example Project

Here's some examples of this tool being used:

* [React Skeleton](https://github.com/PepsRyuu/react-skeleton/tree/mocha-istanbul-ui)
* [Dropdown Interface](https://github.com/PepsRyuu/dropdown-interface)

## Future Plans

* Assuming headless Electron becomes available, provide a way to run the tests headless.