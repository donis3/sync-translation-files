const syncTranslation = require('./translationSyncModule.js');


//Example
syncTranslation.editConfig({
    mainLanguage: 'en',
    root: ['locales', 'test'],
    languages: ['en', 'tr', 'es']
}).run();