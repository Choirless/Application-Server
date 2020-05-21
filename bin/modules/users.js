const debug = require('debug')("bin:modules:users");
const fetch = require('node-fetch');

function getSpecificUserByID(userId){

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user?apikey=${process.env.CHOIRLESS_API_KEY}&userId=${userId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug('Get user error:', err);
            throw err;
        })
    ;

}

function addUserToDatabase(userData){

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(userData)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug('addUserToDatabase error:', err);
            throw err;
        })
    ;

}

function loginUserToChoirlessService(email, password){

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user/login?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({
                email : email,
                password : password
            })
        })
        .then(res => {
            if(res.ok){
                return res.json()
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug("loginUserToChoirlessService error:", err);
            throw err;
        })
    ;

}

module.exports = {
    get : {
        byID : getSpecificUserByID
    },
    add : addUserToDatabase,
    update : addUserToDatabase,
    login : loginUserToChoirlessService
};