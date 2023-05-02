module.exports = {
  root: true,

  env: {
    node: true,
    browser: true,
    es2022: true,
  },

  parserOptions: {
    ecmaVersion: 2022,
  },

  extends: ['eslint:recommended', 'airbnb-base', 'prettier'],

  globals: {
    GM_addStyle: true,
    GM_setValue: true,
    GM_getValue: true,
    GM_deleteValue: true,
    GM_openInTab: true,
    GM_xmlhttpRequest: true,
  },

  rules: {
    'no-use-before-define': ['error', { functions: false }],
    'no-param-reassign': ['error', { props: false }],
    'no-console': 'off',
  },

  overrides: [
    {
      files: ['scripts*/*.user.js'],
      extends: ['plugin:userscripts/recommended'],
    },
  ],
}
