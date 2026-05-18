require('dotenv').config();

const Fastify = require('fastify');
const pool = require('./config/db');
const cors = require('@fastify/cors');

const menuRoutes = require('./modules/menu/menu.routes');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./modules/users/user.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const orderRoutes = require('./modules/orders/order.routes');
const reportRoutes = require('./modules/reports/report.routes');
const authMiddleware = require('./middleware/authMiddleware');
const outletRoutes = require('./modules/outlets/outlet.routes');
const organizationRoutes = require('./modules/organizations/organization.routes');

const helmet =
  require('@fastify/helmet');

const rateLimit =
  require('@fastify/rate-limit');

const multipart =
  require('@fastify/multipart');

const app = Fastify({
  logger: true
});

app.register(multipart);

app.register(cors, {
  origin: true,
  methods: [
    'GET',
    'POST',
    'PATCH',
    'PUT',
    'DELETE',
    'OPTIONS'
  ],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

app.setErrorHandler(errorHandler);

app.get('/health', async (request, reply) => {
  return {
    success: true,
    message: 'R-OS API Running'
  };
});

app.get(
  '/protected',
  {
    preHandler: [authMiddleware]
  },
  async (request, reply) => {
    return {
      success: true,
      message: 'Protected route working',
      user: request.user
    };
  }
);

app.register(helmet);

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

app.register(organizationRoutes);
app.register(outletRoutes);
app.register(userRoutes);
app.register(orderRoutes);
app.register(reportRoutes);
app.register(menuRoutes);
app.register(adminRoutes);

const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');

    await app.listen({
      port: process.env.PORT || 3000,
      host: '0.0.0.0'
    });

    console.log('R-OS API running');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();