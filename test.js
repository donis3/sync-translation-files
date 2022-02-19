const syncTranslation = require('./index.js');

//Configure and run
syncTranslation.editConfig({
    mainLanguage: 'en',
    root: ['locales'],
    languages: ['en', 'tr', 'es']
}).run();