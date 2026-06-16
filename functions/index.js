// Cloud Function "publish" — déclencheur du bouton Publier du back-office.
// Vérifie que l'appel vient d'un admin connecté (token Firebase), puis déclenche
// le workflow GitHub Actions (repository_dispatch) qui build + déploie le site.
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const nodemailer = require('nodemailer');

initializeApp();

const REPO = 'Rikka230/Marco';

// Destinataires des notifications de booking.
const NOTIFY_TO = ['marcocharlashou@gmail.com'];

// Envoie un email à chaque nouvelle demande de booking (collection "bookings").
exports.onBooking = onDocumentCreated(
  { document: 'bookings/{id}', secrets: ['EMAIL_USER', 'EMAIL_PASS'], region: 'us-central1' },
  async (event) => {
    const b = event.data && event.data.data();
    if (!b) return;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const text =
      `Nouvelle demande reçue via le site Marco.\n\n` +
      `Nom      : ${b.name}\n` +
      `Email    : ${b.email}\n` +
      `Type     : ${b.requestType}\n` +
      `Sujet    : ${b.subject}\n\n` +
      `${b.message}\n\n` +
      `— Visible aussi dans le back-office (Demandes). Réponds directement à cet email pour contacter la personne.`;

    await transporter.sendMail({
      from: `Marco Charlas-Hou <${process.env.EMAIL_USER}>`,
      to: NOTIFY_TO.join(', '),
      replyTo: b.email,
      subject: `Booking — ${b.requestType} : ${b.subject}`,
      text,
    });
  },
);

exports.publish = onRequest(
  { cors: true, secrets: ['GITHUB_TOKEN'], region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

    // 1. Vérifie le token Firebase (l'admin doit être connecté).
    const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
      await getAuth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ error: 'auth' });
      return;
    }

    // 2. Déclenche le workflow GitHub Actions.
    const gh = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'marco-publish',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'publish' }),
    });
    if (!gh.ok) {
      res.status(502).json({ error: 'dispatch', detail: await gh.text() });
      return;
    }
    res.json({ ok: true });
  },
);
