/**
 * NotificationService - Integration with TP-06 Messaging Hub for booking notifications
 * Handles automated messaging for appointment lifecycle events
 */

import { MessageHub } from './messaging/MessageHub';
import { resolveLocale } from '../lib/languageResolver';

export interface BookingNotificationData {
  salonId: string;
  clientId: string;
  appointmentId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientPreferredLocale?: string;
  staffName?: string;
  services: Array<{
    name: string;
    duration: number;
  }>;
  appointmentDate: Date;
  appointmentTime: string;
  totalDuration: number;
  salonName: string;
  salonAddress?: string;
  salonPhone?: string;
}

export class NotificationService {
  /**
   * Send booking confirmation notification
   */
  static async sendBookingConfirmation(data: BookingNotificationData): Promise<void> {
    try {
      // Resolve client's preferred language
      const locale = await resolveLocale({
        clientPreferences: {
          preferred: data.clientPreferredLocale,
          alternate: []
        },
        salonConfig: {
          supported: ['pl', 'en', 'uk', 'ru'], // This should come from salon config
          publicDefault: 'pl',
          primary: 'pl'
        }
      });

      const templateData = {
        clientName: data.clientName,
        salonName: data.salonName,
        appointmentDate: data.appointmentDate.toLocaleDateString(locale),
        appointmentTime: data.appointmentTime,
        staffName: data.staffName || 'Our team',
        services: data.services.map(s => s.name).join(', '),
        totalDuration: `${data.totalDuration} min`,
        salonAddress: data.salonAddress,
        salonPhone: data.salonPhone
      };

      // Send via available channels
      const channels = [];
      
      if (data.clientPhone) {
        channels.push('TELEGRAM'); // If client has Telegram
      }
      
      if (data.clientEmail) {
        channels.push('EMAIL');
      }

      for (const channel of channels) {
        try {
          await MessageHub.sendMessage({
            tenantId: data.salonId,
            clientId: data.clientId,
            channel: channel as any,
            templateCode: 'booking_confirmed',
            templateData,
            locale
          });
        } catch (error) {
          console.error(`Failed to send booking confirmation via ${channel}:`, error);
        }
      }

      console.log(`Booking confirmation sent for appointment ${data.appointmentId}`);

    } catch (error) {
      console.error('Error sending booking confirmation:', error);
    }
  }

  /**
   * Send booking cancellation notification
   */
  static async sendBookingCancellation(
    data: BookingNotificationData,
    reason?: string
  ): Promise<void> {
    try {
      const locale = await resolveLocale({
        clientPreferences: {
          preferred: data.clientPreferredLocale,
          alternate: []
        },
        salonConfig: {
          supported: ['pl', 'en', 'uk', 'ru'],
          publicDefault: 'pl',
          primary: 'pl'
        }
      });

      const templateData = {
        clientName: data.clientName,
        salonName: data.salonName,
        appointmentDate: data.appointmentDate.toLocaleDateString(locale),
        appointmentTime: data.appointmentTime,
        reason: reason || 'Client request',
        salonPhone: data.salonPhone
      };

      // Send via available channels
      const channels = [];
      
      if (data.clientPhone) {
        channels.push('TELEGRAM');
      }
      
      if (data.clientEmail) {
        channels.push('EMAIL');
      }

      for (const channel of channels) {
        try {
          await MessageHub.sendMessage({
            tenantId: data.salonId,
            clientId: data.clientId,
            channel: channel as any,
            templateCode: 'booking_cancelled',
            templateData,
            locale
          });
        } catch (error) {
          console.error(`Failed to send booking cancellation via ${channel}:`, error);
        }
      }

      console.log(`Booking cancellation sent for appointment ${data.appointmentId}`);

    } catch (error) {
      console.error('Error sending booking cancellation:', error);
    }
  }

