const debug = require('debug')('app:routes:choir');
const express = require('express');
const router = express.Router();

const choirInterface = require(`${__dirname}/../bin/modules/choir`);
const usersInterface = require(`${__dirname}/../bin/modules/users`);
const mailInterface = require(`${__dirname}/../bin/modules/emails`);
const invitationsInterface = require(`${__dirname}/../bin/modules/invitations`);
const storage = require(`${__dirname}/../bin/lib/storage`);
const generateNotification = require(`${__dirname}/../bin/modules/generate_notification`);

router.post('/create', (req, res, next) => {

    debug('CREATE CHOIR:', res.locals.user, req.body.name, req.body.description);

    if(!req.body.name || req.body.name === ""){
        res.status(500);
        next();
    } else {

        usersInterface.get.byID(res.locals.user)
            .then(userInformation => {

                if(userInformation.userType !== 'admin'){

                    res.status(401);
                    res.json({
                        status : "err",
                        msg : "Only Choirless 'admin' users can create choirs at this time."
                    });

                } else {

                    return choirInterface.create(res.locals.user, req.body.name, req.body.description)
                        .then((response) => {

                            debug(response);
                            res.redirect(`/dashboard/choir/${response.choirId}?${generateNotification(`Choir "${req.body.name}" has been created.`, "success")}`);

                        })
                    ;

                }
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

    choirInterface.update(res.locals.user, req.params.CHOIRID, req.body)
        .then(result => {
            debug('result');
            res.redirect(`/dashboard/choir/${req.params.CHOIRID}?${generateNotification(`Choir details have been successfully updated`, "success")}`);
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
            userId : res.locals.user,
            choirId : req.body.choirId,
            name : req.body.name,
            description : req.body.description
        };

        const sectionsToCreate = [];

        Object.keys(req.body).forEach(key => {
            if(key.indexOf('part-') > -1){

                if(req.body[key] === "Lead (default)"){
                    sectionsToCreate.push('Lead');
                } else if(req.body[key] !== "") {
                    sectionsToCreate.push(req.body[key]);
                }

            }
        });

        songData.partNames = sectionsToCreate;

        choirInterface.songs.add(songData)
            .then(songId => {
                debug('Song successfully created:', songId);
                res.redirect(`/dashboard/choir/${req.body.choirId}/song/${songId}?${generateNotification(`New song "${songData.name}" added to choir`, "success")}`);
            })
            .catch(err => {
                debug('/create-song err:', err);
                res.status(500);
                next();
            })
        ;

    }

});

router.post('/delete-song/:CHOIRID/:SONGID', (req, res, next) => {

    const apiRequests = [];

    apiRequests.push(choirInterface.members.check(req.params.CHOIRID, res.locals.user));
    apiRequests.push(choirInterface.songs.get(req.params.CHOIRID, req.params.SONGID));
    apiRequests.push(choirInterface.songs.recordings.getAll(req.params.CHOIRID, req.params.SONGID));

    Promise.all(apiRequests)
        .then(results => {

            const choirMemberInfo = results[0];
            const songInfo = results[1];
            const recordingsInfo = results[2];

            debug(choirMemberInfo, songInfo, recordingsInfo);

            if(choirMemberInfo && songInfo){

                if(choirMemberInfo.memberType === "leader"){

                    const deletionActions = recordingsInfo.map(recording => {
                        return choirInterface.songs.recordings.delete(req.params.CHOIRID, req.params.SONGID, recording.partId);
                    });

                    deletionActions.push(choirInterface.songs.delete(req.params.CHOIRID, req.params.SONGID));

                    return Promise.all(deletionActions);

                } else {
                    res.redirect(`/dashboard/choir/${req.params.CHOIRID}/song/${req.params.SONGID}?${generateNotification(`Sorry, you have to be a choir leader to delete this song.`, "notice")}`);
                }

            }

        })
        .then(function(){
            res.redirect(`/dashboard/choir/${req.params.CHOIRID}?${generateNotification(`Song successfully deleted.`, "success")}`);
        })
        .catch(err => {
            debug(`/choir/delete-song/${req.params.CHOIRID}/${req.params.SONGID} err:`, err)
        })
    ;

});

router.post('/delete-recording/:CHOIRID/:SONGID/:PARTID', (req, res, next) => {

    const apiRequests = [];

    apiRequests.push(choirInterface.members.check(req.params.CHOIRID, res.locals.user));
    apiRequests.push(choirInterface.songs.recordings.get(req.params.CHOIRID, req.params.SONGID, req.params.PARTID));

    Promise.all(apiRequests)
        .then(results => {

            const choirMemberInfo = results[0];
            const recordingInfo = results[1];

            debug(results);

            if(choirMemberInfo){

                if(choirMemberInfo.memberType === "leader" || choirMemberInfo.userId === recordingInfo.userId){

                    const deletionProcesses = [];
                    const fileKey = `${req.params.CHOIRID}+${req.params.SONGID}+${req.params.PARTID}.webm`;

                    deletionProcesses.push(storage.delete(fileKey))
                    deletionProcesses.push(choirInterface.songs.recordings.delete(req.params.CHOIRID, req.params.SONGID, req.params.PARTID))

                    return Promise.all(deletionProcesses);

                } else {
                    res.status(401);
                    res.redirect(`/dashboard/choir/${req.params.CHOIRID}/song/${req.params.SONGID}?${generateNotification(`Sorry, you don't have the authority to delete this recording.`, "notice")}`);
                }

            } else {
                res.status(401);
                res.redirect(`/dashboard/?${generateNotification(`Sorry, you're not a member of this choir.`, "error")}`);
            }

        })
        .then(function(){
            res.redirect(`/dashboard/choir/${req.params.CHOIRID}/song/${req.params.SONGID}?${generateNotification(`Recording successfully deleted.`, "success")}`);
        })
        .catch(err => {
            debug('/delete-recording err:', err);
            res.status(500);
            res.redirect(`/dashboard/choir/${req.params.CHOIRID}/song/${req.params.SONGID}?${generateNotification(`Sorry, something went wrong deleting that recording.`, "error")}`);
        })
    ;



});

router.post('/add-song-part', (req, res, next) => {

    let errMsg;

    if(!req.body.name){
        errMsg = "Sorry, no name was passed to the server for the part.";
    } else if(!req.body.choirId){
        errMsg = "Sorry, a valid choir was not passed for that operation.";
    } else if(!req.body.songId){
        errMsg = "Sorry, a valid song was not passed for that operation.";
    }

    if(errMsg){
        res.status(422);
        res.redirect(`/dashboard?${generateNotification(`${errMsg}`, "error")}`);
    } else {

        choirInterface.members.check(req.body.choirId, res.locals.user)
            .then(userInfo => {

                if(userInfo){

                    if(userInfo.memberType === "leader"){
                        return choirInterface.songs.sections.add(req.body.choirId, req.body.songId, req.body.name);
                    } else {
                        const errMsg = `Sorry, only leaders of choirs can add new parts to a song.`;
                        res.redirect(`/dashboard/choir/${req.body.choirId}?${generateNotification(`${errMsg}`, "error")}`);
                    }

                } else {
                    const errMsg = `Sorry, you have to be a member of this choir to make changes.`;
                    res.redirect(`/dashboard/choir/${req.body.choirId}?${generateNotification(`${errMsg}`, "error")}`);
                }

            })
            .then(songId => {
                res.redirect(`/dashboard/choir/${req.body.choirId}/song/${songId}`)
            })
            .catch(err => {
                debug('/add-song-part err:', err);
                res.status(500);
                next(err);
            })


    }


});

router.get('/join/:CHOIRID/:INVITEID', (req, res, next) => {

    choirInterface.get(req.params.CHOIRID)
        .then(choirInformation => {

            if(choirInformation.unknown === true){
                res.redirect(`/dashboard?${generateNotification('Sorry, that choir does not exist.', "error")}`);
            } else {

                choirInterface.members.check(req.params.CHOIRID, res.locals.user)
                    .then(result => {

                        if(result !== undefined){
                            res.status(422);
                            res.redirect(`/dashboard/choir/${req.params.CHOIRID}?${generateNotification(`You're already a member of that choir!`, "notification")}`);
                        } else {
                            const informationRequests = [];

                            informationRequests.push( usersInterface.get.byID( res.locals.user ) );
                            informationRequests.push( choirInterface.members.invitations.get( req.params.INVITEID ) );

                            Promise.all(informationRequests)
                                .then(results => {

                                    const userInfo = results[0];
                                    const invitationInfo = results[1];

                                    debug(userInfo);
                                    debug(invitationInfo);

                                    if(invitationInfo.expired){ // Invite is now invalid
                                        const expiredMsg = "Sorry, that invitation has expired. Please ask the choir leader to send another.";
                                        res.redirect(`/dashboard?${generateNotification(`${expiredMsg}`, "error")}`);
                                    } else if(!invitationInfo.invitee || userInfo.email.toLowerCase() === invitationInfo.invitee.toLowerCase()){
                                        return choirInterface.join(req.params.CHOIRID, res.locals.user, userInfo.name, "member");
                                    } else { // If this person is the wrong person, throw them out.
                                        res.redirect(`/dashboard?${generateNotification(`Sorry, the invitation you used is not valid for this account. Please check the email account you're using for your Choirless account matches to email address you received the invitation for.`, "notice")}`);
                                    }

                                })
                                .then(function(){
                                    res.redirect(`/dashboard/choir/${req.params.CHOIRID}?${generateNotification(`You've joined the choir!`, "success")}`);
                                })
                            ;
                            
                        }

                    })
                ;

            }

        })
        .catch(err => {
            debug('/join/:CHOIRID/:INVITEID err:', err);
            res.status(500);
            res.redirect(`/dashboard?${generateNotification("Sorry, we couldn't add you to that choir", "error")}`)
        })
    ;

});

router.post('/add-member', (req, res, next) => {

    if(!req.body.email){
        res.status(422);
        res.redirect(`/dashboard/choir/${req.body.choirId}/members?${generateNotification(`No email was passed to invite a new member`, "error")}`);
    } else if(!req.body.choirId){
        res.status(422);
        res.redirect(`/dashboard?${generateNotification(`No choir ID was passed to invite a user to`, "error")}`);
    } else {

        choirInterface.members.get(req.body.choirId)
            .then(members => {

                const thisMembersDetails = members.filter(member => member.userId === res.locals.user)[0];

                if(!thisMembersDetails){

                    res.redirect(`/dashboard?${generateNotification(`Sorry, you are not a member of this choir.`, "error")}`);

                } else if(thisMembersDetails.memberType === "leader"){

                    choirInterface.members.invitations.create(req.body.choirId, res.locals.user, req.body.email)
                        .then(inviteId => {

                            debug(`Invitation (${inviteId}) created by ${res.locals.user} for ${req.body.email} to join ${req.body.choirId}`);

                            return choirInterface.get(req.body.choirId)
                                .then(choirDetails => {

                                    const emailDetails = {
                                        to : req.body.email,
                                        subject : "You've been invited to join a Choirless choir.",
                                        info : {
                                            creator : res.locals.name,
                                            choirName : choirDetails.name,
                                            invitationURL : `${process.env.SERVICE_URL}/choir/join/${req.body.choirId}/${inviteId}?inviteId=${inviteId}`
                                        }
                                    };

                                    return mailInterface.send(emailDetails, 'invitation')
                                        .then(function(){
                                            debug(`Email for invitation "${inviteId}" successfully dispatched.`);
                                        })
                                    ;

                                })
                            ;

                        })
                        .then(() => {

                            const successMessage = `Invitation to "${req.body.email}" has been sent. If they accept, they will have access to your choir and appear here.`;
                            res.redirect(`/dashboard/choir/${req.body.choirId}/members?${generateNotification(successMessage, "success")}`);

                        })
                        .catch(err => {
                            debug('/add-member err:', err);
                            res.status(500);
                            next();

                        })
                    ;

                } else {

                    const errMsg = `Sorry, we could not create that invitation. You must be a leader of this choir to send invitations`;
                    res.redirect(`/dashboard/choir/${req.body.choirId}/members?${generateNotification(errMsg, "error")}`);

                }

            })
            .catch(err => {
                debug('/choir/add-member err:', err);
            })
        ;

    }

});

router.post('/update-member', (req, res, next) => {

    const membershipDetails = [];

    membershipDetails.push( choirInterface.members.check(req.body.choirId, res.locals.user) );
    membershipDetails.push( choirInterface.members.check(req.body.choirId, req.body.userId) );

    Promise.all(membershipDetails)
        .then(details => {

            const memberMakingTheUpdate = details[0];
            const memberBeingUpdated = details[1];
            
            if(memberMakingTheUpdate.memberType === "leader"){
                return choirInterface.members.update(req.body.choirId, memberBeingUpdated.userId, memberBeingUpdated.name, req.body.membershiptype)
            } else {
                res.redirect(`/dashboard/choir/${req.body.choirId}?${generateNotification("Sorry, you need to be a leader of that choir to update membership statuses.", "error")}`);
            }

        })
        .then(result => {
            debug(result);
            res.redirect(`/dashboard/choir/${req.body.choirId}/members?${generateNotification("Membership status updated.", "success")}`);
        })
        .catch(err => {
            debug(err);
            res.redirect(`/dashboard/choir/${req.body.choirId}/members?${generateNotification("Sorry something went wrong while making that change.", "error")}`);
        })
    ;

});

router.post('/create-open-invitation/:CHOIRID',  (req, res, next) => {

    choirInterface.members.check(req.params.CHOIRID, res.locals.user)
        .then(memberInfo => {
            debug(memberInfo);

            if(memberInfo.memberType !== "leader"){

                res.status(401);
                res.json({
                    status : "err",
                    msg : "Only choir leaders can create open invitations for their choirs."
                });

            } else {

                const inviteInformation = {
                    choirId : req.params.CHOIRID,
                    creator : res.locals.user
                };

                return invitationsInterface.create(res.locals.user, inviteInformation, 'choir');
            }

        })
        .then(invitationId => {

            res.json({
                status : "ok",
                invitationId : invitationId,
                link : `${process.env.SERVICE_URL}/choir/join/${req.params.CHOIRID}/${invitationId}`
            });

        })
        .catch(err => {
            debug('/create-open-invitation err:', err);
            res.status(500);
            res.json({
                status : "err",
                msg : "Sorry, something went wrong with the server"
            });
        })
    ;

});

module.exports = router;