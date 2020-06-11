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
                userChoirs : userChoirs
            });

        })
        .catch(err => {
            debug('/ get.choirs err:', err);
            res.status(500);
            next();
        })
    ;

});

router.get('/choir/:CHOIRID', (req, res, next) => {

    const apiRequests = [];
    
    apiRequests.push(users.get.choirs(req.session.user));
    apiRequests.push(choir.get(req.params.CHOIRID))

    Promise.all(apiRequests)
        .then(apiResponses => {
            const userChoirInfo = apiResponses[0];
            const choirInfo = apiResponses[1];

            debug('choirInfo:', choirInfo);

            if(choirInfo.createdByUserId !== req.session.user){
                res.status(401);
                next();
            } else {
                res.render('dashboard', { 
                    title : "Choirless | My Dashboard", 
                    bodyid: "dashboard",
                    userChoirs : userChoirInfo,
                    choirInfo : choirInfo
                });
            }


        })
        .catch(err => {
            debug('/choir/:CHOIRID err:', err);
            res.status(500);
            next();
        })
    ;

});

module.exports = router;
