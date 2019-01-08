module.exports = {
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'h',
      pragmaFrag: 'h.Fragment',
    }],
    ['@babel/plugin-transform-strict-mode'],
  ],
};
