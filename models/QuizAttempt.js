const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnswerSchema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    selectedOptions: [{
        type: Schema.Types.ObjectId
    }],
    textAnswer: {
        type: String,
        default: ''
    },
    isCorrect: {
        type: Boolean,
        default: false
    },
    pointsAwarded: {
        type: Number,
        default: 0
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    }
});

const QuizAttemptSchema = new Schema({
    quiz: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [AnswerSchema],
    totalScore: {
        type: Number,
        default: 0
    },
    maxPossibleScore: {
        type: Number,
        required: true
    },
    percentageScore: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number, // in seconds
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

QuizAttemptSchema.pre('save', function(next) {
    if (this.completed && !this.completedAt) {
        this.completedAt = Date.now();
        
        // Calculate score percentage
        if (this.maxPossibleScore > 0) {
            this.percentageScore = (this.totalScore / this.maxPossibleScore) * 100;
        }
    }
    next();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
