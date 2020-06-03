const debug = require('debug')('app:routes:dashboard');
const express = require('express');
const router = express.Router();

const users = require(`../bin/modules/users`);

router.get('/', (req, res, next) => {

	debug(req.session);

    users.get.choirs(req.session.user)
        .then(choirs => {

            debug("Choirs:", choirs);

            res.render('dashboard', { 
                title : "Choirless | My Dashboard", 
                bodyid: "dashboard",
                choirs : choirs
            });

        })
        .catch(err => {
            debug('/ get.choirs err:', err);
        })
    ;

});

router.get('/choir/:CHOIRID', (req, res, next) => {

	debug(req.session);

    users.get.choirs(req.session.user)
        .then(choirs => {

            debug("Choirs:", choirs);

            res.render('dashboard', { 
                title : "Choirless | My Dashboard", 
                bodyid: "dashboard",
                choirs : choirs
            });

        })
        .catch(err => {
            debug('/ get.choirs err:', err);
        })
    ;

});

module.exports = router;
