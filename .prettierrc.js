module.exports = {
  // Formatting options
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      }
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      }
    }
  ]
};

