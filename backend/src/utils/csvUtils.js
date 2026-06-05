const csv = require('csv-parser');
const { Readable } = require('stream');


/**
 * Parse CSV buffer and validate each row
 * Returns { validRows: [], errors: [{ row, message }] }
 */
async function parseAndValidateMenuCSV(buffer, outletId, organizationId) {
  const rows = [];
  const errors = [];
  let rowNumber = 1;

  const stream = Readable.from(buffer.toString());
  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        rowNumber++;
        const row = { ...data };
        const validationErrors = [];

        // Required fields
        if (!row.name) validationErrors.push('Missing name');
        if (!row.category) validationErrors.push('Missing category');
        if (!row.base_price || isNaN(parseFloat(row.base_price))) validationErrors.push('Invalid price');

        if (validationErrors.length) {
          errors.push({ row: rowNumber, message: validationErrors.join(', ') });
        } else {
          row.id = row.id || null;
          row.base_price = parseFloat(row.base_price);
          row.is_veg = row.is_veg === 'true' || row.is_veg === '1' || row.is_veg === 'yes';
          row.status = row.status || 'active';
          if (row.variants) {
            try {
              row.variants = JSON.parse(row.variants);
            } catch (e) {
              validationErrors.push('Invalid variants JSON');
            }
          }
          if (row.modifier_groups) {
            try {
              row.modifier_groups = JSON.parse(row.modifier_groups);
            } catch (e) {
              validationErrors.push('Invalid modifier_groups JSON');
            }
          }
          if (validationErrors.length) {
            errors.push({ row: rowNumber, message: validationErrors.join(', ') });
          } else {
            rows.push(row);
          }
        }
      })
      .on('end', () => resolve({ validRows: rows, errors }))
      .on('error', reject);
  });
}

/**
 * Generate sample CSV content (as string)
 */
function generateSampleCSV() {
  const headers = [
    'id', 'name', 'category', 'base_price', 'description', 'is_veg',
    'status', 'variants', 'modifier_groups'
  ];
  const sampleRows = [
    {
      id: '',
      name: 'Butter Chicken',
      category: 'Main Course',
      base_price: '420',
      description: 'Creamy tomato gravy',
      is_veg: 'false',
      status: 'active',
      variants: '[{"name":"Regular","price":420},{"name":"Large","price":620}]',
      modifier_groups: '[{"name":"Extra Cheese","price":40}]'
    },
    {
      id: '',
      name: 'Cold Coffee',
      category: 'Beverages',
      base_price: '150',
      description: 'Chilled coffee',
      is_veg: 'true',
      status: 'active',
      variants: '',
      modifier_groups: ''
    }
  ];
  return [headers.join(','), ...sampleRows.map(row => Object.values(row).join(','))].join('\n');
}

module.exports = { parseAndValidateMenuCSV, generateSampleCSV };