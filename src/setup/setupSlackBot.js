'use strict';

const SlackBot = require('slackbots');

module.exports = (config) => {
    return new SlackBot({
        token: config.slackToken,
        name: config.botName
    });
}
