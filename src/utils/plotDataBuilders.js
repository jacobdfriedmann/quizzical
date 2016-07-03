'use strict';

module.exports = {

    questionSummaryPlot(result) {
        let x = Object.keys(result.distribution);
        let y = Object.keys(result.distribution).map((key) => result.distribution[key]);
        let marker = {
            color: Object.keys(result.distribution).map((key) => {
                return key === result.correctAnswer ? 'green' : 'red';
            })
        };

        return {
            data: [{
                x: x,
                y: y,
                type: 'bar',
                marker: marker
            }],
            graphOptions: {
               fileopt : 'extend',
               filename : 'question' + new Date()
           }
       };
   },

   quizSummaryPlot(result) {
       let x = result.correctByQuestion.map((_, i) => i);

       return {
           data: [{
               x: x,
               y: result.correctByQuestion,
               type: 'bar',
               name: 'Correct',
               marker: {
                   color: 'green'
               }
            },
            {
                x: x,
                y: result.wrongByQuestion,
                type: 'bar',
                name: 'Incorrect',
                marker: {
                    color: 'red'
                }
            }],
            graphOptions: {
              fileopt : 'extend',
              filename : 'quiz' + new Date()
            }
        };
   }

}
