# Synchronize Translation Files (i18n)

This is a primitive node module to synchronize additional locale folders to your main one.
For example, I have public/locales/ path as my locales root folder.
I have public/locales/en as my main language.
Any additional languages I have in my config will now be synced to my main language 'en'

1. program will traverse public/locales/en folder for specified file extensions (json) and index them.
2. it'll create the same file/folder structure for any other languages if needed
3. It'll match the same translation keys if any of them are missing
4. Missing keys will be copied over from main language.
5. A log file will be created to display operations.





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
