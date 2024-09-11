# vite-plugin-i18next-save-missing

This Plugin handles POST requests from i18next when setting saveMissing to true

Features
todo

Usage
Vite config

```js
import { handleI18NextRequest } from "vite-plugin-i18next-save-missing";

const config = {
  locales: string[], // locales
  path: string, // path to locale files
  namespace?: string, // namespace of the i18n translation files ( fileName )
  translate?: boolean, // auto translate by locales -> then locales can only be of type ISO 639-1 ( no e.g. en-US )
}

export default defineConfig({
  plugins: [ handleI18NextRequest(config)],
});
```

## Plurals

To add plurals add options with correct suffixes and **count** e.g.

```js
{
  defaultValue_one: "singular",
  defaultValue_other: "plural",
  count: 2
}
```
