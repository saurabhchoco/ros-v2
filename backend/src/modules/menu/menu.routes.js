const pool = require('../../config/db');
const menuController = require('./menu.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const userContextMiddleware = require('../../middleware/userContextMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
const { parseAndValidateMenuCSV, generateSampleCSV } = require('../../utils/csvUtils');
const { dryRunImport, importMenu } = require('../../services/menuImport.service');

async function menuRoutes(app) {
  // Existing CRUD routes (unchanged)
  app.post('/api/v1/menu/categories/create', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.createCategory);

  app.get('/api/v1/menu/categories/list', {
    preHandler: [authMiddleware, userContextMiddleware]
  }, menuController.listCategories);

  app.post('/api/v1/menu/items/create', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.createMenuItem);

  app.get('/api/v1/menu/items/list', {
    preHandler: [authMiddleware, userContextMiddleware]
  }, menuController.listMenuItems);

  app.post('/api/v1/menu/import-csv', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.importCSV);

  app.put('/api/v1/menu/items/:id', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.updateMenuItem);

  app.delete('/api/v1/menu/items/:id', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.deleteMenuItem);

  app.post('/api/v1/menu/combos', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, menuController.createCombo);

  // ---- CSV IMPORT/EXPORT ROUTES (NEW) ----

  // Dry run – preview import without saving
  app.post('/api/v1/menu/import/dry-run', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });
    const buffer = await data.toBuffer();
    const outletId = data.fields.outletId?.value;
    if (!outletId) return reply.code(400).send({ error: 'outletId required' });
    const organizationId = req.userContext.organization_id;
    try {
      const { validRows, errors } = await parseAndValidateMenuCSV(buffer, outletId, organizationId);
      const dryRun = await dryRunImport(validRows, outletId, organizationId);
      return reply.send({
        success: true,
        validRowsCount: validRows.length,
        errors,
        toCreateCount: dryRun.toCreateCount,
        toUpdateCount: dryRun.toUpdateCount,
        warnings: dryRun.warnings
      });
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Failed to process CSV' });
    }
  });

  // Confirm import – actually write to database
  app.post('/api/v1/menu/import/confirm', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });
    const buffer = await data.toBuffer();
    const outletId = data.fields.outletId?.value;
    if (!outletId) return reply.code(400).send({ error: 'outletId required' });
    const organizationId = req.userContext.organization_id;
    try {
      const { validRows, errors } = await parseAndValidateMenuCSV(buffer, outletId, organizationId);
      if (errors.length) {
        return reply.code(400).send({ error: 'Validation errors', errors });
      }
      const result = await importMenu(validRows, outletId, organizationId);
      return reply.send(result);
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Import failed' });
    }
  });

  // Export current menu as CSV
  app.get('/api/v1/menu/export', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, async (req, reply) => {
    const { outletId } = req.query;
    if (!outletId) return reply.code(400).send({ error: 'outletId required' });
    try {
      const items = await pool.query(`
        SELECT
          mi.id, mi.name, mc.name AS category, mi.base_price, mi.description, mi.is_veg,
          mi.status, mi.modifier_groups,
          COALESCE(
            (SELECT json_agg(json_build_object('name', v.name, 'price', v.price, 'is_default', v.is_default))
             FROM menu_item_variants v WHERE v.menu_item_id = mi.id),
            '[]'::json
          ) AS variants
        FROM menu_items mi
        JOIN menu_categories mc ON mc.id = mi.category_id
        WHERE mi.outlet_id = $1
        ORDER BY mc.display_order, mi.name
      `, [outletId]);

      const csvRows = items.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        base_price: row.base_price,
        description: row.description,
        is_veg: row.is_veg,
        status: row.status,
        variants: JSON.stringify(row.variants),
        modifier_groups: row.modifier_groups ? JSON.stringify(row.modifier_groups) : '',
      }));

      const { stringify } = require('csv-stringify/sync');
      const csv = stringify(csvRows, { header: true });

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename=menu_${outletId}.csv`);
      return reply.send(csv);
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Export failed' });
    }
  });

  // Download sample CSV template
  app.get('/api/v1/menu/import/sample', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, async (req, reply) => {
    const sample = generateSampleCSV();
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename=menu_sample.csv');
    return reply.send(sample);
  });

  // GET /api/v1/menu/health?outletId=xxx
  app.get('/api/v1/menu/health', {
    preHandler: [authMiddleware, userContextMiddleware, roleMiddleware(['BRAND_OWNER', 'OUTLET_MANAGER'])]
  }, async (req, reply) => {
    const { outletId } = req.query;
    if (!outletId) return reply.code(400).send({ error: 'outletId required' });
    try {
      const result = await pool.query(`
      SELECT
        COUNT(*) AS total_items,
        COUNT(CASE WHEN mi.category_id IS NOT NULL THEN 1 END) AS with_category,
        COUNT(CASE WHEN mi.base_price > 0 THEN 1 END) AS with_price,
        COUNT(CASE WHEN mi.status = 'active' THEN 1 END) AS active_items,
        COUNT(CASE WHEN mi.status = 'hidden' THEN 1 END) AS hidden_items,
        COUNT(CASE WHEN mi.status = 'draft' THEN 1 END) AS draft_items,
        COUNT(CASE WHEN mi.description IS NULL OR mi.description = '' THEN 1 END) AS missing_description
      FROM menu_items mi
      WHERE mi.outlet_id = $1
    `, [outletId]);
      const stats = result.rows[0];
      const total = parseInt(stats.total_items) || 0;
      let points = 0;
      let maxPoints = 0;
      if (total > 0) {
        maxPoints = total * 3;
        points = (parseInt(stats.with_category) || 0) * 1
          + (parseInt(stats.with_price) || 0) * 1
          + (parseInt(stats.active_items) || 0) * 1;
      }
      const score = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
      return reply.send({
        success: true,
        data: {
          total_items: total,
          with_category: parseInt(stats.with_category) || 0,
          with_price: parseInt(stats.with_price) || 0,
          active_items: parseInt(stats.active_items) || 0,
          hidden_items: parseInt(stats.hidden_items) || 0,
          draft_items: parseInt(stats.draft_items) || 0,
          missing_description: parseInt(stats.missing_description) || 0,
          health_score: score
        }
      });
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch menu health' });
    }
  });

  // Public endpoints (no auth)
  app.get('/api/v1/public/categories', menuController.listPublicCategories);
  app.get('/api/v1/public/items', menuController.listPublicMenuItems);
}

module.exports = menuRoutes;