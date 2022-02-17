/**
 * This program will run through the specified folder searching for json files
 * Indexing will be done at root/mainLanguage/
 * Missing translation files will be created
 * A log file will be created at locales root
 * Missing properties in translation jsons will be created
 */

const path = require('path');
const fs = require('fs');

const config = {
	//Main language code. Other languages will be synced to this one
	mainLanguage: 'en',
	// ['path','to','locales] path to locales folder exclude language code. Must be array
	root: ['public', 'locales'],
	//languages that will be synced to main one
	languages: ['es', 'it', 'de', 'tr'],
	//Only include these file types. Array. Example: ['json', 'txt]
	languageFileTypes: ['json'],
	//Max number of files to index. To stop accidental indexing of node_modules folder for example
	maxDbSize: 100,
};

//Store indexed translation files in this
const db = [];

//Runtime memory
const runtimeData = {
	currentLanguage: null,
};
/* 
    --------------- Operation Log --------------
*/
const logDb = [];
const getTimeStamp = () => {
	const dateTime = new Date();
	return `${dateTime.toLocaleDateString('tr-TR')} ${dateTime.toLocaleTimeString('tr-TR')}`;
};
const log = (message, language = null) => {
	const result = `[${getTimeStamp()}] [${language ? language : config.mainLanguage}] ${message}`;
	console.log(result);
	logDb.unshift(result);
};
const writeLog = () => {
	//Do nothing if no log
	if (logDb.length === 0) return;

	const logFile = path.join(...config.root, 'TranslationSync.log');
	let fileContents = '';
	if (fs.existsSync(logFile)) {
		fileContents = fs.readFileSync(logFile);
	}

	//Add seperator
	logDb.unshift(`\n[${getTimeStamp()}] Sync Started...`);

	const newLogText = '\n' + logDb.join('\n');
	fileContents = newLogText + fileContents;
	fs.writeFileSync(logFile, fileContents);
};

/* 
    --------------- File Exploration --------------
*/

//This function is called to add a found file to db
const createFileDetails = ({ relativePath, filename }) => {
	const result = {
		relativePath,
		filename,
	};
	return result;
};

const exploreDir = function (...relativePath) {
	//Main Directory for language files
	const dir = path.join(...config.root, config.mainLanguage);
	if (!fs.existsSync(dir)) throw new Error(`Main language folder not found at: ${dir}`);

	//If we are in relative path
	const currentDir = relativePath ? path.join(dir, ...relativePath) : dir;

	console.log(`Exploring path: ${currentDir}`);

	const files = fs.readdirSync(currentDir);

	for (let index in files) {
		//Max number of files check
		if (db.length > config.maxDbSize) {
			throw new Error(`Exceeded maximum file exploration size of ${config.maxDbSize}. Stopped program`);
		}
		if (fs.statSync(path.join(currentDir, files[index])).isDirectory() === false) {
			//This is a normal file. Add to list if json
			const extension = path.extname(files[index]).toLocaleLowerCase().replace('.', '');
			if (config.languageFileTypes.includes(extension)) {
				db.push(createFileDetails({ filename: files[index], relativePath }));
			}
		} else {
			//Run the function again recursively. Combine relative paths
			exploreDir.apply(undefined, [...relativePath, files[index]]);
		}
	}
};

/* 
    --------------- Json Synchronization  --------------
*/

/**
 * Get absolute path to file. File is file detail object
 * @param {*} sourceFileDetails File detail object that has relativePath
 * @param {*} targetLanguage optional language. If omitted, will use mainLanguage
 */
const getFile = (sourceFileDetails, targetLanguage = null) => {
	if (targetLanguage !== null && !config.languages.includes(targetLanguage)) {
		throw new Error(`Invalid language supplied: ${targetLanguage}`);
	}
	const lang = targetLanguage ? targetLanguage : config.mainLanguage;
	const dir = path.join(...config.root, lang, ...sourceFileDetails.relativePath);
	const file = path.join(dir, sourceFileDetails.filename);

	//Check if directory exists, create if needed
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	//Check if directory is directory
	if (!fs.statSync(dir).isDirectory()) {
		throw new Error(`Invalid directory: ${dir} `);
	}

	//Check if file exists
	if (!fs.existsSync(file)) {
		//If target language is not null, create file
		if (targetLanguage !== null) {
			fs.writeFileSync(file, JSON.stringify({}));
			log(`Created missing file ${file}`, lang);
		}
	}

	//Return file if exists
	if (fs.existsSync(file)) {
		return file;
	} else {
		return null;
	}
};

//Return data of a file
const readFile = (pathToFile, lang = null) => {
	if (!fs.existsSync(pathToFile)) throw new Error(`Can't read file ${path.basename(pathToFile)}`);
	const raw = fs.readFileSync(pathToFile);
	try {
		return JSON.parse(raw);
	} catch (error) {
		//Invalid json in the file.
		log(`Invalid JSON data in file ${pathToFile}`, lang);
		throw new Error(`Can't parse file ${lang} - ${path.basename(pathToFile)}`);
	}
};

