const debug = require('debug')('app:routes:record');
const express = require('express');
const router = express.Router();
const uuid = require('uuid/v4');
const multer = require('multer');
const upload = multer();
const storage = require(`${__dirname}/../bin/lib/storage`);

const choir = require(`../bin/modules/choir`);

router.get('/record/:CHOIRID/:SONGID/:SECTIONID', function(req, res, next) {

	choir.songs.get(req.params.CHOIRID, req.params.SONGID)
		.then(songInformation => {

			debug(songInformation);

			const leadSection = songInformation.partNames.filter(part => part.name === "Lead")[0];
			const thisSection = songInformation.partNames.filter(part => part.partNameId === req.params.SECTIONID)[0];
			
			let getLeadVideoIdentifier;

			if(thisSection.partNameId === leadSection.partNameId){
				getLeadVideoIdentifier = Promise.resolve(null);
			} else {
				getLeadVideoIdentifier = choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID)
					.then(recordings => {
						const leadVideo = recordings.filter(recording => recording.partNameId === leadSection.partNameId)[0];
						return `${leadVideo.choirId}+${leadVideo.songId}+${leadVideo.partId}`;
					})
				;
			}

			return getLeadVideoIdentifier
				.then(leadVideoIdentifier => {

					debug(leadVideoIdentifier);
					res.render('record', { 
						title: 'Choirless | Record Piece', 
						bodyid : "record",
						choirId : req.params.CHOIRID,
						songId : req.params.SONGID,
						partNameId : req.params.SECTIONID,
						partName : thisSection.name,
						leadVideoIdentifier : leadVideoIdentifier
					});
					
				})
			;

		})
		.catch(err => {
			debug('/record/:CHOIRID/:SONGID/:SECTIONID err:', err);
			res.status(500);
			next();
		})
	;

});

router.head('/video/:VIDEOIDENTIFIER', (req, res, next) => {
	storage.check(req.params.VIDEOIDENTIFIER)
		.then(data => {
			debug(data);
			res.set('Content-Length', data.ContentLength)
			res.end();
		})
		.catch(err => {
			debug(err);
		});
	;
});

router.get('/video/:VIDEOIDENTIFIER', (req, res, next) => {

	storage.check(req.params.VIDEOIDENTIFIER)
		.then(existence => {
			debug(existence);
			if(existence){
				res.set('Content-Type', 'video/webm');
				storage.getStream(req.params.VIDEOIDENTIFIER).pipe(res)
			} else {
				res.status(404);
				next();
			}
		})
	;

});

router.post('/save/:CHOIRID/:SONGID/:SECTIONID', upload.single('video'), function(req, res, next) {
  
	debug(req.file)
	debug(req.params.CHOIRID, req.params.SONGID, req.params.SECTIONID);
	debug(req.body.offset);

	const recordingData = {
		choirId : req.params.CHOIRID,
		songId : req.params.SONGID,
		partNameId : req.params.SECTIONID,
		userId : res.locals.user,
		offset : req.body.offset
	};

	choir.songs.recordings.add(recordingData)
		.then(partId => {

			const filename = `${req.params.CHOIRID}+${req.params.SONGID}+${partId}.webm`
		
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

		})
	;


});

module.exports = router;
