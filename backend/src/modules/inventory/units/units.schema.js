const { z } = require('zod');
const { UNIT_TYPES } = require('../shared/constants');

const createUnitSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  unitType: z.enum(UNIT_TYPES),
  isBaseUnit: z.boolean().optional()
});

const updateUnitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(20).optional(),
  unitType: z.enum(UNIT_TYPES).optional(),
  isBaseUnit: z.boolean().optional(),
  isActive: z.boolean().optional()
});

module.exports = {
  createUnitSchema,
  updateUnitSchema
};