const debug = require('debug')('bin:middleware:check-session');

module.exports = (req, res, next) => {

    if(!req.session.user){
        res.redirect('/account/login');
    } else {
        next();
    }

};