const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for participants in live sessions
const ParticipantSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    socketId: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    answers: [{
        questionIndex: Number,
        answer: Schema.Types.Mixed, // Can be array of IDs or string
        correct: Boolean,
        timeToAnswer: Number, // in seconds
        pointsAwarded: Number
    }]
});

// Main schema for live sessions
const LiveSessionSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    quiz: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [ParticipantSchema],
    status: {
        type: String,
        enum: ['waiting', 'active', 'completed'],
        default: 'waiting'
    },
    currentQuestion: {
        type: Number,
        default: -1 // -1 means no question is active
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    },
    questionResults: [{
        questionIndex: Number,
        correctCount: Number,
        incorrectCount: Number,
        unansweredCount: Number,
        answerDistribution: {} // Map of answer -> count
    }]
});

// Generate a unique code before saving
LiveSessionSchema.pre('save', function(next) {
    // Only generate code if it's a new document and no code exists
    if (this.isNew && !this.code) {
        // Generate a random 6-digit code
        this.code = Math.floor(100000 + Math.random() * 900000).toString();
    }
    next();
});

// Add a static method to generate a unique code
LiveSessionSchema.statics.generateUniqueCode = async function() {
    let code;
    let exists = true;
    
    // Keep trying until we find a unique code
    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const existingSession = await this.findOne({ code });
        if (!existingSession) {
            exists = false;
        }
    }
    
    return code;
};

module.exports = mongoose.model('LiveSession', LiveSessionSchema);
