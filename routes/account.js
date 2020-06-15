const express = require('express');
const router = express.Router();
const debug = require('debug')("routes:account");

const users = require(`${__dirname}/../bin/modules/users`);

router.get('/login', function(req, res, next) {

	if(!req.session.user){
		res.render('account/login', { 
			title: "Choirless | All the world's a stage", 
			bodyid: "accountLogin",
			loggedIn : !!req.session.user
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
						req.session.user = data.user.userId;
						res.redirect('/');
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
		res.render('account/create', { title: "Choirless | All the world's a stage", bodyid: "accountCreate" });
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

		users.add({
				name : req.body.name,
				email : req.body.email,
				password : req.body.password
			})
			.then(response => {

				if(response.ok === true){
					req.session = {};
					req.session.user = response.userId;
					res.redirect('/');
				} else {
					throw response;
				}

			})
			.catch(err => {

				debug('Create user err:', err);
				
				if(err.status === 409){
					// Account exists with this email address;
					res.status(409);
					res.json({
						status : "err",
						msg : "An account already exists with that email account"
					});
				} else {
					
					res.status(err.status);
					res.json({
						status : "err",
						msg : "Could not create account with that username."
					});

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
