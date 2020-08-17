const debug = require('debug')("routes:feedback");
const express = require('express');
const router = express.Router();

const adminEmailAddresses = process.env.ADMIN_EMAIL_ADDRESSES ? process.env.ADMIN_EMAIL_ADDRESSES.split(',') : [];

const mail = require(`${__dirname}/../bin/modules/emails`);

router.post('/send', (req, res) => {

    debug("Feedback form body:", req.body);

    adminEmailAddresses.forEach(address => {

        const msgInfo = {
            "to" : address,
            "subject" : "Choirless Beta Feedback",
            "text" : `${res.locals.user} (${res.locals.email}) has sent some feedback for the Choirless beta.\nHere's what they said:\n\nTitle: ${req.body.title}\n\nPage: ${req.body.page}\n\nFeedback:\n${req.body.content}`
        };

        mail.send(msgInfo)
            .then(function(){
                debug('Feedback successfully sent.');
                res.json({
                    status : "ok"
                });
            })
            .catch(err => {
                debug('/feedback/send err:', err);
                res.json({
                    status : "err"
                });
            })
        ;

    });

});

module.exports = router;