const express = require('express');
const db = require('../config/database');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const createDeviceSchema = Joi.object({
  tenant_id: Joi.string().uuid().required(),
  device_uid: Joi.string().required(),
  device_name: Joi.string().min(2).max(255),
  device_type: Joi.string().valid('android', 'ios', 'web').required(),
  owner_user_id: Joi.string().uuid(),
  child_id: Joi.string().uuid(),
  os: Joi.string(),
  os_version: Joi.string(),
  status: Joi.string().valid('active', 'inactive', 'blocked').default('active')
});

const updateDeviceSchema = Joi.object({
  device_name: Joi.string().min(2).max(255),
  device_type: Joi.string().valid('android', 'ios', 'web'),
  owner_user_id: Joi.string().uuid(),
  child_id: Joi.string().uuid(),
  os: Joi.string(),
  os_version: Joi.string(),
  status: Joi.string().valid('active', 'inactive', 'blocked')
});

// GET /api/devices - Get all devices
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM devices
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Failed to fetch devices' });
  }
});

// GET /api/devices/:id - Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT * FROM devices
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ message: 'Failed to fetch device' });
  }
});

// POST /api/devices - Create new device
router.post('/', async (req, res) => {
  try {
    const { error, value } = createDeviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await db.query(`
      INSERT INTO devices (tenant_id, device_uid, device_name, device_type, owner_user_id, child_id, os, os_version, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [value.tenant_id, value.device_uid, value.device_name, value.device_type, value.owner_user_id, value.child_id, value.os, value.os_version, value.status]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Device already exists' });
    }
    console.error('Error creating device:', error);
    res.status(500).json({ message: 'Failed to create device' });
  }
});

// PUT /api/devices/:id - Update device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDeviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await db.query(`
      UPDATE devices
      SET device_name = $1, device_type = $2, owner_user_id = $3, child_id = $4, os = $5, os_version = $6, status = $7, updated_at = NOW()
      WHERE id = $8 AND deleted_at IS NULL
      RETURNING *
    `, [value.device_name, value.device_type, value.owner_user_id, value.child_id, value.os, value.os_version, value.status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Failed to update device' });
  }
});

// DELETE /api/devices/:id - Soft delete device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      UPDATE devices
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Failed to delete device' });
  }
});

module.exports = router; 