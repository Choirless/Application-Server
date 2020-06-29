const debug = require('debug')("bin:modules:choir");
const fetch = require('node-fetch');

const users = require(`${__dirname}/users`);

function createANewChoir(userId, choirName, choirDescription = ""){

    if(!userId){
        return Promise.reject('A userId was not passed to the function');
    }

    if(!choirName){
        return Promise.reject('A name for the choir was not passed');
    }

    const details = {
        name : choirName,
        description : choirDescription,
        createdByUserId : userId,
        createdByName : "N/A",
        choirType : "public"
    };

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(details)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug("createANewChoir Err:", err);
            throw err;
        })
    ;

}

function updateAnExistingChoir(userId, choirId, data = {}){

    const validProperties = ['name', 'description', 'type'];

    const details = {
        userId : userId,
        choirId : choirId,
    };

    validProperties.forEach(property => {
        details[property] = data[property];
    });

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(details)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .catch(err => {
            debug("createANewChoir Err:", err);
            throw err;
        })
    ;
}

function getAKnownChoir(choirId){

    if(!choirId){
        return Promise.reject('No choirId was passed to function');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir?apikey=${process.env.CHOIRLESS_API_KEY}&choirId=${choirId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(choirData => {
            return choirData.choir;
        })
        .catch(err => {
            debug('getAKnownChoir Err:', err);
            throw err;
        })
    ;

}

function joinAnExistingChoir(choirId, userId, name, memberType){

    if(!choirId){
        return Promise.reject("No choirId was passed to function");
    }
    
    if(!userId){
        return Promise.reject("No userId was passed to function");
    }
    
    if(!name){
        return Promise.reject("No name was passed to function");
    }

    if(!memberType){
        return Promise.reject("No memberType was passed to function");
    }

    const details = {
        choirId : choirId,
        userId : userId,
        name : name,
        memberType : memberType
    };

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/join?apikey=${process.env.CHOIRLESS_API_KEY}`, {
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(details)
    })
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw res;
        }
    })
    .catch(err => {
        debug("createANewChoir Err:", err);
        throw err;
    })
;

}

function getAnExistingSongInAChoir(choirId, songId){

    if(!choirId){
        return Promise.reject("No choirId was passed to function");
    }

    if(!songId){
        return Promise.reject("No songId wass passed to function")
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/song?apikey=${process.env.CHOIRLESS_API_KEY}&choirId=${choirId}&songId=${songId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.song;
        })
        .catch(err => {
            debug('getAnExistingSongInAChoir err:', err);
            throw err;
        })
    ;

}

function addANewSongToAChoir(data){

    if(!data.choirId || !data.userId || !data.name){
        return Promise.reject(`Missing parameters for song creation.\nRequired: "choirid", "userId", "name"\nRecieved: ${data.choirId}, ${data.userId}, ${data.name}`);
    } else {

        return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/song?apikey=${process.env.CHOIRLESS_API_KEY}`, {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify(data)
            })
            .then(res => {
                if(res.ok){
                    return res.json();
                } else {
                    throw res;
                }
            })
            .then(response => {
                return response.songId;
            })
            .catch(err => {
                debug('addANewSongToAChoir err:', err);
                throw err;
            })
        ;

    }


}

function getAllOfTheSongsForAChoir(choirId, getRecordingsToo = false){

    if(!choirId){

        return Promise.reject(`No choirId was passed to function`);

    } else {

        return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/songs?apikey=${process.env.CHOIRLESS_API_KEY}&choirId=${choirId}`)
            .then(res => {
                if(res.ok){
                    return res.json();
                } else {
                    throw res;
                }
            })
            .then(response => {

                if(getRecordingsToo){

                    return Promise.all(response.songs.map( song => { 
                        return getAllRecordingsForASongInAChoir(choirId, song.songId)
                            .then(recordings => {
                                song.recordings = recordings;
                                return song;
                            })
                    } ) );

                } else {
                    return response.songs;
                }

            })
            .catch(err => {
                debug('getAllOfTheSongsForAChoir err:', err);
                throw err;
            })
        ;

    }

}

function addASectionToASong(choirId, songId, partName){

    if(!choirId){
        return Promise.reject("No choirId was passed to function");
    }

    if(!songId){
        return Promise.reject("No songId was passed to function");
    }

    if(!partName){
        return Promise.reject("No partName was passed to function");
    }

    const data = {
        choirId : choirId,
        songId : songId,
        name : partName
    };

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/songPartName?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(data)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(res => {
            return res.songId;
        })
        .catch(err => {
            debug('addASectionToASong err:', err);
            throw err;
        })
    ;

}

function getASpecificSectionForASong(choirId, songId, sectionId){

    if(!sectionId){ 
        return Promise.reject('No sectionId was passed');
    }

    return getAllOfTheSectionsForASong(choirId, songId)
        .then(sections => {

            return sections.filter(section => {
                return section.partNameId === sectionId;
            })[0];

        })
        .catch(err => {
            debug("getASpecificSectionForASong err:", err);
        })
    ;


}

function getAllOfTheSectionsForASong(choirId, songId){

    return getAnExistingSongInAChoir(choirId, songId)
        .then(data => {
            return data.partNames;
        })
        .catch(err => {
            debug('getAllOfTheSectionsForASong err:', err);
            throw err;
        })
    ;

}

function addARecordingToASongInAChoir(data){

    const mandatoryParameters = ['choirId', 'songId', 'partNameId', 'userId'];
    const missingParameters = mandatoryParameters.filter(parameter => {
        return !data[parameter];
    });

    if(missingParameters.length > 0){
        return Promise.reject(`Missing parameters in data object: "${missingParameters.join('", "')}"`);
    }

    return users.get.byID(data.userId)
        .then(userInformation => {
            
            data.userName = userInformation.name;

            return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/songpart?apikey=${process.env.CHOIRLESS_API_KEY}`, {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify(data)
            })
            .then(res => {
                if(res.ok){
                    return res.json();
                } else {
                    throw res;
                }
            })

        })
        .then(response => {
            return response.partId;
        })
        .catch(err => {
            debug('addARecordingToASongInAChoir err:', err);
            throw err;
        })
    ;

}

