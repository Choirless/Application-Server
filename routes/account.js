const express = require('express');
const router = express.Router();
const debug = require('debug')("routes:account");
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');

const saltRounds = process.env.SALT_ROUNDS || 10;

const users = require(`${__dirname}/../bin/modules/users`);

const UUIDRegex = `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`;

router.get('/login', function(req, res, next) {

	if(!req.session.user){
		res.render('account/login', { title: "Choirless | All the world's a stage", bodyid: "accountLogin" });
	} else {
		res.redirect('/');
	}

});

router.get('/create', function(req, res, next) {

	if(!req.session.user){
		res.render('account/create', { title: "Choirless | All the world's a stage", bodyid: "accountCreate" });
	} else {
		res.redirect('/');
	}

});

router.post('/login', (req, res, next) => {

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.username && req.body.password){

		users.get.byUsername(req.body.name)
			.then(user => {
				
				if(!user){
					res.status(422);
					res.end();
				} else {

					bcrypt.compare(req.body.password, user.password, (err, result) => {

						if(err){
							throw err;
						} else {
							if(result === true){
								req.session.user = user.uuid;
								res.redirect('/');
							} else {
								res.send("user/pass mismatch");
							}
						}

					})

				}

			})
			.catch(err => {
				debug('Login err:', err);
				res.status(500);
				res.end();
			})
		;

	} else {
		res.status(422);
		next();
	}


});

router.post('/create', (req, res, next) => {

	debug('/create', req.body);

	if(req.session.user){
		res.redirect('/');
	} else if(req.body.username && req.body.password && req.body.repeat_password){

		if(req.body.password !== req.body.repeat_password){
			res.status(422);
			res.send('Password and repeated password did not match');
		}

		bcrypt.hash(req.body.password, saltRounds)
			.then(passwordHash => {

				users.get.byUsername(req.body.username)
					.then(user => {

						if(user){
							res.status(422);
							res.send("Could not create account with that username");
						} else {
							
							const userData = {
								username : req.body.username,
								password : passwordHash,
								uuid : uuid()
							};

							users.add(userData)
								.then(result => {
									debug(result);
									res.redirect('/account/login');
								})
								.catch(err => {
									debug(err);
									res.status(500);
									next();
								})
							;

						}

					})
					.catch(err => {
						debug('User creation err:', err);
					})
				;

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
