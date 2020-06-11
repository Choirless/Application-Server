const debug = require('debug')('app:routes:dashboard');
const express = require('express');
const router = express.Router();

const choirInterface = require(`${__dirname}/../bin/modules/choir`);

router.post('/create', (req, res) => {

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

module.exports = router;