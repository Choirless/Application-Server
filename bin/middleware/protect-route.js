const debug = require('debug')('bin:middleware:check-session');

module.exports = (req, res, next) => {

    if(!res.locals.user){
        res.redirect(`/account/login?redirect=${encodeURIComponent(req.originalUrl)}${req.query.inviteId ? `&inviteId=${req.query.inviteId}` : ""}`);
    } else {
        next();
    }

};