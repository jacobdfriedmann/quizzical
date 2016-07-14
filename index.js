'use strict'

const minimist = require('minimist');
const argv = minimist(process.argv.slice(2));
const constants = require('./src/constants');
const slackMessageBuilders = require('./src/utils/slackMessageBuilders');
const plotDataBuilders = require('./src/utils/plotDataBuilders');
const setupConfig = require('./src/setup/setupConfig');
const setupPlotly = require('./src/setup/setupPlotly');
const setupSlackBot = require('./src/setup/setupSlackBot');
const Quiz = require('./src/models/Quiz');

// Load and Validate Configuration, create singletons
const config = setupConfig(argv);
const bot = setupSlackBot(config);
const plotly = setupPlotly(config);

// Global Quiz - only one runs at a time
let quiz;

bot.on('start', () => {
    console.log('Quizzical started!');
});

// Start the Slack RTM Listener
bot.on('message', (data) => {
    if (config.debug) {
        console.log(data);
    }

    try {
        // Listen for direct messages
        if (data.type === constants.MESSAGE_TYPE && data.text &&
            data.channel.startsWith('D') &&
            data.subtype !== constants.BOT_MESSAGE_TYPE) {

            switch (data.text.toLowerCase()) {
                case constants.REPEAT_COMMAND:
                    repeatQuestion(data.channel);
                    break;
                default:
                    gradeQuestion(data.text, data.user, data.channel);
            }
        }

        // Listen for commands to start quiz
        else if (data.type === constants.MESSAGE_TYPE && data.text &&
            data.text.startsWith('<@' + bot.self.id + '>')) {

            let args = data.text.split(' ');
            switch (args[1].toLowerCase()) {
                case constants.LIST_COMMAND:
                    listQuizzes(data.channel);
                    break;
                case constants.START_COMMAND:
                    startQuiz(data.channel, data.user, args[2]);
                    break;
                case constants.NEXT_COMMAND:
                    nextQuestion(data.channel, data.user, args[2] === 'force');
                    break;
                case constants.END_COMMAND:
                    endQuiz(data.channel, data.user);
                    break;
            }
        }

    } catch (e) {
        bot.postMessage(data.channel, e.message);
    }

});

function listQuizzes(channel) {
    bot.postMessage(
        channel,
        slackMessageBuilders.listMessage(config.templates)
    );
}

function startQuiz(channel, user, templateName) {
    // Check to see if a quiz is running
    if (quiz) {
        throw new Error(constants.ERROR_QUIZ_IN_PROGRESS);
    }

    // Make sure the template exists
    let quizTemplate = config.templates.find((t) => t.id === templateName);
    if (!quizTemplate) {
        setTimeout(listQuizzes.bind(this, channel), 0);
        throw new Error(constants.ERROR_NOT_FOUND);
    }

    // Instantiate a new quiz and send the message
    quiz = new Quiz(channel, user, quizTemplate);

    bot.postMessage(
        channel,
        slackMessageBuilders.startMessage(quiz)
    ).then(() => {
        return bot.postMessage(
            channel,
            undefined,
            slackMessageBuilders.questionAttachment(quiz)
        );
    }).then(() => {
        return bot.postMessage(
            channel,
            slackMessageBuilders.firstQuestionMessage(bot.self.id)
        );
    });
}

function repeatQuestion(channel) {
    // Ensure no quiz is running
    if (!quiz) {
        throw new Error(constants.ERROR_NO_QUIZ);
    }

    // Send message
    bot.postMessage(
        channel,
        undefined,
        slackMessageBuilders.questionAttachment(quiz)
    );
}

