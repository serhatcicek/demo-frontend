require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4173;
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

// Global variables for all templates
app.use((req, res, next) => {
  res.locals.company = {
    name: 'Anar Rent A Car',
    phone: '0544 289 60 55',
    whatsappNumber: '5442896055',
    address: 'ARTUKLU APARTMANI, 13 Mart, MEHMET REMZİ YERSEL CADDESİ NO:5 D:6, 47100 Artuklu/Mardin',
    city: 'Mardin, Türkiye',
  };
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET / — Home Page
 */
app.get('/', async (req, res) => {
  try {
    // Fetch categories and featured vehicles
    const [categoriesRes, vehiclesRes] = await Promise.all([
      axios.get(`${API_URL}/categories`),
      axios.get(`${API_URL}/vehicles?limit=6`),
    ]);

    res.render('index', {
      title: 'Ana Sayfa | Anar Rent A Car',
      description: 'Güvenilir kiralama çözümleri. Mardin ve civar bölgelerde uygun fiyatlı araç kiralama hizmetleri.',
      categories: categoriesRes.data,
      vehicles: vehiclesRes.data.data,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Ana sayfayı yüklerken bir hata oluştu' });
  }
});

/**
 * GET /vehicles — Vehicle Listing
 */
app.get('/vehicles', async (req, res) => {
  try {
    const { category, page = 1 } = req.query;

    const [categoriesRes, vehiclesRes] = await Promise.all([
      axios.get(`${API_URL}/categories`),
      axios.get(`${API_URL}/vehicles`, {
        params: {
          category_slug: category,
          page,
          limit: 12,
        },
      }),
    ]);

    res.render('vehicles/listing', {
      title: 'Araç Listesi | Anar Rent A Car',
      description: 'Tüm araçlarımızı görüntüleyin ve kiralayın.',
      categories: categoriesRes.data,
      vehicles: vehiclesRes.data.data,
      pagination: vehiclesRes.data.pagination,
      selectedCategory: category || null,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Araçlar yüklenirken bir hata oluştu' });
  }
});

/**
 * GET /vehicles/:slug — Vehicle Detail
 */
app.get('/vehicles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [vehicleRes, locationsRes] = await Promise.all([
      axios.get(`${API_URL}/vehicles/${slug}`),
      axios.get(`${API_URL}/locations`),
    ]);

    res.render('vehicles/detail', {
      title: `${vehicleRes.data.name} - Kiralık Araç | Anar Rent A Car`,
      description: `${vehicleRes.data.name} - Günlük ${vehicleRes.data.daily_price} TL. ${vehicleRes.data.description}`,
      vehicle: vehicleRes.data,
      locations: locationsRes.data,
      ogImage: vehicleRes.data.media.length > 0 ? `/uploads/vehicles/${vehicleRes.data.media[0].filename}` : null,
    });
  } catch (err) {
    console.error(err);
    res.status(404).render('error', { message: 'Araç bulunamadı' });
  }
});

/**
 * POST /api/reservations — Create Reservation
 */
app.post('/api/reservations', async (req, res) => {
  try {
    const { vehicle_id, first_name, last_name, email, phone, pickup_location_id, pickup_date, return_date, notes } = req.body;

    const response = await axios.post(`${API_URL}/reservations`, {
      vehicle_id: parseInt(vehicle_id),
      first_name,
      last_name,
      email,
      phone,
      pickup_location_id: parseInt(pickup_location_id),
      return_location_id: parseInt(pickup_location_id), // Same as pickup for now
      pickup_date,
      return_date,
      notes,
    });

    res.redirect(`/reservations/confirm?ref=${response.data.reference_number}`);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Rezervasyon oluşturulamadı', details: err.response?.data });
  }
});

/**
 * GET /reservations/confirm — Reservation Confirmation
 */
app.get('/reservations/confirm', async (req, res) => {
  try {
    const { ref } = req.query;

    if (!ref) {
      return res.render('error', { message: 'Referans numarası gerekli' });
    }

    const reservationRes = await axios.get(`${API_URL}/reservations/${ref}`);

    res.render('reservation-confirm', {
      title: 'Rezervasyon Onayı | Anar Rent A Car',
      reservation: reservationRes.data,
    });
  } catch (err) {
    console.error(err);
    res.status(404).render('error', { message: 'Rezervasyon bulunamadı' });
  }
});

/**
 * GET /contact — Contact Page
 */
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'İletişim | Anar Rent A Car',
    description: 'Bize ulaşın. Tüm sorularınıza cevap vermekten mutlu oluruz.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).render('error', { message: 'Sayfa bulunamadı' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Bir hata oluştu' });
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌐 Anar Rent A Car Frontend running on http://localhost:${PORT}`);
  console.log(`📡 Connected to API: ${API_URL}`);
});
