module.exports = {
  root: true,

  env: {
    node: true,
    browser: true,
    es6: true,
  },

  extends: ['eslint:recommended', 'prettier'],

  globals: {
    GM_addStyle: true,
  },

  overrides: [
    {
      files: ['scripts*/*.user.js'],
      extends: ['plugin:userscripts/recommended'],
    },
  ],
}
