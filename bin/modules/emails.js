const debug = require('debug')('bin:modules:emails');
const fetch = require('node-fetch');

function sendAnEmailToUser(info, template){

    if(!info){
        return Promise.reject('No information was passed to be contained in the email');
    }

    const MAIL_SERVER_ADDRESS = `${process.env.CHOIRLESS_MAIL_API_URL}/send/${template ? template : ""}?apikey=${process.env.CHOIRLESS_MAIL_API_KEY}`;

    debug(MAIL_SERVER_ADDRESS);

    return fetch(MAIL_SERVER_ADDRESS, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(info)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug("sendAnEmailToUser err:", err);
            throw err;
        })
    ;

}

module.exports = {
    send : sendAnEmailToUser
};