function gradeQuestion(answer, user, channel) {
    // Ensure quiz is running
    if (!quiz) {
        throw new Error(constants.ERROR_NO_QUIZ);
    }
    // Ensure student hasn't already answered
    if (quiz.hasStudentAnswered(user)) {
        throw new Error(constants.ERROR_ANSWERED);
    }
    // Ensure the student is participating
    if (!quiz.isStudentInQuiz(user)) {
        throw new Error(constants.ERROR_NOT_PARTICIPATING);
    }
    // Ensure the answer is one of the choices
    if (quiz.getQuestion().choices &&
        Object.keys(quiz.getQuestion().choices).indexOf(answer) < 0) {
        throw new Error(constants.ERROR_NOT_VALID_CHOICE);
    }

    // Grade question and send messages to student and instructor
    if (quiz.gradeQuestion(answer, user, channel)) {
        bot.postMessage(
            channel,
            slackMessageBuilders.studentCorrectMessage()
        );
        bot.postMessage(
            quiz.instructor,
            slackMessageBuilders.instructorCorrectMessage(user, quiz)
        );
    } else {
        bot.postMessage(
            channel,
            slackMessageBuilders.studentWrongMessage()
        );
        bot.postMessage(
            quiz.instructor,
            slackMessageBuilders.instructorWrongMessage(user, quiz)
        );
    }

    // If all students have submitted, let's go to the next
    // question
    if (quiz.allStudentsAnsweredQuestion()) {
        nextQuestion(quiz.channel, quiz.instructor);
    }
}

function nextQuestion(channel, user, force) {
    // Ensure quiz is running
    if (!quiz) {
        throw new Error(constants.ERROR_NO_QUIZ);
    }
    // Ensure the instructor issued the command
    if (quiz.instructor !== user) {
        throw new Error(constants.ERROR_PERMISSION_DENIED);
    }
    // Make sure all students have answered
    const unansweredStudents = quiz.getUnansweredStudents()
    if (!force && unansweredStudents.length > 0) {
        unansweredStudents.forEach(function(student) {
          bot.postMessage(
              quiz.studentChannels[student],
              slackMessageBuilders.pleaseAnswerMessage(quiz)
          );
        })
        throw new Error(
            unansweredStudents.length +
            (unansweredStudents.length > 1 ? 'people have' : 'person has') +
            constants.ERROR_STUDENTS_NOT_FINISHED
        );
    }

    // Get aggregate results and plot data
    const result = quiz.getQuestionAggregateResult();
    const plotData = plotDataBuilders.questionSummaryPlot(result);

    // Create plotly plot, send message
    plotly.plot(plotData.data, plotData.graphOptions, function (err, msg) {
        bot.postMessage(
            channel,
            undefined,
            slackMessageBuilders.questionSummaryAttachment(quiz, result, msg)
        ).then(() => {
            if (quiz.hasNextQuestion()) {
                quiz.currentQuestion++;
                bot.postMessage(
                    channel,
                    undefined,
                    slackMessageBuilders.questionAttachment(quiz)
                );
                Object.keys(quiz.studentChannels).forEach((student) => {
                    bot.postMessage(
                        quiz.studentChannels[student],
                        undefined,
                        slackMessageBuilders.questionAttachment(quiz)
                    );
                });
            } else {
                endQuiz(channel, user);
            }
        });
    });
}

function endQuiz(channel, user) {
    // Ensure quiz is running
    if (!quiz) {
        throw new Error(constants.ERROR_NO_QUIZ);
    }
    // Ensure instructor issued command
    if (quiz.instructor !== user) {
        throw new Error(constants.ERROR_PERMISSION_DENIED);
    }

    // Gather aggregate data
    const result = quiz.getQuizAggregateResult();
    const plotData = plotDataBuilders.quizSummaryPlot(result);

    // Create plot, send messages, clear out quiz
    plotly.plot(plotData.data, plotData.graphOptions, function (err, msg) {
        bot.postMessage(
            channel,
            undefined,
            slackMessageBuilders.quizSummaryAttachment(quiz, result, msg)
        ).then(() => {
            Object.keys(quiz.studentChannels).forEach((student) => {
                const studentResult = quiz.getStudentResult(student);
                bot.postMessage(
                    quiz.studentChannels[student],
                    slackMessageBuilders.studentSummaryMessage(quiz, studentResult)
                );
            });
            quiz = undefined;
        });
    });
}
