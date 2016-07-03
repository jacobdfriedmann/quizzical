'use strict';

const fs = require('fs');
const validateConfig = require('./validateConfig');

module.exports = (commandLineArgs) => {
    // Setup defaults
    let config = {
        botName: 'Quizzical',
        templates: []
    };

    // Read file config, if specified
    let fileConfig;
    if (commandLineArgs.config) {
        fileConfig = JSON.parse(fs.readFileSync(commandLineArgs.config));
    }

    // Read in quiz templates
    commandLineArgs._.forEach((quizFile) => {
        config.templates.push(
            JSON.parse(fs.readFileSync(quizFile))
        );
    });

    // Merge configs
    config = Object.assign(config, fileConfig, commandLineArgs);

    // Validate config
    validateConfig(config);

    return config;
}
