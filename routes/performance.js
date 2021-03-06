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
						return `${leadVideo.partId}`;
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

router.get('/list-performances/:CHOIRID/:SONGID', (req, res, next) => {

	const apiRequests = [];

	apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID));
	apiRequests.push(choir.songs.get(req.params.CHOIRID, req.params.SONGID));

	Promise.all(apiRequests)
		.then(results => {

			const recordings = results[0];
			const songSections = results[1].partNames.map(section => {
				
				section.recordings = recordings.filter(recording => {
					return recording.partNameId === section.partNameId;
				});
				
				return section;
			});
			
			debug('Recordings:', recordings);
			debug('Sections:', songSections);
			
			res.json({
				sections : songSections
			});

		})
		.catch(err => {
			debug('/list-performances/:CHOIRID/:SONGID err:', err);
			res.end();
		})
	;

});

router.head('/video/:VIDEOIDENTIFIER', (req, res) => {


	let [choirId, songId, partId] = req.params.VIDEOIDENTIFIER.split('+');
	partId = partId.replace('.webm', '');
	
	const data = [];

	data.push(storage.check(req.params.VIDEOIDENTIFIER));
	data.push(choir.songs.recordings.get(choirId, songId, partId));

	Promise.all(data)
		.then(results => {

			const fileInfo = results[0];
			const offset = results[1].offset;

			debug('HEAD DATA:', fileInfo);
			res.set('Content-Length', fileInfo.ContentLength);
			res.set('X-Choirless-Offset', offset);
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

	const apiRequests = [];

	apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID));
	apiRequests.push(choir.members.check(req.params.CHOIRID, res.locals.user, true));

	Promise.all(apiRequests)
		.then(results => {

			const recordingInformation = results[0];
			const userInformation = results[1];

			let recordingType;

			// If it's the first part laid down it's: 'backing'
			// If the person uploading is a leader it's: 'reference'
			// Otherwise, it's: 'rendition'

			if(!userInformation){
				res.status(401);
				res.json({
					status : "err",
					msg : "Sorry, you're not a member of this choir."
				});
			} else {

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
					partType : recordingType,
					aspectRatio : `${req.body.width}:${req.body.height}`
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
