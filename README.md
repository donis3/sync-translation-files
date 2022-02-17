# Synchronize Translation Files (i18next)

This package will provide an easy way to synchronize json files for a locale.
Missing translation files and folders will be created (Supply language codes in config)
Missing keys in json files will be created.

## Install
```sh
npm i sync-translation-files
```
## Usage
create a _filename_.js at your project root and require the module.
Configure before run();



```javascript
//Load module
const syncTranslation = require('sync-translation-files');

//Configure and run
syncTranslation.editConfig({
    mainLanguage: 'en',
    root: ['locales', 'test'],
    languages: ['en', 'tr', 'es']
}).run();
```

## Running the script

run through terminal
```sh
node filename.js
```

or add the run command to package.json
```json
"scripts": {
    "syncTranslation": "node filename.js"
  },
```
and run via command
```sh
npm run syncTranslation
```

## Logs
A file named TranslationSync.log will be created at your locales path
