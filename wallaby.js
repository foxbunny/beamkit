module.exports = function (wallaby) {
  return {
    files: [
      'package.json',
      'src/**/*.js',
      'src/_test_setup.js',
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
      'src/**/*.test.js': wallaby.compilers.babel({
        presets: ['@ava/babel-preset-stage-4']
      })
    },
    testFramework: 'ava',
    debug: true,
    setup() {
      require('./src/_test_setup');
    }
  };
};
