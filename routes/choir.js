const debug = require('debug')('app:routes:choir');
const express = require('express');
const router = express.Router();

const choirInterface = require(`${__dirname}/../bin/modules/choir`);

router.post('/create', (req, res, next) => {

    debug('CREATE CHOIR:', req.session.user, req.body.name, req.body.description);

    if(!req.body.name || req.body.name === ""){
        res.status(500);
        next();
    } else {

        choirInterface.create(req.session.user, req.body.name, req.body.description)
            .then((response) => {
                
                debug(response);
                res.redirect('/dashboard');

            })
            .catch(err => {
                res.status(500);
                debug('/choir/create err:', err);
                next();
            })
        ;

    }


});

router.post('/update/:CHOIRID', (req, res, next) => {

    choirInterface.update(req.session.user, req.params.CHOIRID, req.body)
        .then(result => {
            debug('result');
            res.redirect(`/dashboard/choir/${req.params.CHOIRID}`);
        })
        .catch(err => {
            debug(`/choir/update/:CHOIRID err`, err);
            res.status(500);
            next();
        })
    ;

});

router.post('/create-song', (req, res) => {

    debug(req.body);

    if(!req.body.name){
        res.status(422);
        next();
    } else {

        const songData = {
            partNames : []
        };
        
        Object.keys(req.body).map(key => {
    
            if(key.indexOf('part') === 0){

                if(req.body[key] !== ""){
                    if(req.body[key] === "Lead (default)"){
                        req.body[key] = "Lead";
                    }
                    songData.partNames.push(req.body[key]);
                }

            } else {
                songData[key] = req.body[key];
            }
    
        });
        
        debug("songData:", songData);

        songData.userId = req.session.user;

        choirInterface.songs.add(songData)
            .then(songId => {
                debug(`Song "${songData.name}" successfully created with id "${songId}" in choir "${songData.choirId}"`);
                res.redirect(`/dashboard/choir/${songData.choirId}`);
            })
        ;


    }

});

module.exports = router;