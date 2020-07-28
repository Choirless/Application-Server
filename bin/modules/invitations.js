const debug = require('debug')('bin:modules:invitations');
const fetch = require('node-fetch');

function getAnInvitationById(inviteId){

    if(!inviteId){
        return Promise.reject('No inviteId was passed to function');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/invitation?apikey=${process.env.CHOIRLESS_API_KEY}&inviteId=${inviteId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.invitation;
        })
        .catch(err => {

            debug('getAnInvitationById err:', err);

            if(err.status === 498){
                return { 
                    expired : true,
                    reason : "expired"
                };
            } else if(err.status === 404){
                return {
                    ok : false,
                    reason : "notfound"
                };
            } else {
                throw err;
            }

        })
    ;        

}

function createAnInvitation(creatorUserId, information, type){

    if(!creatorUserId){
        return Promise.reject(`No "creatorUserId" was passed to function`);
    }

    if(!information){
        return Promise.reject(`No "information" object was passed to function`);
    }

    if(!type || (type !== "choir" && type !== "beta")){
        return Promise.reject('Invalid invitation type passed. Can either be "choir" or "beta".');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/invitation?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(information)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.id;
        })
        .catch(err => {
            debug('createAnInvitation err:', err);
            throw err;
        })
    ;

}

module.exports = {
    get : getAnInvitationById,
    create : createAnInvitation
};