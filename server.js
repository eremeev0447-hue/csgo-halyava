require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB, Card, Faq } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me_in_env';

// Подключаем MongoDB
connectDB();

// Multer — загрузка изображений
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/images'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, Date.now() + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Только изображения!'));
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Сессии хранятся в MongoDB — не слетают при перезапуске
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/admin');
}

// ─── ГЛАВНАЯ ───
app.get('/', async (req, res) => {
    const cards = await Card.find().sort({ createdAt: -1 });
    const faq = await Faq.find().sort({ createdAt: 1 });
    res.render('index', {
        cards,
        faq,
        openCardId: req.query.card || null
    });
});

// ─── АДМИНКА ───
app.get('/admin', async (req, res) => {
    if (req.session && req.session.isAdmin) {
        const cards = await Card.find().sort({ createdAt: -1 });
        const faq = await Faq.find().sort({ createdAt: 1 });
        const editCard = req.query.edit
            ? await Card.findById(req.query.edit).catch(() => null)
            : null;
        res.render('admin', { cards, faq, error: null, editCard });
    } else {
        res.render('admin-login', { error: null });
    }
});

app.post('/admin/login', (req, res) => {
    const password = (req.body.password || '').trim();
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.save(() => res.redirect('/admin'));
    } else {
        res.render('admin-login', { error: 'Неверный пароль' });
    }
});

app.post('/admin/logout', requireAdmin, (req, res) => {
    req.session.destroy(() => res.redirect('/admin'));
});

// ─── КАРТОЧКИ ───
app.post('/admin/add', requireAdmin, upload.single('image'), async (req, res) => {
    const imagePath = req.file
        ? `/images/${req.file.filename}`
        : (req.body.imageUrl || '').trim();

    if (!req.body.title || !req.body.description || !req.body.link) {
        const cards = await Card.find().sort({ createdAt: -1 });
        const faq = await Faq.find();
        return res.render('admin', { cards, faq, error: 'Заполните обязательные поля', editCard: null });
    }

    await Card.create({
        title: req.body.title.trim(),
        badges: req.body.badges ? req.body.badges.split(',').map(b => b.trim()).filter(Boolean) : [],
        image: imagePath,
        description: req.body.description.trim(),
        subtext: (req.body.subtext || '').trim(),
        promoText: (req.body.promoText || '').trim(),
        promoCode: (req.body.promoCode || '').trim(),
        link: req.body.link.trim(),
        tasks: (req.body.tasks || 'НЕТ ЗАДАНИЙ').trim()
    });
    res.redirect('/admin');
});

app.post('/admin/edit', requireAdmin, upload.single('image'), async (req, res) => {
    const card = await Card.findById(req.body.id).catch(() => null);
    if (!card) return res.redirect('/admin');

    const imagePath = req.file
        ? `/images/${req.file.filename}`
        : (req.body.imageUrl || '').trim() || card.image;

    await Card.findByIdAndUpdate(req.body.id, {
        title: (req.body.title || card.title).trim(),
        badges: req.body.badges ? req.body.badges.split(',').map(b => b.trim()).filter(Boolean) : card.badges,
        image: imagePath,
        description: (req.body.description || card.description).trim(),
        subtext: (req.body.subtext || '').trim(),
        promoText: (req.body.promoText || '').trim(),
        promoCode: (req.body.promoCode || '').trim(),
        link: (req.body.link || card.link).trim(),
        tasks: (req.body.tasks || 'НЕТ ЗАДАНИЙ').trim()
    });
    res.redirect('/admin');
});

app.post('/admin/delete', requireAdmin, async (req, res) => {
    await Card.findByIdAndDelete(req.body.id).catch(() => {});
    res.redirect('/admin');
});

// ─── FAQ ───
app.post('/admin/faq/add', requireAdmin, async (req, res) => {
    const question = (req.body.question || '').trim();
    const answer = (req.body.answer || '').trim();
    if (!question || !answer) {
        const cards = await Card.find().sort({ createdAt: -1 });
        const faq = await Faq.find();
        return res.render('admin', { cards, faq, error: 'Заполните вопрос и ответ', editCard: null });
    }
    await Faq.create({ question, answer });
    res.redirect('/admin#faq-section');
});

app.post('/admin/faq/delete', requireAdmin, async (req, res) => {
    await Faq.findByIdAndDelete(req.body.id).catch(() => {});
    res.redirect('/admin#faq-section');
});

// ─── ОШИБКИ MULTER ───
app.use(async (err, req, res, next) => {
    console.error(err.message);
    const cards = await Card.find().sort({ createdAt: -1 });
    const faq = await Faq.find();
    res.render('admin', { cards, faq, error: err.message, editCard: null });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен → http://localhost:${PORT}`);
    if (ADMIN_PASSWORD === 'change_me_in_env') console.warn('⚠️  Установите ADMIN_PASSWORD в .env!');
});
