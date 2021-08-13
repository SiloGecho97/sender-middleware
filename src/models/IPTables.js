const mongoose = require('mongoose');

const IPTables = new mongoose.Schema(
    {
        ip: { type: String, required: true },
        shortCode: { type: String, required: true },
        ownedBy: { type: String, required: true }
    },
    { timestamps: true }
)

module.exports = mongoose.model('IPTables', IPTables)
