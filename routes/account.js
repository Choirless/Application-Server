const express = require('express');
const router = express.Router();
const debug = require('debug')("routes:account");
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');

const saltRounds = process.env.SALT_ROUNDS || 10;

const users = require(`${__dirname}/../bin/modules/users`);

const UUIDRegex = `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`;

router.get('/login', function(req, res, next) {
	res.render('account/login', { title: "Choirless | All the world's a stage", bodyid: "accountLogin" });
});

router.get('/create', function(req, res, next) {
	res.render('account/create', { title: "Choirless | All the world's a stage", bodyid: "accountCreate" });
});

/*router.post('/login', (req, res, next) => {

	if(req.body.name && req.body.password){

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
								res.send("Success!");
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
	}

	res.end();

});*/

router.post('/create', (req, res, next) => {

	debug('/create', req.body);

	if(req.body.username && req.body.password){

		bcrypt.hash(req.body.password, saltRounds)
			.then(passwordHash => {

				const userData = {
					username : req.body.username,
					password : passwordHash,
					uuid : uuid()
				};

				users.add(userData)
					.then(result => {
						debug(result);
						
						res.end();
					})
					.catch(err => {
						debug(err);
						res.status(500);
						next();
					})
				;

			})
		;

	} else {
		res.status(422);
		next();
	}

	res.end();

});

module.exports = router;
