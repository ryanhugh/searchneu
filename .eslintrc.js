
module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "airbnb"
  ],
  "plugins": [
    "babel",
    "react",
    "promise"
  ],
  "env": {
    "browser": true,
    "jest": true
  },
  "rules": {
    "arrow-parens": [1, "always"],
    "arrow-body-style": [1, "always"],
    "key-spacing": 0,
    "no-mixed-operators": 0,
    "no-param-reassign": 0,

    // Allow for-of loops. 
    "no-restricted-syntax": [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],

    // This rule requires that all class methods use this. 
    // Disabling this allows making class methods that do not reference "this", which is helpful for private helper functions. 
    "class-methods-use-this": 0,

    // This config disallows if(true) but allows while(true)
    "no-constant-condition": ["error", { "checkLoops": false }],
    "no-cond-assign": ["error", "except-parens"],
    "no-plusplus": [0, {
      "allowForLoopAfterthoughts": true
    }],

    // Prevents using variables before they are defined. 
    "no-use-before-define": 1,
    "jsx-quotes": [2, "prefer-single"],
    "max-len": [2, 5000, 2],
    "object-shorthand": ["error", "never"],
    "object-curly-spacing": [2, "always"],
    "react/forbid-prop-types": 0,
    "react/no-danger": 1,
    "no-continue": 0,

    // This rule always triggers on Windows...
    "import/no-unresolved": Number(process.env.OS !== 'Windows_NT') * 2,
    "spaced-comment": 0,
    "react/prefer-stateless-function": [1],
    "react/jsx-filename-extension": [1, {
      "extensions": [".js", ".jsx"]
    }],
    "react/jsx-curly-spacing": [2, "always", {
      "spacing": {
        "objectLiterals": "never"
      }
    }],
    "no-console": "off"
  }
}
