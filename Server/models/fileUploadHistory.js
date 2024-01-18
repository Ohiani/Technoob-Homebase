const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileUploadHistorySchema = new mongoose.Schema({
    generatedId: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
            required: true,
        },
    mimetype: {
        type: String,
        required: true,
        },
    user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please provide user id'],
            trim: true
        },
    url: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        required: true,
    },
    key: {
        type: String,
    },
    objectStore: {
        type: String,
        required: true,
    }
}, {
timestamps: true,
});

const FileUploadHistory = mongoose.model('FileUploadHistory', fileUploadHistorySchema);

module.exports = FileUploadHistory;