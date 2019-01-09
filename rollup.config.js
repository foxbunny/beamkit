import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        format: 'esm',
        file: pkg.module,
      },
      {
        format: 'umd',
        file: pkg.browser,
        name: 'beamkit',
        exports: 'named',
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      file: 'dist/beamkit.min.js',
      name: 'beamkit',
      exports: 'named',
    },
    plugins: [
      resolve(),
      commonjs(),
      terser(),
    ],
  },
];
