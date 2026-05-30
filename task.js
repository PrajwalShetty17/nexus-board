const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
