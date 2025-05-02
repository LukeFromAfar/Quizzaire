const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    questionText: {
        type: String,
        required: true
    },
    questionImage: {
        type: String,
        default: ''
    },
    questionType: {
        type: String,
        enum: ['multiple-choice', 'true-false', 'short-answer'],
        default: 'multiple-choice'
    },
    options: [{
        optionText: String,
        isCorrect: Boolean
    }],
    correctAnswer: {
        type: String,
        required: function() {
            return this.questionType === 'short-answer';
        }
    },
    points: {
        type: Number,
        default: 10
    },
    timeLimit: {
        type: Number,
        default: 30, // in seconds
        min: 5,
        max: 300
    }
});

const QuizSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['programming', 'networking', 'databases', 'cybersecurity', 'web-development', 'other'],
        default: 'other'
    },
    questions: [QuestionSchema],
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    attempts: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

QuizSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Quiz', QuizSchema);
