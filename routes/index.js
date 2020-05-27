const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: "Choirless | All the world's a stage", bodyid: "home" });
});

router.get('/dashboard', (req, res, next) => {
	res.render('dashboard', { title : "Choirless | My Dashboard", bodyid: "dashboard" } );
});

module.exports = router;
