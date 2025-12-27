import antfu from '@antfu/eslint-config';

export default antfu({
  react: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true,
  },
  unicorn: true,
  formatters: true,
  ignores: ['dist', 'node_modules', '*.gen.ts'],
});