  /**
   * Send booking reschedule notification
   */
  static async sendBookingReschedule(
    data: BookingNotificationData,
    oldDate: Date,
    oldTime: string
  ): Promise<void> {
    try {
      const locale = await resolveLocale({
        clientPreferences: {
          preferred: data.clientPreferredLocale,
          alternate: []
        },
        salonConfig: {
          supported: ['pl', 'en', 'uk', 'ru'],
          publicDefault: 'pl',
          primary: 'pl'
        }
      });

      const templateData = {
        clientName: data.clientName,
        salonName: data.salonName,
        oldDate: oldDate.toLocaleDateString(locale),
        oldTime,
        newDate: data.appointmentDate.toLocaleDateString(locale),
        newTime: data.appointmentTime,
        staffName: data.staffName || 'Our team',
        services: data.services.map(s => s.name).join(', '),
        salonPhone: data.salonPhone
      };

      // Send via available channels
      const channels = [];
      
      if (data.clientPhone) {
        channels.push('TELEGRAM');
      }
      
      if (data.clientEmail) {
        channels.push('EMAIL');
      }

      for (const channel of channels) {
        try {
          await MessageHub.sendMessage({
            tenantId: data.salonId,
            clientId: data.clientId,
            channel: channel as any,
            templateCode: 'booking_rescheduled',
            templateData,
            locale
          });
        } catch (error) {
          console.error(`Failed to send booking reschedule via ${channel}:`, error);
        }
      }

      console.log(`Booking reschedule sent for appointment ${data.appointmentId}`);

    } catch (error) {
      console.error('Error sending booking reschedule:', error);
    }
  }

  /**
   * Send reminder notification (for future n8n integration)
   */
  static async sendBookingReminder(
    data: BookingNotificationData,
    reminderType: '24h' | '2h' | '30min' = '24h'
  ): Promise<void> {
    try {
      const locale = await resolveLocale({
        clientPreferences: {
          preferred: data.clientPreferredLocale,
          alternate: []
        },
        salonConfig: {
          supported: ['pl', 'en', 'uk', 'ru'],
          publicDefault: 'pl',
          primary: 'pl'
        }
      });

      const templateData = {
        clientName: data.clientName,
        salonName: data.salonName,
        appointmentDate: data.appointmentDate.toLocaleDateString(locale),
        appointmentTime: data.appointmentTime,
        staffName: data.staffName || 'Our team',
        services: data.services.map(s => s.name).join(', '),
        reminderType,
        salonAddress: data.salonAddress,
        salonPhone: data.salonPhone
      };

      // Send via available channels
      const channels = [];
      
      if (data.clientPhone) {
        channels.push('TELEGRAM');
      }
      
      if (data.clientEmail) {
        channels.push('EMAIL');
      }

      for (const channel of channels) {
        try {
          await MessageHub.sendMessage({
            tenantId: data.salonId,
            clientId: data.clientId,
            channel: channel as any,
            templateCode: `reminder_${reminderType}`,
            templateData,
            locale
          });
        } catch (error) {
          console.error(`Failed to send booking reminder via ${channel}:`, error);
        }
      }

      console.log(`Booking reminder (${reminderType}) sent for appointment ${data.appointmentId}`);

    } catch (error) {
      console.error('Error sending booking reminder:', error);
    }
  }

  /**
   * Create notification data from appointment record
   */
  static createNotificationData(appointment: any, salon: any): BookingNotificationData {
    return {
      salonId: appointment.salonId,
      clientId: appointment.clientId,
      appointmentId: appointment.id,
      clientName: appointment.client.name,
      clientPhone: appointment.client.phone,
      clientEmail: appointment.client.email,
      clientPreferredLocale: appointment.client.preferredLocale,
      staffName: appointment.staff?.name,
      services: appointment.services.map((as: any) => ({
        name: as.service.baseName, // TODO: Use translated name based on locale
        duration: as.service.durationMin
      })),
      appointmentDate: new Date(appointment.startAt),
      appointmentTime: new Date(appointment.startAt).toTimeString().slice(0, 5),
      totalDuration: appointment.services.reduce(
        (sum: number, as: any) => sum + as.service.durationMin, 
        0
      ),
      salonName: salon.displayName,
      salonAddress: salon.addressStreet ? 
        `${salon.addressStreet}, ${salon.addressCity}` : 
        undefined,
      salonPhone: salon.phone
    };
  }
}

export default NotificationService;
