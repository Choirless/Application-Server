const express = require('express');
const router = express.Router();
const debug = require('debug')("routes:account");

const users = require(`${__dirname}/../bin/modules/users`);
const mail = require(`${__dirname}/../bin/modules/email`);

router.get('/login', function(req, res, next) {

	if(!req.session.user){
		res.render('account/login', { 
			title: "Choirless | All the world's a stage", 
			bodyid: "accountLogin",
			redirect: req.query.redirect
		});
	} else {
		res.redirect('/');
	}

});

router.post('/login', (req, res, next) => {

	debug("SESH:", req.session);

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.email && req.body.password){

		users.login(req.body.email, req.body.password)
			.then(data => {

				if(data){
				
					if(data.ok !== true){
						res.status(401);
						res.send("user/pass mismatch");
					} else {

						debug(data);
						req.session.user = data.user.userId;
						req.session.name = data.user.name;

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
				res.json({
					status : "err",
					msg : "Could not login with email/pass combination"
				});
			})
		;

	} else {
		res.status(422);
		next();
	}


});

router.get('/create', function(req, res, next) {

	if(!req.session.user){
		res.render('account/create', { title: "Choirless | All the world's a stage", bodyid: "accountCreate", redirect : req.query.redirect });
	} else {
		res.redirect('/');
	}

});

router.post('/create', (req, res, next) => {

	debug('/create', req.body);

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.name && req.body.email && req.body.password && req.body.repeat_password){

		if(req.body.password !== req.body.repeat_password){
			res.status(422);
			res.send('Password and repeated password did not match');
		}

		debug(req.query.redirect)

		users.add({
				name : req.body.name,
				email : req.body.email,
				password : req.body.password
			})
			.then(response => {

				if(response.ok === true){
					req.session = {};
					req.session.user = response.userId;
					req.session.name = req.body.name;

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
