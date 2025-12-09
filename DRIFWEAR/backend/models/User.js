const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
    type: { type: String, required: true },
    baseColor: { type: String, required: true },
    designType: { type: String, required: true },
    designColor: { type: String, required: true },
    size: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    phone: String,
    designs: [designSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);