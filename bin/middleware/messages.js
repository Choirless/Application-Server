const debug = require('debug')('bin:lib:messages');

module.exports = (req, res, next) => {

    debug(req.query.msg, req.query.msgtype);

    if(req.query.msg){
        res.locals.msg = decodeURIComponent(req.query.msg);
    }

    if(req.query.msgtype){
        res.locals.msgtype = req.query.msgtype;
    }

    next();

}