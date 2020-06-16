const debug = require('debug')('bin:lib:helpers');

module.exports = (Handlebars) => {

    if(!Handlebars){
        return
    }

    debug("Registering Handlebars helpers");

    Handlebars.registerHelper("humantime", function(options) {

        const D = new Date(options.fn(this));
        const paddedMonth = D.getMonth() < 10 ? `0${D.getMonth() + 1}` : D.getMonth() + 1;
        const humanTime = `${D.getDate()}/${paddedMonth}/${D.getFullYear()}`

        return new Handlebars.SafeString(humanTime)
    });

    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
        return (arg1 == arg2) ? options.inverse(this) : options.fn(this);
    });

}