const debug = require('debug')("bin:modules:users");
const fetch = require('node-fetch');

function getSpecificUserByID(userId){

    if(!userId){
        return Promise.reject('No userId was passed to function');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user?apikey=${process.env.CHOIRLESS_API_KEY}&userId=${userId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.user;
        })
        .catch(err => {
            debug('Get user error:', err);
            throw err;
        })
    ;

}

function getSpecificUserByEmailAddress(emailAddress){

    if(!emailAddress){
        return Promise.reject('No email address was passed to function');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user/byemail?apikey=${process.env.CHOIRLESS_API_KEY}&email=${emailAddress}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.user;
        })
        .catch(err => {
            debug('Get user error:', err);
            throw err;
        })
    ;
}

function addUserToDatabase(userData){

    if(!userData){
        return Promise.reject(`No 'userData' object was passed to function`);
    }

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

    if(!email){
        return Promise.reject(`No email was passed. Function recieved "${email}".`);
    }

    if(!password){
        return Promise.reject(`No password was passed.`);
    }

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
            if(err.status === 403){
                return {ok : false};
            } else {
                throw err;
            }
        })
    ;

}

function getChoirsForUserID(userId){

    if(!userId){
        return Promise.reject(`No userId was passed. Function recieved "${userId}"`);
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/user/choirs?apikey=${process.env.CHOIRLESS_API_KEY}&userId=${userId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.choirs;
        })
        .catch(err => {
            debug('Get user error:', err);
            throw err;
        })
    ;

}

module.exports = {
    get : {
        byID : getSpecificUserByID,
        byEmail : getSpecificUserByEmailAddress,
        choirs : getChoirsForUserID
    },
    add : addUserToDatabase,
    update : addUserToDatabase,
    login : loginUserToChoirlessService
};