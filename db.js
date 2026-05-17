const mongoose = require('mongoose');

// Схема карточки
const cardSchema = new mongoose.Schema({
    title: String,
    badges: [String],
    image: String,
    description: String,
    subtext: String,
    promoText: String,
    promoCode: String,
    link: String,
    tasks: String,
    createdAt: { type: Date, default: Date.now }
});

// Схема FAQ
const faqSchema = new mongoose.Schema({
    question: String,
    answer: String,
    createdAt: { type: Date, default: Date.now }
});

const Card = mongoose.model('Card', cardSchema);
const Faq = mongoose.model('Faq', faqSchema);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB подключена');
    } catch (err) {
        console.error('❌ Ошибка подключения к MongoDB:', err.message);
        process.exit(1);
    }
}

module.exports = { connectDB, Card, Faq };
