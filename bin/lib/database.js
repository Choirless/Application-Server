const debug = require('debug')('bin:lib:database');
const Cloudant = require('@cloudant/cloudant');

const cloudant = Cloudant({ 
    url: process.env.DATABASE_ENDPOINT,
    maxAttempt: process.env.DATABASE_MAX_CONNECTION_ATTEMPTS || 5,
    plugins: [ 
        { 
            iamauth: { 
                iamApiKey: process.env.DATABASE_API_KEY 
            } 
        }, 
        { 
            retry: { 
                retryDelayMultiplier: 2 
            } 
    } ]
});


//Edit this variable value to change name of database.
const DEFAULT_DB_NAME = process.env.DEFAULT_DB_NAME;

function queryTheDatabaseForADcoumentOrDocuments(params, database = DEFAULT_DB_NAME){
    const db = cloudant.db.use(database);

    return new Promise( (resolve, reject) => {

        db.find( params, (err, result) => {
            if(err){
                debug('Database err: (query)', err);
                reject(err);
            } else {
                debug('Result:', result);
                resolve(result.docs)
            }
        });

    });
}

function updateAnItemInTheDatabase(document, database = DEFAULT_DB_NAME){
    const db = cloudant.db.use(database);

    return new Promise( (resolve, reject) => {

        db.insert(document, (err, result) => {
            if(err){
                debug('Database err (update):', err);
                reject(err);
            } else {
                debug('Result:', result);
                resolve(result);
            }
        });

    });

}

function removeADocumentFromTheDatabase(documentID, documentRevision, database = DEFAULT_DB_NAME){
    
    const db = cloudant.db.use(database);
    
    return new Promise( (resolve, reject) => {

        db.destroy(documentID, documentRevision, function(err, body, header) {
            
            if(err){
                debug('Database err (remove):', err);
                reject(err);
            } else {
                resolve();
            }
            
        });

    });

}

module.exports = {
    query : queryTheDatabaseForADcoumentOrDocuments,
    add : updateAnItemInTheDatabase,
    update : updateAnItemInTheDatabase,
    delete : removeADocumentFromTheDatabase
};