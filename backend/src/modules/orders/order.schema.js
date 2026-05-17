const { z } = require('zod');

const createOrderSchema = z.object({

  organizationId: z.string(),

  outletId: z.string(),

  orderSource: z.enum([
    'DINE_IN',
    'TAKEAWAY',
    'DELIVERY',
    'SWIGGY',
    'ZOMATO',
    'QR',
    'KIOSK',
    'CAPTAIN'
  ]),

  customerName: z.string().optional(),

  customerMobile: z.string().optional(),

  items: z.array(
    z.object({
      itemName: z.string(),
      quantity: z.number(),
      unitPrice: z.number()
    })
  ).min(1)
});

module.exports = {
  createOrderSchema
};