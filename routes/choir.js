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

router.post('/create-song', (req, res, next) => {

    debug(req.body);

    if(!req.body.name || !req.body.choirId){
        res.status(422);
        next();
    } else {

        const songData = {
            userId : req.session.user,
            choirId : req.body.choirId,
            name : req.body.name,
            description : req.body.description
        };

        songData.userId = req.session.user;

        choirInterface.songs.add(songData)
            .then(songId => {

                debug('Song successfully created:', songId);

                const sectionsToCreate = [];

                Object.keys(req.body).forEach(key => {
                    if(key.indexOf('part-') > -1){

                        if(req.body[key] === "Lead (default)"){
                            sectionsToCreate.push('Lead');
                        } else if(req.body[key] !== "") {
                            sectionsToCreate.push(req.body[key]);
                        }

                    }
                })

                const createProcesses = sectionsToCreate.map((part, idx) => {

                    return new Promise( (resolve, reject) => {
                        setTimeout(function(){
                            choirInterface.songs.sections.add(req.body.choirId, songId, part)
                                .then(result => {
                                    resolve(result);
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        }, idx * 100);

                    } );

                });

                return Promise.all(createProcesses)
                    .then(function(){
                        return songId;
                    })
                ;

            })
            .then(songId => {
                res.redirect(`/dashboard/choir/${req.body.choirId}/song/${songId}`)
            })
            .catch(err => {
                debug('/create-song err:', err);
                res.status(500);
                next();
            })
        ;

    }

});

router.post('/add-member', (req, res, next) => {

    if(!req.body.email){
        res.status(422);
        res.redirect(`/dashboard/choir/${req.body.choirId}/members?err=noemail`);
    } else if(!req.body.choirId){
        res.status(422);
        res.redirect('/dashboard?err=nochoir');
    } else {

        choirInterface.get(req.body.choirId)
            .then(choirData => {
                
                debug(choirData.createdByUserId, req.session.user);

                if(choirData.createdByUserId === req.session.user){

                    choirInterface.members.invitations.create(req.body.choirId, req.session.user, req.body.email)
                        .then(inviteId => {
                            debug(`Invitation (${inviteId}) created by ${req.session.userId} for ${req.body.email} to join ${req.body.choirId}`);
                            const successMessage = `Invitation to "${req.body.email}" has been sent. If they accept, they will have access to your choir and appear here.`;
                            res.redirect(`/dashboard/choir/${req.body.choirId}/members?msg=${successMessage}&msgtype=success`);
                        })
                        .catch(err => {
                            res.status(500);
                            next();
                        })
                    ;

                } else {
                    const errMsg = ``
                    res.redirect(`/dashboard/choir/${req.body.choirId}/members?msg=${errMsg}&msgtype=error`);
                }

            })
            .catch(err => {
                debug('/choir/add-member err:', err);
            })
        ;

    }

});

module.exports = router;