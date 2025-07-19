/**
 * TP-07: Public Routes Index
 * Organizes all public booking API endpoints
 */

import { Router } from 'express';
import bookingRouter from './booking';

const router = Router();

// Mount booking routes
router.use('/', bookingRouter);

// Health check for public API
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Public Booking API',
    version: '1.0.0',
    features: ['TP-07'],
    endpoints: {
      services: '/public/{slug}/services',
      staff: '/public/{slug}/staff', 
      availability: '/public/{slug}/availability',
      booking: '/public/{slug}/booking',
      cancel: '/public/{slug}/booking/{id}/cancel',
      reschedule: '/public/{slug}/booking/{id}/reschedule',
      details: '/public/{slug}/booking/{id}'
    },
    documentation: 'https://github.com/DesignCorporation/beauty/blob/main/docs/api/public-booking.md'
  });
});

export default router;
