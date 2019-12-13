module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: ['plugin:prettier/recommended', 'prettier/standard'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'prettier/prettier': 'error',
    semi: [0],
    'comma-dangle': [0],
    'jsx-quotes': [0],
    'space-before-function-paren': [0],
    indent: [0],
  },
};
