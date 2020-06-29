const debug = require('debug')('app:routes:record');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const storage = require(`${__dirname}/../bin/lib/storage`);

const choir = require(`../bin/modules/choir`);
const users = require(`../bin/modules/users`);

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
						bodyid : 'record',
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

router.get('/preview/:CHOIRID/:SONGID', (req, res, next) => {

	choir.members.check(req.params.CHOIRID, res.locals.user)
		.then(userInformation => {
			
			if(!userInformation){
				res.status(422);
				next()
			} else {

				const apiRequests = [];

				apiRequests.push(choir.songs.sections.getAll(req.params.CHOIRID, req.params.SONGID));
				apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID));

				Promise.all(apiRequests)
					.then(results => {
						
						const sections = results[0].map(section => {
							section.recordings = [];
							return section;
						});
						const recordings = results[1];
						
						debug('sections:', sections);
						debug('recordings:', recordings);

						recordings.forEach(recording => {

							for(let x = 0; x < sections.length; x += 1){
								if(recording.partNameId === sections[x].partNameId){
									sections[x].recordings.push(recording);
									break;
								}
							}

						});

						debug('adjusted sections:', sections);

						res.render('preview', {
							title : 'Choirless | Preview song',
							bodyid : 'preview',
							choirId : req.params.CHOIRID,
							songId : req.params.SONGID,
							sections : sections
						});

					})
				;

				
			}

		})


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

router.post('/save/:CHOIRID/:SONGID/:SECTIONID', upload.single('video'), function(req, res) {
  
	debug(req.file)
	debug(req.params.CHOIRID, req.params.SONGID, req.params.SECTIONID);
	debug(req.body.offset);

	const apiRequests = [];

	apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID));
	apiRequests.push(choir.members.check(req.params.CHOIRID, res.locals.user, true));

	Promise.all(apiRequests)
		.then(results => {

			const recordingInformation = results[0];
			const userInformation = results[1];

			if(!userInformation){
				res.status(401);
				next();
			} else {

				let recordingType;
	
				// If it's the first part laid down it's: 'backing'
				// If the person uploading is a leader it's: 'reference'
				// Otherwise, it's: 'rendition'
	
				if(recordingInformation.length === 0){
					recordingType = 'backing';
				} else if(userInformation.memberType === 'leader'){
					recordingType = 'reference';
				} else{
					recordingType = 'rendition';
				}
	
				const recordingData = {
					choirId : req.params.CHOIRID,
					songId : req.params.SONGID,
					partNameId : req.params.SECTIONID,
					userId : res.locals.user,
					offset : req.body.offset,
					partType : recordingType
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

			}

		})
		.catch(err => {
			debug('/save/:CHOIRID/:SONGID/:SECTIONID err:', err);
			res.status(500);
			res.end();
		})
	;



});

module.exports = router;
