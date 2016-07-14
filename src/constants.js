'use strict';

module.exports = {
    MESSAGE_TYPE: 'message',
    BOT_MESSAGE_TYPE: 'bot_message',

    LIST_COMMAND: 'list',
    START_COMMAND: 'start',
    REPEAT_COMMAND: 'repeat',
    NEXT_COMMAND: 'next',
    END_COMMAND: 'end',

    WARN_NO_PLOTS: 'Plotly not configured, will not create charts.',

    ERROR_SLACK_TOKEN: 'Slack Token (slackToken) must be specified',
    ERROR_NO_QUIZ_FILES: 'No quiz files specified',
    ERROR_QUIZ_IN_PROGRESS: 'Sorry, I cannot start quiz when one is already in progress',
    ERROR_NO_QUIZ: 'No quiz is currently running.',
    ERROR_PERMISSION_DENIED: 'You do not have the authority to end the question',
    ERROR_ANSWERED: 'Sorry, you\'ve already answered this question',
    ERROR_NOT_FOUND: 'Sorry, I don\'t recognize that quiz.',
    ERROR_NOT_PARTICIPATING: 'Sorry, you are not participating in the quiz.',
    ERROR_STUDENTS_NOT_FINISHED: ' not finished the question',
    ERROR_NOT_VALID_CHOICE: 'Sorry, that is not one of the choices, guess again'
};
