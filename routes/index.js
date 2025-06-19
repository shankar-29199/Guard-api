const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const tenantRoutes = require('./tenants');
const deviceRoutes = require('./devices');
const appRoutes = require('./apps');

// Public routes
router.use('/users', userRoutes);
router.use('/tenants', tenantRoutes);
router.use('/devices', deviceRoutes);
router.use('/apps', appRoutes);

module.exports = router; 