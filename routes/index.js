const express = require('express');
const router = express.Router();

const users = require(`../bin/modules/users`);

/* GET home page. */
router.get('/', function(req, res, next) {
	
	res.render('index', { 
		title: "Choirless | Bringing people together, even when they're not together.", 
		bodyid: "home",
	});

});

router.get('/about', function(req, res, next) {
	
	res.render('about', { 
		title: "Choirless | Bringing people together, even when they're not together.", 
		bodyid: "about",
	});

});

module.exports = router;
