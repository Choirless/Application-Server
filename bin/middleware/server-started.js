const debug = require('debug')('bin:middleware:server-started');
const serverStarted = Number(Date.now());

debug('serverStarted:', serverStarted);

module.exports = (req, res, next) => {
    res.locals.serverStarted = serverStarted;
    next();
};