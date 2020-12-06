const debug = require('debug')('app:routes:dashboard');
const express = require('express');
const router = express.Router();

const users = require(`../bin/modules/users`);
const choir = require(`../bin/modules/choir`);
const storage = require('../bin/lib/storage');
const generateNotification = require(`${__dirname}/../bin/modules/generate_notification`);

const CHOIR_LIST_MAX_INITAL_SIZE = process.env.CHOIR_LIST_MAX_INITAL_SIZE || 6;

router.get('/', (req, res, next) => {

    users.get.choirs(res.locals.user)
        .then(userChoirs => {

            if(userChoirs.length === 1){
                res.redirect(`/dashboard/choir/${userChoirs[0].choirId}`);
            } else {
                res.render('dashboard', { 
                    title : "Choirless | My Dashboard", 
                    bodyid: "dashboard",
                    userChoirs : userChoirs.sort( (a, b) => {return a.name >= b.name ? 1 : -1; } ),
                    choirListMaxSize : CHOIR_LIST_MAX_INITAL_SIZE
                });
            }


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

        choir.members.check(req.params.CHOIRID, res.locals.user)
            .then(userInformationForChoir => {
                debug(userInformationForChoir);

                if(userInformationForChoir){
                    
                    requiredData.userInfo = userInformationForChoir;

                    if(req.params.VIEW === "members" && userInformationForChoir.memberType !== "leader"){
                        res.redirect(`/dashboard/choir/${req.params.CHOIRID}?${generateNotification("Sorry, only choir leaders can see member information.", "error")}`);
                    } else {

                        apiRequests.push(users.get.choirs(res.locals.user).then(data => { requiredData.userChoirInfo = data }) );
                        apiRequests.push(choir.get(req.params.CHOIRID).then(data => { requiredData.choirInfo = data }) );
                        
                        if(req.params.VIEW === "songs"){
                            apiRequests.push(choir.songs.getAll(req.params.CHOIRID, true).then(data => { requiredData.choirSongs = data.map(song => {song.numberOfSections = song.partNames.length || 0; song.numberOfRecordings = song.recordings.length || 0; return song;}) }));
                        }
                        
                        if(req.params.VIEW === "song"){
                            apiRequests.push(choir.songs.get(req.params.CHOIRID, req.params.SONGID).then(data => { requiredData.songInformation = data }) );
                            apiRequests.push(choir.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID).then(data => { requiredData.recordings = data }) );
                            apiRequests.push(storage.check(`${req.params.CHOIRID}+${req.params.SONGID}+auto-final.mp4`, process.env.COS_RENDER_BUCKET).then(data => {requiredData.render = data}));   
                        }
                        
                        if(req.params.VIEW === "members"){
                            apiRequests.push(choir.members.get(req.params.CHOIRID, true).then(data => { requiredData.choirMembers = data }) );
                        }
                        
                        return Promise.all(apiRequests)
                            .then(function(){
                            
                                const userChoirInfo = requiredData.userChoirInfo;
                                const choirInfo = requiredData.choirInfo;
                                let choirSongs = requiredData.choirSongs;
                                const choirMembers = requiredData.choirMembers || [];
                                const songInformation = requiredData.songInformation;
                                let songSections;
                                const songRecordings = requiredData.recordings;
                
                                const renderURL = requiredData.render ? `${process.env.COS_PUBLIC_STORAGE_URL}/${req.params.CHOIRID}+${req.params.SONGID}+auto-final.mp4?ts=${Number(Date.now())}` : undefined;
                
                                if(songInformation){
                                    songSections = songInformation.partNames.map(section => {
                
                                        section.recordings = songRecordings.filter(recording => {
                                            return recording.partNameId === section.partNameId;
                                        });
                
                                        if(section.recordings.length === 0){
                                            section.recordings = undefined;
                                        }
                
                                        return section;
                                    });
                                };
                                
                                res.render('dashboard', { 
                                    title : `Choirless | My Dashboard ${choirInfo ? `| ${choirInfo.name} ` : ""} ${songInformation ? `| ${songInformation.name}` : "" }`, 
                                    bodyid: "dashboard",
                                    userChoirs : userChoirInfo.sort( (a, b) => {return a.name >= b.name ? 1 : -1; } ),
                                    choirInfo : choirInfo,
                                    songs : choirSongs,
                                    members : choirMembers,
                                    songInformation : songInformation,
                                    songSections : songSections,
                                    leadRecorded : !!songRecordings ? songRecordings.length !== 0 : false,
                                    view : req.params.VIEW,
                                    memberType : requiredData.userInfo.memberType,
                                    render : renderURL,
                                    choirListMaxSize : CHOIR_LIST_MAX_INITAL_SIZE
                                });
                
                            })
                        ;

                    }

                } else {
                    res.redirect(`/dashboard?${generateNotification("Sorry, you're not a member of that choir.", "error")}`);
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
