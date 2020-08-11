const debug = require('debug')('app');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('hbs');
const express_enforces_ssl = require('express-enforces-ssl');
const hsts = require('hsts');
const compress = require('compression');
const cookieSession = require('cookie-session');

const serverStarted = require(`./bin/middleware/server-started`);
const checkSession = require(`./bin/middleware/check-session`);
const protectRoute = require(`./bin/middleware/protect-route`);
const messages = require(`./bin/middleware/messages`);

const app = express();

// Enforce HTTPS
app.enable('trust proxy');

if(process.env.NODE_ENV === "production"){
	
	app.use(express_enforces_ssl());
	app.use(hsts({
		maxAge: 86400 // 1 day in seconds
	}));

}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
require(`${__dirname}/bin/lib/helpers`)(hbs);

app.use(compress());
app.use( logger('dev') );
app.use(express.json( { limit: '150mb'} ) );
app.use(express.urlencoded( { extended: false } ) );
app.use( cookieParser() );
app.use( messages );

const staticCaching = process.env.NODE_ENV === "production" ? { maxAge: (60 * 60 * 1000).toString()} : {maxAge : 0}
app.use( express.static( path.join(__dirname, 'public' ), staticCaching ));

app.use(cookieSession({
	name: 'choirless-session',
	secret : process.env.SESSION_SECRET,
	maxAge: 24 * 60 * 60 * 1000, // 1 day
	secure : process.env.NODE_ENV === "production"
}));

app.use('*', serverStarted);
app.use('*', checkSession);

app.use('/', require(`${__dirname}/routes/index`));
app.use('/account', require(`${__dirname}/routes/account`));
app.use('/dashboard', [protectRoute], require(`${__dirname}/routes/dashboard`));
app.use('/choir', [protectRoute], require(`${__dirname}/routes/choir`));
app.use('/performance', [protectRoute], require(`${__dirname}/routes/performance`));
app.use('/admin', [protectRoute], require(`${__dirname}/routes/admin`));
app.use('/feedback', [protectRoute], require(`${__dirname}/routes/feedback`));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404, `We can't find that resource`));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error', {
		bodyid : 'error'
	});
});

module.exports = app;
