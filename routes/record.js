const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('record', { title: 'Choirless | Record Piece', bodyid : "record" });
});

module.exports = router;
