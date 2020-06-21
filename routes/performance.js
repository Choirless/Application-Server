const debug = require('debug')('app:routes:record');
const express = require('express');
const router = express.Router();
const uuid = require('uuid/v4');
const multer = require('multer');
const upload = multer();
const storage = require(`${__dirname}/../bin/lib/storage`);

const choir = require(`../bin/modules/choir`);

router.get('/record/:CHOIRID/:SONGID/:PARTNAMEID', function(req, res, next) {

	choir.songs.get(req.params.CHOIRID, req.params.SONGID)
		.then(songInformation => {

			res.render('record', { 
				title: 'Choirless | Record Piece', 
				bodyid : "record",
				loggedIn : !!req.session.user,
				choirId : req.params.CHOIRID,
				songId : req.params.SONGID,
				partNameId : req.params.PARTNAMEID,
				partName : songInformation.partNames.filter(part => part.partNameId === req.params.PARTNAMEID)[0].name
			});

		})
		.catch(err => {
			debug('/record/:CHOIRID/:SONGID/:PARTNAMEID err:', err);
			res.status(500);
			next();
		})
	;


});

router.post('/save/:CHOIRID/:SONGID/:PARTNAMEID', upload.single('video'), function(req, res, next) {
  
	debug(req.file)
	debug(req.params.CHOIRID, req.params.SONGID, req.params.PARTNAMEID);

	const filename = `${req.params.CHOIRID}:${req.params.SONGID}:.webm`

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