//Copy a data to an object at any deep level
const copyDeepData = (targetObject, newValue, startingKey, ...otherKeys) => {
	const allKeys = [startingKey, ...otherKeys];

	//No levels
	if (allKeys.length === 0) {
		if (!targetObject) {
			targetObject = newValue;
			log(`Writing data over entire object`, runtimeData.currentLanguage);
		}
		return;
	}

	//one level deep
	if (startingKey && otherKeys.length === 0) {
		if (startingKey in targetObject === false || targetObject[startingKey] === null) {
			targetObject[startingKey] = newValue;
			log(`Writing over key [${startingKey}]`, runtimeData.currentLanguage);
		}
		return;
	}

	//Multi level deep
	if (allKeys.length > 1) {
		const lastIndex = allKeys.length - 1;
		let currentRef = targetObject;
		for (let i = 0; i < allKeys.length; i++) {
			//If this is the last key, replace its value and break
			if (i === lastIndex) {
				if (allKeys[i] in currentRef === false || currentRef[allKeys[i]] === null) {
					currentRef[allKeys[i]] = newValue;
					log(`Writing over key [${allKeys[i]}]`, runtimeData.currentLanguage);
				}
				break;
			}

			//Current key is missing, create it as an empty object
			if (allKeys[i] in currentRef === false) {
				log(`Creating missing key [${allKeys[i]}]`, runtimeData.currentLanguage);
				currentRef[allKeys[i]] = {};
			}

			//Check if current value is an object. If not convert it
			if (typeof currentRef[allKeys[i]] !== 'object') {
				//Invalid property. Must be an object to be able to go deeper.
				console.log(`Invalid property that is not an object at [${allKeys[i]}]`);
				log(`Writing over non-object property [${allKeys[i]}]`, runtimeData.currentLanguage);
				currentRef[allKeys[i]] = {};
			}
			//Replace the reference with itself but one level deeper
			currentRef = currentRef[allKeys[i]];
		}
	}
};

//Synchronize a given file with target language file
const syncJson = (fileDetails, targetLanguage) => {
	//Get file paths
	const sourceFile = getFile(fileDetails);
	const targetFile = getFile(fileDetails, targetLanguage);

	//Read data for both files
	const sourceData = readFile(sourceFile);
	const targetData = readFile(targetFile, targetLanguage);

	//Set target language
	runtimeData.currentLanguage = targetLanguage;

	//Create recursive method
	const traverse = function (data, currentObjectPath = []) {
		//Loop all keys
		for (let key in data) {
			if (data[key] && typeof data[key] === 'object' && Array.isArray(data[key]) === false) {
				//Found a sub object. Recursive traverse at this directory
				traverse(data[key], [...currentObjectPath, key]);
			} else {
				//Found a normal property. Sync it
				copyDeepData(targetData, data[key], ...currentObjectPath, key);
			}
		}
	};

	//Run recursive explorer
	traverse(sourceData, []);

	//Save target data
	fs.writeFileSync(targetFile, JSON.stringify(targetData, null, '\t'));
};

const prog = {
	run: function(conf = config) {
		try {
			//Find and index all files
			exploreDir();
	
			//Test
			//syncJson(testFile, 'tr');
			db.forEach((file) => {
				//Sync each file with each language
				log(`Synchronization started for: ${getFile(file)}`);
				config.languages.forEach((lang) => {
					syncJson(file, lang);
				});
			});
		} catch (error) {
			console.log(error.message);
		}
		writeLog();
	},

	editConfig : function ({
		mainLanguage = 'en',
		root = ['public', 'locales'],
		languages = ['tr', 'es'],
		languageFileTypes = ['json'],
		maxDbSize = 100,
	}) {
		if (mainLanguage) {
			config.mainLanguage = mainLanguage;
		}
		if (root) {
			if (!Array.isArray(root)) {
				throw new Error('Please provide an array for locales root');
			}
			config.root = root;
		}
		if (languages) {
			if (!Array.isArray(languages)) {
				throw new Error('Please provide an array for available languages');
			}
			const otherLanguages = languages.filter((lang) => lang !== config.mainLanguage);
			if( otherLanguages.length === 0) {
				throw new Error('Please provide at least 1 other language excluding main language');
			}
			config.languages = otherLanguages;
		}
		if( languageFileTypes) {
			if (!Array.isArray(languageFileTypes)) {
				throw new Error('Please provide an array for language file extensions.');
			}
			config.languageFileTypes = languageFileTypes;
		}
		if( maxDbSize > 0) {
			config.maxDbSize = parseInt(maxDbSize);
		}
	
		return this;
	}
}





//Run program
//For development package json command: "sync-translation": "nodemon SyncTranslation.js -e js,jsx"
//For prod: "sync-translation": "node SyncTranslation.js"
module.exports = prog;
