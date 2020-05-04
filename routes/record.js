const debug = require('debug')('app:routes:record');
const express = require('express');
const router = express.Router();
const uuid = require('uuid/v4');
const multer = require('multer');
const upload = multer();
const storage = require(`${__dirname}/../bin/lib/storage`);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('record', { title: 'Choirless | Record Piece', bodyid : "record" });
});

router.post('/save', upload.single('video'), function(req, res, next) {
  
  debug(req.file)

  const filename = `${uuid()}.webm`

  storage.put(filename, req.file.buffer)
    .then(() => {
      debug(`Video ${filename} stored :D`)
    })
    .catch(err => {
      debug("Storage err:", err);
    })
  ;

  res.end();


});

module.exports = router;
