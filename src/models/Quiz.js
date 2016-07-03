'use strict';

function Quiz(channel, instructor, template) {
    this.instructor = instructor;
    this.channel = channel;
    this.template = template;
    this.currentQuestion = 0;
    this.resultsByQuestion = [];
    this.resultsByStudent = {};
    this.studentChannels = {};
}

Quiz.prototype.getQuestion = function() {
    return this.template.questions[this.currentQuestion];
}

Quiz.prototype.hasStudentAnswered = function(student) {
    const question = this.template.questions[this.currentQuestion];
    return this.resultsByStudent[student] &&
        this.resultsByStudent[student][this.currentQuestion];
}

Quiz.prototype.gradeQuestion = function(answer, student, channel) {
    const question = this.template.questions[this.currentQuestion];
    const correct = answer.toLowerCase() === question.a.toLowerCase();

    this.studentChannels[student] = channel;

    if (!this.resultsByStudent[student]) {
        this.resultsByStudent[student] = [];
    }
    this.resultsByStudent[student][this.currentQuestion] = {
        correct: correct,
        answer: answer
    };

    if (!this.resultsByQuestion[this.currentQuestion]) {
        this.resultsByQuestion[this.currentQuestion] = [];
    }
    this.resultsByQuestion[this.currentQuestion].push({
        correct: correct,
        answer: answer,
        student: student
    });

    return correct;
}

Quiz.prototype.getQuestionAggregateResult = function() {
    const question = this.template.questions[this.currentQuestion];
    let numberCorrect = 0;
    let numberWrong = 0;
    let totalAnswers = 0;
    let distribution = {};

    this.resultsByQuestion[this.currentQuestion].forEach((result) => {
        totalAnswers++;
        numberCorrect += result.correct ? 1 : 0;
        numberWrong += result.correct ? 0 : 1;
        if (!distribution[result.answer]) {
            distribution[result.answer] = 1;
        } else {
            distribution[result.answer] = distribution[result.answer] + 1;
        }
    });

    return {
        correctAnswer: question.a,
        percentCorrect: Math.round((numberCorrect / totalAnswers) * 100),
        percentWrong: Math.round((numberWrong / totalAnswers) * 100),
        distribution: distribution
    };
}

Quiz.prototype.getQuizAggregateResult = function() {
    const questionLength = this.template.questions.length;
    let scores = [];
    let correctByQuestion = new Array(questionLength + 1).join('0').split('').map(parseFloat);
    let wrongByQuestion = new Array(questionLength + 1).join('0').split('').map(parseFloat);

    Object.keys(this.resultsByStudent).forEach((student) => {
        let totalCorrect = 0;
        let total = 0;
        this.resultsByStudent[student].forEach((question, i) => {
            total++;
            if (question.correct) {
                totalCorrect++;
                correctByQuestion[i]++;
            } else {
                wrongByQuestion[i]++;
            }
        });
        scores.push(totalCorrect / total);
    });

    let scoreSum = 0;
    scores.forEach((score) => {
        scoreSum += score;
    });

    return {
        average: Math.round((scoreSum / scores.length) * 100),
        correctByQuestion: correctByQuestion,
        wrongByQuestion: wrongByQuestion
    };
}

Quiz.prototype.getStudentResult = function(student) {
    let total = 0;
    let totalCorrect = 0;

    this.resultsByStudent[student].forEach((question) => {
        total++;
        totalCorrect += question.correct ? 1 : 0;
    });

    return {
        total: total,
        totalCorrect: totalCorrect,
        average: Math.round((totalCorrect / total) * 100)
    };
}

Quiz.prototype.hasNextQuestion = function() {
    return this.template.questions[this.currentQuestion + 1];
}

Quiz.prototype.allStudentsAnsweredQuestion = function() {
    if (this.currentQuestion === 0) {
        return false;
    }

    if (!this.resultsByQuestion[this.currentQuestion]) {
        return false;
    }

    if (this.resultsByQuestion[this.currentQuestion].length ===
        this.resultsByQuestion[0].length) {
        return true;
    }

    return false;
}

Quiz.prototype.numberOfStudentsUnanswered = function() {
    if (this.currentQuestion === 0) {
        return 0;
    }

    if (!this.resultsByQuestion[this.currentQuestion]) {
        return this.resultsByQuestion[0].length;
    }

    return this.resultsByQuestion[0].length -
        this.resultsByQuestion[this.currentQuestion].length;
}

Quiz.prototype.isStudentInQuiz = function(student) {
    if (this.currentQuestion === 0 ||
        Object.keys(this.studentChannels).indexOf(student) >= 0) {
        return true;
    }
    return false;
}

module.exports = Quiz;
