const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('create', { title: 'Express' });
});

router.get('/record', function(req, res, next) {
  res.render('record', { title: 'Express', bodyid : "record" });
});

module.exports = router;
