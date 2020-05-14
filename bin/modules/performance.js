const debug = require('debug')("bin:modules:performances");
const database = require(`${__dirname}/../lib/database`);

function getListOfPerformances(){
    
    return database.query({
            "selector": {
                "uuid": {
                    "$exists": true
                }
            }
        }, process.env.USERS_DATABASE_NAME)
        .then(results => {
            debug(results);
            return results;
        })
        .catch(err => {
            debug(err);
            throw err;
        })
    ;

}

function getSpecificPerformance(uuid){

    return database.query({
            "selector" : {
                "uuid" : uuid
            }
        }, process.env.USERS_DATABASE_NAME)
        .then(documents => {
            return documents[0];
        })    
    ;

}

function addPerformanceToDatabase(userData){

    return database.add(userData, process.env.USERS_DATABASE_NAME)
        .catch(err => {
            debug(err);
            throw err;
        })
    ;

}

function deletePerformanceFromDatabase(uuid){

    return getSpecificPerformance(uuid)
        .then(user => {
            return database.delete(user._id, user._rev, process.env.USERS_DATABASE_NAME);
        })
        .catch(err => {
            debug('err:', err);
            throw error;
        })
    ;

}

function updatePerformanceInDatabase(uuid, newData){

    debug(uuid, newData);

    return getSpecificPerformance(uuid)
        .then(userData => {

            debug(userData);

            Object.keys(newData).forEach(key => {
                userData[key] = newData[key];
            });

            debug('updated user data:', userData);
            debug(process.env.USERS_DATABASE_NAME);

            return database.update(userData, process.env.USERS_DATABASE_NAME);

        })
        .catch(err => {
            debug(err);
            throw err;
        })
    ;

}

module.exports = {
    list : getListOfPerformances,
    get : getSpecificPerformance,
    add : addPerformanceToDatabase,
    delete : deletePerformanceFromDatabase,
    update : updatePerformanceInDatabase
};