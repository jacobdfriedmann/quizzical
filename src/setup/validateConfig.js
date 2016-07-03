'use strict';

const constants = require('../constants.js');

module.exports = (config) => {
    if (!config.slackToken) {
        throw new Error(constants.ERROR_SLACK_TOKEN);
    }
    if (config.templates.length < 1) {
        throw new Error(constants.ERROR_NO_QUIZ_FILES);
    }
    config.templates.forEach((quizTemplate) => {
        validateQuizTemplate(quizTemplate);
    });
}

const validateQuizTemplate = (quizTemplate) => {
    if (typeof quizTemplate.id !== 'string') {
        throw new Error('Quiz template id must be a string');
    }
    if (quizTemplate.id.indexOf(' ') >= 0) {
        throw new Error('Quiz template id cannot contain spaces');
    }
    if (!quizTemplate.name) {
        throw new Error('Quiz template must have a name');
    }
    if (!quizTemplate.questions) {
        throw new Error('Quiz template must have questions');
    }
    quizTemplate.questions.forEach((question) => {
        if (typeof question.a !== 'string') {
            throw new Error('Question answers must be strings');
        }
        if (question.choices) {
            if (Object.keys(question.choices).indexOf(question.a) < 0) {
                throw new Error('Question choices do not contain answer');
            }
        }
    });
}
