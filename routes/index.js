const express = require('express');
const router = express.Router();

const users = require(`../bin/modules/users`);

/* GET home page. */
router.get('/', function(req, res, next) {
	
	res.render('index', { 
		title: "Choirless | All the world's a stage", 
		bodyid: "home",
		loggedIn : !!req.session.user
	});

});

module.exports = router;
