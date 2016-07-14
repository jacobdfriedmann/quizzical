'use strict';

module.exports = {

    listMessage(availableQuizTemplates) {
        // List quiz ids
        let quizIDs = '';
        availableQuizTemplates.forEach((quizTemplate) => {
            quizIDs += quizTemplate.id + ', ';
        });

        return 'Available quizzes: ' + quizIDs.slice(0, -2);
    },

    startMessage(quiz) {
        return 'Starting ' + quiz.template.name;
    },

    questionAttachment(quiz) {
        const question = quiz.getQuestion();
        const fields = question.choices ?
            Object.keys(question.choices).map((choice) => {
                return {
                    title: choice,
                    value: question.choices[choice],
                    short: true
                };
            }) : [];

        return {
            attachments: [
                {
                    text: question.q,
                    title: quiz.template.name + ': Q' + (quiz.currentQuestion + 1),
                    fields: fields,
                    footer: 'Quizzical',
                    fallback: question.q,
                    mrkdwn_in: ['text', 'fields']
                }
            ]
        };
    },

    firstQuestionMessage(botId) {
        return 'Answer by messaging me privately <@' + botId + '>';
    },

    studentCorrectMessage() {
        return ':white_check_mark:';
    },

    studentWrongMessage() {
        return ':x:';
    },

    pleaseAnswerMessage(quiz) {
        return 'Please answer question ' + (quiz.currentQuestion + 1);
    },

    instructorCorrectMessage(student, quiz) {
        return '<@' + student + '> got question ' + (quiz.currentQuestion + 1) + ' right!';
    },

    instructorWrongMessage(student, quiz) {
        return '<@' + student + '> got question ' + (quiz.currentQuestion + 1) + ' wrong';
    },

    questionSummaryAttachment(quiz, result, plotlyMessage) {
        let message = 'The correct answer was ' + result.correctAnswer +
            ', ' + result.percentCorrect + '% got the question right!';

        return {
            attachments: [
                {
                    text: message,
                    title: quiz.template.name + ': Q' + (quiz.currentQuestion + 1),
                    image_url: plotlyMessage.url ? plotlyMessage.url + '.jpeg' : undefined,
                    footer: 'Quizzical',
                    fallback: message
                }
            ]
        };
    },

    quizSummaryAttachment(quiz, result, plotlyMessage) {
        let message = 'The average score was ' + result.average + '%.';

        return {
            attachments: [
                {
                    text: message,
                    title:  quiz.template.name + ' complete',
                    image_url: plotlyMessage.url ? plotlyMessage.url + '.jpeg' : undefined,
                    footer: 'Quizzical',
                    fallback: message
                }
            ]
        };
    },

    studentSummaryMessage(quiz, result) {
        return 'You got *' + result.totalCorrect + '* out of *' +
            result.total + '* correct (' + result.average + '%) on ' +
            quiz.template.name + '.';
    }

}
