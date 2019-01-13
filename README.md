# BeamKit

A simple toolkit for developing front end applications the old-school way.

[![Build Status](https://travis-ci.org/foxbunny/beamkit.svg?branch=master)](https://travis-ci.org/foxbunny/beamkit)

## Features

- Compatible with Babel's `@babel/plugin-transform-react-jsx` plugin.
- Component-less event-driven architecture with a simple pub-sub system.
- Designed for imperative programs, the way JavaScript likes it.
- Designed for modern browsers (untranspiled ES6, no polyfills, no boilerplate).
- Extremely low footprint 1.1KB min+gz (we aim at less than 1000 lines total).

## Supported browsers

- Latest Webkit-based and Firefox browsers
- No IE11 or any older version

## Documentation

- [Creating DOM nodes using JSX](./docs/h.md)
- [Custom events](./docs/hub.md)
- [Making XHR requests](./docs/xhr.md)
- [Client-side routing](./docs/urlstate.md)
- [Browser APIs](./docs/browser.md)

## Installation

For now, install directly from GitHub repository:

```
npm i https://github.com/foxbunny/beamkit/
```
