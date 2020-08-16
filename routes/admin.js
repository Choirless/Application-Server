const debug = require('debug')('routes:admin');
const express = require('express');
const router = express.Router();

const invitations = require(`${__dirname}/../bin/modules/invitations`);
const mail = require(`${__dirname}/../bin/modules/emails`);
const generateNotification = require(`${__dirname}/../bin/modules/generate_notification`);

router.use('*', (req, res, next) => {

    if(res.locals.userType === 'super'){
        next();
    } else {
        res.status(401);
        res.redirect(`/?${generateNotification(`Sorry, you're not allowed there`, "error")}`);
    }

});

router.get('/', function(req, res, next) {
	
	res.render('admin', { 
		title: "Choirless | All the world's a stage | Admin", 
		bodyid: "admin",
	});

});

router.post('/invite-beta-user', (req, res, next) => {

    if(!req.body.email){
        res.status(422);
        res.redirect(`/admin?${generateNotification(`No email address was passed for invitation`, "error")}`);
    } else {

        const invitationInformation = {
            invitee : req.body.email,
            creator : res.locals.user
        };

        invitations.create(res.locals.user, invitationInformation, "beta")
            .then(inviteId => {

                debug(`Beta invitation successfully created with ID "${inviteId}"`)

                const mailInformation = {
                    to : req.body.email,
                    subject : "Choirless Beta Invitation",
                    info : {
                        inviteLink : `${process.env.SERVICE_URL}/account/create/${inviteId}`
                    }
                };

                mail.send(mailInformation, 'beta')
                    .then(function(){
                        res.redirect(`/admin?${generateNotification(`Invitation created with ID "${inviteId}" and an invitation email has been sent to ${req.body.email}.`, "success")}`);
                    })
                    .catch(err => {
                        debug('/invite-beta-user err:', err);
                        res.status(500);
                        res.redirect('/admin?${generateNotification(`An error occurred sending the invitation email`, "error")}');
                    })
                ;

            })
            .catch(err => {
                debug('/invite-beta-user err:', err);
                res.status(500);
                res.redirect(`/admin?${generateNotification(`Failed to create invitation`, "error")}`);
            })
        ;

    }
    
});

router.post('/impersonate', (req, res) => {

    req.session.impersonating = true;
    req.session.impersonatedId = req.body.impersonatedId;

    res.redirect('/dashboard');

});

router.post('/impersonate/stop', (req, res) => {

    req.session.impersonating = undefined;
    req.session.impersonatedId = undefined;

    res.redirect('/admin');

});

module.exports = router;
