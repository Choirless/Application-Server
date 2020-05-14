const debug = require('debug')("bin:modules:users");
const database = require(`${__dirname}/../lib/database`);

function getListOfUsers(){
    
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

function getSpecificUserByID(uuid){

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

function getSpecificUserByEmail(email){

    return database.query({
            "selector" : {
                "email" : email
            }
        }, process.env.USERS_DATABASE_NAME)
        .then(documents => {
            return documents[0];
        })    
    ;

}

function getSpecificUserByUsername(username){

    return database.query({
            "selector" : {
                "username" : username
            }
        }, process.env.USERS_DATABASE_NAME)
        .then(documents => {
            return documents[0];
        })    
    ;

}

function addUserToDatabase(userData){

    return database.add(userData, process.env.USERS_DATABASE_NAME)
        .catch(err => {
            debug(err);
            throw err;
        })
    ;

}

function deleteUserFromDatabase(uuid){

    return getSpecificUser(uuid)
        .then(user => {
            return database.delete(user._id, user._rev, process.env.USERS_DATABASE_NAME);
        })
        .catch(err => {
            debug('err:', err);
            throw error;
        })
    ;

}

function updateUserInDatabase(uuid, newData){

    debug(uuid, newData);

    return getSpecificUser(uuid)
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
    list : getListOfUsers,
    get : {
        byID : getSpecificUserByID,
        byEmail : getSpecificUserByEmail,
        byUsername : getSpecificUserByUsername
    },
    add : addUserToDatabase,
    delete : deleteUserFromDatabase,
    update : updateUserInDatabase
};