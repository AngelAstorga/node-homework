# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime environment for running javascript outside of a browser. It allows developers
who already know javascript to use their knowledge on the backend of an app. Node.js uses libuv, v8 engine, and the event loop to manage asynchronous tasks with a single thread.

## How does Node.js differ from running JavaScript in the browser?

1.  Node.js send the output to the CLI
2.  Node.js uses a file system and doesn't have a window or document global variable.
3.  Node.js is used in the backend
4.  Node.js uses libuv instead of a webAPI

## What is the V8 engine, and how does Node use it?

V8 engine is the interpreter used by the browser to interpreter the javascript code. that's why node.js take the v8 engine and bind it with other tools to be able to run javascript outside the browser.

## What are some key use cases for Node.js?

Node.js is intensive in data I/O, so it very useful in managing a lot of concurrent requeriments.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS is the current standard to define and use javascript in Node.js and ES Modules is the standard used in the browser. One of the big difference is how they manage the import and export of modules.

**CommonJS (default in Node.js):**
// how to import in CJS
const {value1, value2}= require('path');
// how to export in CJS
module.exports = {value1.value2}

**ES Modules (supported in modern Node.js):**
// how to import in ESM
import {value1, value2} from "path";
// how to export in ESM
export default {add, multiply};
