module.exports = {
  // JavaScript/Node.js files
  '*.js': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],
};

