const debug = require('debug')('app:routes:dashboard');
const express = require('express');
const router = express.Router();

const users = require(`../bin/modules/users`);
const choir = require(`../bin/modules/choir`);

router.get('/', (req, res, next) => {

    users.get.choirs(req.session.user)
        .then(userChoirs => {

            debug("userChoirs:", userChoirs);

            res.render('dashboard', { 
                title : "Choirless | My Dashboard", 
                bodyid: "dashboard",
                userChoirs : userChoirs,
                loggedIn : !!req.session.user
            });

        })
        .catch(err => {
            debug('/ get.choirs err:', err);
            res.status(500);
            next();
        })
    ;

});


router.get('/choir/:CHOIRID/:VIEW?/:SONGID?', (req, res, next) => {

    const validViews = ['songs', 'members', 'song', 'settings'];

    if(!req.params.VIEW){
        req.params.VIEW = "songs"
    }

    if( validViews.indexOf(req.params.VIEW) === -1){
        res.redirect(`/dashboard/choir/${req.params.CHOIRID}`);
    } else {

        const requiredData = {};
        
        const apiRequests = [];
    
        apiRequests.push(users.get.choirs(req.session.user).then(data => { requiredData.userChoirInfo = data }) );
        apiRequests.push(choir.get(req.params.CHOIRID).then(data => { requiredData.choirInfo = data }) );
        apiRequests.push(choir.members.get(req.params.CHOIRID, true).then(data => { requiredData.choirMembers = data }) );
        
        if(req.params.VIEW === "songs"){
            apiRequests.push(choir.songs.getAll(req.params.CHOIRID).then(data => { requiredData.choirSongs = data }) );
        }

        if(req.params.VIEW === "song"){
            apiRequests.push(choir.songs.get(req.params.CHOIRID, req.params.SONGID).then(data => { requiredData.songInformation = data }) );
            apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID).then(data => { requiredData.recordings = data }) );
        }
    
        Promise.all(apiRequests)
            .then(function(){
                
                debug('requiredData:', requiredData);
    
                const userChoirInfo = requiredData.userChoirInfo;
                const choirInfo = requiredData.choirInfo;
                const choirSongs = requiredData.choirSongs;
                const choirMembers = requiredData.choirMembers;
                const songInformation = requiredData.songInformation;
                let songSections;
                const songRecordings = requiredData.recordings;

                if(songInformation){
                    songSections = songInformation.partNames.map(section => {

                        section.recordings = songRecordings.filter(recording => {
                            return recording.partNameId === section.partNameId
                        });

                        if(section.recordings.length === 0){
                            section.recordings = undefined;
                        }

                        return section;
                    });
                };

                const userChoirInfoIndex = choirMembers.map(member => member.userId).indexOf(req.session.user);
                const userIsMemberOfChoir = userChoirInfoIndex > -1;
                const memberType = userIsMemberOfChoir ? choirMembers[userChoirInfoIndex].memberType : null;

                if(choirInfo.createdByUserId !== req.session.user && !userIsMemberOfChoir){
                    res.status(401);
                    next();
                } else {
                    res.render('dashboard', { 
                        title : "Choirless | My Dashboard", 
                        bodyid: "dashboard",
                        userChoirs : userChoirInfo,
                        choirInfo : choirInfo,
                        songs : choirSongs,
                        members : choirMembers,
                        songInformation : songInformation,
                        songSections : songSections,
                        leadRecorded : !!songRecordings ? songRecordings.length !== 0 : false,
                        view : req.params.VIEW,
                        memberType : memberType,
                        loggedIn : !!req.session.user,
                        msg : req.query.msg ? decodeURIComponent(req.query.msg) : undefined,
                        msgType : req.query.msgtype
                    });
                }
    
    
            })
            .catch(err => {
                debug('/choir/:CHOIRID err:', err);
                res.status(500);
                next();
    
            })
        ;

    }
    

});

module.exports = router;
