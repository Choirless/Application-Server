module.exports = (message, type = "general") => {

    return `msg=${encodeURIComponent(message)}&msgtype=${type}`;

};