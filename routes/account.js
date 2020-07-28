const debug = require('debug')("routes:account");
const express = require('express');
const router = express.Router();

const users = require(`${__dirname}/../bin/modules/users`);
const mail = require(`${__dirname}/../bin/modules/emails`);
const invitations = require(`${__dirname}/../bin/modules/invitations`);

const betaInterestReceivees = process.env.BETA_INTEREST_RECEIVEES ? process.env.BETA_INTEREST_RECEIVEES.split(',') : [];

router.get('/login', function(req, res, next) {

	if(!req.session.user){

		let invitationCheck;

		if(!req.query.inviteId){
			invitationCheck = Promise.resolve(true);
		} else {
			invitationCheck = invitations.get(req.query.inviteId)
				.then(invitation => {
					debug('invitation:', invitation);
					if(invitation.expired || invitation.ok === false){
						return false;
					} else {
						return true;
					}
				})
			;
		}

		invitationCheck.then((validInvitation) => {
				debug('Valid Invite:' , validInvitation);
				res.render('account/login', { 
					title: "Choirless | Bringing people together, even when they're not together.", 
					bodyid: "accountLogin",
					redirect: req.query.redirect,
					inviteId : validInvitation ? req.query.inviteId : undefined
				});
				
			})
			.catch(err => {
				debug('/login err:', err);
				res.status(500);
				res.redirect('/?msg=Sorry, an error occurred trying to process that request.&msgtype=error');
			})
		;


	} else {
		res.redirect('/');
	}

});

router.post('/login', (req, res, next) => {

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.email && req.body.password){

		users.login(req.body.email, req.body.password)
			.then(data => {

				if(data){
				
					if(data.ok !== true){
						res.status(401);
						res.redirect(`/account/login?msg=Sorry, those credentials are incorrect.&msgtype=error`);
					} else {

						debug(data);
						req.session.user = data.user.userId;
						req.session.name = data.user.name;
						req.session.userType = data.user.userType;

						if(req.query.redirect){
							res.redirect(decodeURIComponent(req.query.redirect));
						} else {
							res.redirect('/dashboard');
						}

					}

				}

			})
			.catch(err => {
				debug('Login err:', err);
				res.status(err.status || 422);
				res.redirect('/account/login?msg=Sorry, an error occurred during login.&msgtype=error');
			})
		;

	} else {
		res.status(422);
		next();
	}


});

router.get('/create/:INVITEID?', function(req, res, next) {

	const inviteId = req.params.INVITEID || req.query.inviteId;

	if(!req.session.user){

		if(!inviteId){
			res.redirect('/?msg=Sorry, Choirless account creations are by invitation only at this time&msgtype=general');
		} else {

			let invitationData;

			if(inviteId === process.env.CHOIRLESS_ALPHA_ID){
				invitationData = Promise.resolve({});
			} else {
				invitationData = invitations.get(inviteId);
			}
			
			invitationData
				.then(invitation => {
					
					if(!invitation){
						res.redirect(`/?msg=Sorry, we couldn't find that invitation.&msgtype=error`);
					} else if(invitation.expired){
						res.redirect(`/?msg=Sorry, that invitation has expired. Please ask the sender for another.&msgtype=error`);
					} else {
						
						res.render('account/create', { 
							title: "Choirless | Bringing people together, even when they're not together.", 
							bodyid: "accountCreate", 
							redirect : req.query.redirect,
							inviteId : inviteId
						});

					}

				})
				.catch(err => {
					debug('/account/create err:', err);
					res.status(500);
					next();
				})
			;
			
		}

	} else {
		res.redirect('/');
	}

});

