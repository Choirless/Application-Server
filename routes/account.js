const debug = require('debug')("routes:account");
const express = require('express');
const router = express.Router();

const users = require(`${__dirname}/../bin/modules/users`);
const mail = require(`${__dirname}/../bin/modules/emails`);
const invitations = require(`${__dirname}/../bin/modules/invitations`);

router.get('/login', function(req, res, next) {

	if(!req.session.user){
		res.render('account/login', { 
			title: "Choirless | Bringing people together, even when they're not together.", 
			bodyid: "accountLogin",
			redirect: req.query.redirect,
			inviteId : req.query.inviteId
		});
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
			
			invitations.get(inviteId)
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

		invitations.get(req.body.inviteId)
			.then(invitation => {

				if(!invitation){
					res.redirect(`/?msg=Sorry, we couldn't find that invitation.&msgtype=error`);
				} else if(invitation.expired){
					res.redirect(`/?msg=Sorry, that invitation has expired. Please ask the sender for another.&msgtype=error`);
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
		
					})

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

router.get('/logout', (req, res, next) => {
	req.session = null;
	res.redirect('/');
});

module.exports = router;
