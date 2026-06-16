require('dotenv').config();

const pool = require('../src/config/db');
const crypto = require('crypto');

const ORGANIZATION_ID = 'org_5e88306e84';
const TARGET_ORDERS = 300;
const DAYS = 45;

const OUTLETS = [
  { id: 'out_438b82aa9c', weight: 55, profile: 'healthy' },
  { id: 'out_f120852dd4', weight: 20, profile: 'stable' },
  { id: 'out_3230bbcea2', weight: 12, profile: 'attention' },
  { id: 'out_34dfb1ef9f', weight: 8, profile: 'low' },
  { id: 'out_fc576df570', weight: 5, profile: 'new' }
];

const USERS = [
  'usr_d12fc377d1',
  'usr_24417e9703',
  'usr_97048ea55f',
  'usr_470a1c80b6',
  'usr_82a1162909'
];

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(arr) {
  const total = arr.reduce((s, i) => s + i.weight, 0);

  let r = Math.random() * total;

  for (const item of arr) {
    r -= item.weight;

    if (r <= 0) {
      return item;
    }
  }

  return arr[0];
}

async function loadMenuItems() {
  const result = await pool.query(`
    SELECT
      id,
      outlet_id,
      name,
      base_price
    FROM menu_items
    WHERE outlet_id IN (
      'out_438b82aa9c',
      'out_f120852dd4',
      'out_3230bbcea2',
      'out_34dfb1ef9f',
      'out_fc576df570'
    )
  `);

  const map = {};

  result.rows.forEach(item => {
    if (!map[item.outlet_id]) {
      map[item.outlet_id] = [];
    }

    map[item.outlet_id].push(item);
  });

  return map;
}


function generateOrderTime(date) {

  const roll = Math.random();

  let hour;

  if (roll < 0.35) {
    hour = randomInt(12, 15);
  } else if (roll < 0.80) {
    hour = randomInt(19, 22);
  } else {
    hour = randomInt(9, 18);
  }

  const dt = new Date(date);

  dt.setHours(
    hour,
    randomInt(0, 59),
    randomInt(0, 59),
    0
  );

  return dt;
}

function generateStatus(profile) {

  if (profile === 'attention') {

    const r = Math.random();

    if (r < 0.15) return 'CANCELLED';
    if (r < 0.20) return 'READY';
    if (r < 0.25) return 'PREPARING';

    return 'COMPLETED';
  }

  const r = Math.random();

  if (r < 0.08) return 'CANCELLED';
  if (r < 0.12) return 'READY';
  if (r < 0.16) return 'PREPARING';
  if (r < 0.18) return 'NEW';

  return 'COMPLETED';
}

async function generate() {

  const menuByOutlet = await loadMenuItems();

  let orderCount = 0;
  let itemCount = 0;

  for (let d = DAYS; d >= 0; d--) {

    const day = new Date();

    day.setDate(day.getDate() - d);

    const weekday = day.getDay();

    let multiplier = 1;

    switch (weekday) {
      case 0: multiplier = 1.9; break;
      case 6: multiplier = 1.7; break;
      case 5: multiplier = 1.3; break;
      case 4: multiplier = 1.1; break;
      case 1: multiplier = 0.8; break;
      case 2: multiplier = 0.9; break;
      default: multiplier = 1;
    }

    const ordersToday =
      Math.max(
        3,
        Math.round(
          (TARGET_ORDERS / DAYS) * multiplier
        )
      );

    for (let i = 0; i < ordersToday; i++) {

      const outlet = weightedPick(OUTLETS);

      if (
        outlet.profile === 'new' &&
        d > 10
      ) {
        continue;
      }

      const menu = menuByOutlet[outlet.id];

      if (!menu || menu.length === 0) {
        continue;
      }

      const orderId = randomId('ord');

      const createdAt = generateOrderTime(day);

      const status = generateStatus(outlet.profile);

      const paymentStatus =
        status === 'COMPLETED'
          ? 'PAID'
          : (Math.random() > 0.7 ? 'PAID' : 'PENDING');

      const paymentMethod = weightedPick([
        { value: 'UPI', weight: 55 },
        { value: 'CASH', weight: 30 },
        { value: 'CARD', weight: 15 }
      ]).value;

      const orderSource = weightedPick([
        { value: 'DINE_IN', weight: 45 },
        { value: 'TAKEAWAY', weight: 25 },
        { value: 'PUBLIC_QR', weight: 15 },
        { value: 'DELIVERY', weight: 15 }
      ]).value;

      const itemsPerOrder = weightedPick([
        { value: 1, weight: 15 },
        { value: 2, weight: 35 },
        { value: 3, weight: 30 },
        { value: 4, weight: 15 },
        { value: 5, weight: 5 }
      ]).value;

      let subtotal = 0;
      const orderItems = [];

      for (let j = 0; j < itemsPerOrder; j++) {

        const item = pick(menu);

        const qty = randomInt(1, 3);

        const lineTotal =
          Number(item.base_price) * qty;

        subtotal += lineTotal;

        orderItems.push({
          id: randomId('oi'),
          menuItemId: item.id,
          name: item.name,
          qty,
          price: item.base_price,
          lineTotal
        });
      }

      await pool.query(`
        INSERT INTO orders (
          id,
          organization_id,
          outlet_id,
          order_no,
          order_source,
          order_status,
          subtotal,
          tax_amount,
          discount_amount,
          grand_total,
          payment_status,
          created_by,
          created_at,
          updated_at,
          source,
          payment_method,
          assigned_to_user_id
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,0,0,$8,$9,$10,
          $11,$12,'CAPTAIN',$13,$14
        )
      `, [
        orderId,
        ORGANIZATION_ID,
        outlet.id,
        `ORD-${Date.now()}${randomInt(1000,9999)}`,
        orderSource,
        status,
        subtotal,
        subtotal,
        paymentStatus,
        pick(USERS),
        createdAt,
        createdAt,
        paymentMethod,
        pick(USERS)
      ]);

      for (const oi of orderItems) {

        await pool.query(`
          INSERT INTO order_items (
            id,
            order_id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            line_total,
            created_at
          )
          VALUES (
            $1,$2,$3,$4,
            $5,$6,$7,$8
          )
        `, [
          oi.id,
          orderId,
          oi.menuItemId,
          oi.name,
          oi.qty,
          oi.price,
          oi.lineTotal,
          createdAt
        ]);

        itemCount++;
      }

      orderCount++;
    }
  }

  console.log(`
====================================
Seed Completed
Orders: ${orderCount}
Order Items: ${itemCount}
====================================
`);
}

generate()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async err => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });