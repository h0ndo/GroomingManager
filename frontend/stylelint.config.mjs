export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**/*', '.angular/**/*', 'node_modules/**/*', 'coverage/**/*'],
  rules: {
    'selector-class-pattern': null,
  },
};
