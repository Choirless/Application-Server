const debug = require('debug')('app:routes:record');
const express = require('express');
const router = express.Router();
const uuid = require('uuid/v4');
const multer = require('multer');
const upload = multer();
const storage = require(`${__dirname}/../bin/lib/storage`);

router.get('/record', function(req, res, next) {
  res.render('record', { 
	  title: 'Choirless | Record Piece', 
	  bodyid : "record",
	  loggedIn : !!req.session.user
	});
});

router.post('/save', upload.single('video'), function(req, res, next) {
  
	debug(req.file)

	const filename = `${uuid()}.webm`

	storage.put(filename, req.file.buffer)
		.then(() => {
			debug(`Video ${filename} stored :D`);
			res.end();
		})
		.catch(err => {
			debug("Storage err:", err);
			res.status(500);
			res.end();
		})
	;

});

module.exports = router;
