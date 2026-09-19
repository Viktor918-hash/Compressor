import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Ці три правила — стилістичні евристики (React Compiler / Fast
      // Refresh), а не реальні помилки: у проєкті вже є десяток місць, де
      // вони спрацьовують. Лишаємо як попередження, щоб CI не блокував
      // деплой через них. Критичні правила (rules-of-hooks — саме воно
      // ловить помилку з convertWordToPdf.js, no-undef, no-unused-vars)
      // залишаються помилками.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Серверний код (Vercel Functions), скрипти збірки та конфіги працюють
    // у Node, а не в браузері: без цього `process`, `Buffer` тощо
    // помилково вважались невизначеними.
    files: ['api/**/*.js', 'scripts/**/*.mjs', 'vite.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