router.post('/create', (req, res, next) => {

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.name && req.body.email && req.body.password && req.body.repeat_password && req.body.inviteId){

		if(req.body.password !== req.body.repeat_password){
			res.status(422);
			res.redirect('/account/create?msg=Password and repeated password did not match.&msgtype=error');
		}

		debug(req.query.redirect);

		let invitationData;

		if(req.body.inviteId === process.env.CHOIRLESS_ALPHA_ID){
			invitationData = Promise.resolve({
				choirId : process.env.CHOIRLESS_ALPHA_ID,
				invitee : req.body.email
			});
		} else {
			invitationData = invitations.get(req.body.inviteId);
		}

		invitationData
			.then(invitation => {

				if(!invitation){
					res.redirect(`/?msg=Sorry, we couldn't find that invitation.&msgtype=error`);
				} else if(invitation.expired){
					res.redirect(`/?msg=Sorry, that invitation has expired. Please ask the sender for another.&msgtype=error`);
				} else {

					if(invitation.invitee !== req.body.email){
						res.status(401);
						res.redirect(`/?msg=Sorry, the email you tried to create the account with doesn't match the address the invitation was sent to&msgtype=error`);
					} else {

						const userType = invitation.choirId ? "regular" : "admin";
						return users.add({
							name : req.body.name,
							email : req.body.email,
							password : req.body.password,
							userType : userType
						})
						.then(response => {
			
							if(response.ok === true){
								req.session = {};
								req.session.user = response.userId;
								req.session.name = req.body.name;
								req.session.userType = userType;
			
								const welcomeInfo = {
									to : req.body.email,
									subject : "Welcome to Choirless!",
									info : {
										name : req.body.name
									}
								};
			
								mail.send(welcomeInfo, 'welcome')
									.catch(err => {
										debug('An error occurred trying to send the welcome email.', err);
									})
								;
			
								if(req.query.redirect){
									res.redirect(decodeURIComponent(req.query.redirect));
								} else {
									res.redirect('/dashboard?msg=Account created! Welcome to Choirless :)&msgtype=success');
								}
			
							} else {
								throw response;
							}
	
						});
							
					}
					

				}

			})
			.catch(err => {

				debug('Create user err:', err);
				
				if(err.status === 409){
					// Account exists with this email address;
					const errMsg = `Sorry, we couldn't create that account.`;
					res.status(422);
					res.redirect(`/account/create?msg=${errMsg}&msgtype=error&redirect=${req.query.redirect}`);
				} else {
					
					const errMsg = `Sorry, an error ocurred during the creation of this account.`;
					
					res.status(err.status);
					res.redirect(`/account/create?msg=${errMsg}&msgtype=error&redirect=${req.query.redirect}`);

				}

			})

		;

	} else {
		res.status(422);
		next();
	}

});

router.get('/beta-interest', (req, res, next) => {

	res.render('account/beta_interest', { 
		title: "Choirless | Bringing people together, even when they're not together.", 
		bodyid: "accountLogin",
		redirect: req.query.redirect,
		inviteId : req.query.inviteId
	});

})

router.post('/beta-interest', (req, res, next) => {

	if(!req.body.email){
		res.redirect('/beta-interest?msg=Sorry, you need to include an email address to register your interest.&msgtype=error');
	} else if(!req.body.info){
		res.redirect('/beta-interest?msg=Sorry, you need to tell us a bit about yourself to register your interest.&msgtype=error');
	} else {
		
		betaInterestReceivees.forEach(person => {

			const msgInfo = {
				"to" : person,
				"subject" : "Choirless Beta Interest",
				"text" : `${req.body.email} has registered their interest for the Choirless beta.\nHere's the info they sent about their choir:\n\n ${req.body.info}`
			};
	
			mail.send(msgInfo)
				.then(function(){
					debug('Registered interest successfully forwarded on.');
					res.redirect("/?msg=Thank you for registering your interest in Choirless! We will get back to you as soon as possible.&msgtype=success");
				})
				.catch(err => {
					debug('/account/beta-interest err:', err);
					res.redirect("/?msg=Sorry, and error occurred in our systems. Please try again later.&msgtype=error");
				})
			;

		});


	}

});

router.get('/logout', (req, res, next) => {
	req.session = null;
	res.redirect('/');
});

module.exports = router;
