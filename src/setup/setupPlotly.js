'use strict';

const plotlyFactory = require('plotly');
const constants = require('../constants.js');

module.exports = (config) => {
    let plotly = {};
    if (config.plotlyUsername && config.plotlyAPIKey) {
        plotly = plotlyFactory(config.plotlyUsername, config.plotlyAPIKey);
    } else {
        console.log(constants.WARN_NO_PLOTS);

        // Mock the plotly function
        plotly.plot = (a, b, callback) => {
            callback(undefined, {});
        }
    }
    return plotly;
}
