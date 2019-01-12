const babelConfig = require('./babel.config');

module.exports = function (wallaby) {
  return {
    files: [
      'package.json',
      'src/**/*.js',
      '!src/**/*.test.js',
    ],
    tests: [
      'src/**/*.test.js',
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      'src/**/*.test.js': wallaby.compilers.babel(babelConfig),
    },
    testFramework: 'jest',
  };
};
