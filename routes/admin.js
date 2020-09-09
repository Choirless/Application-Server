const debug = require('debug')('routes:admin');
const express = require('express');
const { response } = require('express');
const router = express.Router();

const invitations = require(`${__dirname}/../bin/modules/invitations`);
const mail = require(`${__dirname}/../bin/modules/emails`);
const userInterface = require(`${__dirname}/../bin/modules/users`);
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
		title: "Choirless | Admin", 
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
    
    if(!req.body.impersonatedId && !req.body.impersonatedEmail){
    
        res.redirect(`/admin?${generateNotification('No userId or email address was passed to impersonate user', 'notice')}`);
    
    } else {
        
        req.session.impersonating = true;
        req.session.impersonatedId = req.body.impersonatedId;

        const userDataRequest = req.body.impersonatedId ? userInterface.get.byID(req.body.impersonatedId) : userInterface.get.byEmail(req.body.impersonatedEmail);
        
        userDataRequest    
            .then(user => {

                if(user.unknown === true){

                    res.redirect(`/admin?${generateNotification('User not found in database. Could not impersonate.', 'error')}`);

                } else {
                    
                    req.session.impersonating = true;
                    req.session.impersonatedId = user.userId;
                    req.session.impersonatedName = user.name;
                    req.session.impersonatedEmail = user.email;
                    res.redirect('/dashboard');

                }

            })
            .catch(err => {
                debug('/impersonate err:', err);
                res.status(500);
                res.redirect(`/admin?${generateNotification('Failed to impersonate user. Check logs.', 'error')}`);
            })
        ;
    
    }

});

router.post('/impersonate/stop', (req, res) => {

    req.session.impersonating = undefined;
    req.session.impersonatedId = undefined;
    req.session.impersonatedName = undefined;
    req.session.impersonatedEmail = undefined;

    res.redirect('/admin');

});

module.exports = router;