function getAllRecordingsForASongInAChoir(choirId, songId){

    if(!choirId){
        return Promise.reject('No choirId passed to function');
    }

    if(!songId){
        return Promise.reject('No songId passed to function');
    }

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/songparts?apikey=${process.env.CHOIRLESS_API_KEY}&choirId=${choirId}&songId=${songId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(res => {
            return res.parts;
        })
        .catch(err => {
            debug('getAllRecordingsForASongInAChoir:', err);
        })
    ;

}

function getAllOfTheMembersOfAChoir(choirId, getMemberDetails = false){

    if(!choirId){

        return Promise.reject('No choirId was passed.');

    } else {

        return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/choir/members?apikey=${process.env.CHOIRLESS_API_KEY}&choirId=${choirId}`)
            .then(res => {
                if(res.ok){
                    return res.json();
                } else {
                    throw res;
                }
            })
            .then(response => {

                if(!getMemberDetails){
                    return response.members;
                } else {

                    const userDetails = [];

                    response.members.forEach(memberRecord => {
                        userDetails.push(users.get.byID(memberRecord.userId));
                    })

                    return Promise.all(userDetails)
                        .then(retrievedUserDetails => {

                            return retrievedUserDetails.map( (details, idx) => {

                                response.members[idx].info = details;

                                return response.members[idx];

                            });

                        })
                        .catch(err => {
                            debug('getMemberDetails err:', err);
                            throw err;
                        })
                    ;

                }

            })
            .catch(err => {
                debug('getAllOfTheMembersForAChoir err:', err);
                throw err;
            })
        ;

    }

}

function getAnInvitationById(inviteId){

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/invitation?apikey=${process.env.CHOIRLESS_API_KEY}&inviteId=${inviteId}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.invitation;
        })
        .catch(err => {

            debug('getAnInvitationById err:', err);

            if(err.status === 498){
                return { expired : true };
            } else {
                throw err;
            }

        })
    ;        

}

function createAnInvitationForAUserToJoinAChoir(choirId, creatorId, inviteeEmail){

    if(!choirId){
        return Promise.reject(`No "choirId" was passed to function`);
    }

    if(!creatorId){
        return Promise.reject(`No "creatorId" was passed to function`);
    }

    if(!inviteeEmail){
        return Promise.reject(`No "inviteeEmail" was passed to function`);
    }

    const details = {
        creator : creatorId,
        invitee : inviteeEmail,
        choirId : choirId,
        sendMail : false
    };

    return fetch(`${process.env.CHOIRLESS_API_ENDPOINT}/invitation?apikey=${process.env.CHOIRLESS_API_KEY}`, {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(details)
        })
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(response => {
            return response.id;
        })
        .catch(err => {
            debug('createAnInvitationForAUserToJoinAChoir err:', err);
            throw err;
        })
    ;

}

function checkUserIsAMemberOfAChoir(choirId, userId, getUserInfoToo = false){

    if(!choirId){
        return Promise.reject('No choirId was passed to function.');  
    }

    if(!userId){
        return Promise.reject('No userId was passed to function');
    }

    return getAllOfTheMembersOfAChoir(choirId, getUserInfoToo)
        .then(members => {
            debug(members);
            return members.filter(member => member.userId === userId)[0];
        })
        .catch(err => {
            debug('checkUserIsAMemberOfAChoir err:', err);
            throw err;
        })
    ;

}

module.exports = {
    create : createANewChoir,
    update : updateAnExistingChoir,
    get : getAKnownChoir,
    join : joinAnExistingChoir,
    songs : {
        get : getAnExistingSongInAChoir,
        add : addANewSongToAChoir,
        getAll : getAllOfTheSongsForAChoir,
        sections : {
            add : addASectionToASong,
            get: getASpecificSectionForASong,
            getAll : getAllOfTheSectionsForASong
        },
        recordings : {
            add : addARecordingToASongInAChoir,
            getAll : getAllRecordingsForASongInAChoir
        }
    },
    members : {
        get : getAllOfTheMembersOfAChoir,
        invitations : {
            get : getAnInvitationById,
            create : createAnInvitationForAUserToJoinAChoir
        },
        check : checkUserIsAMemberOfAChoir
    }
};
