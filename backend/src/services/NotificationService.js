const pool = require('../config/database');

/**
 * NotificationService
 * Handles push notifications via Firebase Cloud Messaging (FCM)
 * 
 * Note: Firebase Admin SDK setup required (see .env.example)
 */
class NotificationService {
  constructor() {
    this.initialized = false;
    this.admin = null;
    
    // Try to initialize Firebase Admin SDK
    this._initFirebase();
  }
  
  _initFirebase() {
    try {
      if (process.env.FIREBASE_PROJECT_ID) {
        const admin = require('firebase-admin');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        
        this.admin = admin;
        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized');
      } else {
        console.warn('⚠️  Firebase credentials not configured. Push notifications disabled.');
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      this.initialized = false;
    }
  }
  
  /**
   * Send push notification to a user
   * @param {string} fcmToken - User's FCM token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   */
  async sendPushNotification(fcmToken, title, body, data = {}) {
    if (!this.initialized) {
      console.log('📱 [MOCK] Push notification:', { fcmToken, title, body });
      return { success: false, reason: 'Firebase not initialized' };
    }
    
    try {
      const message = {
        notification: { title, body },
        data: data,
        token: fcmToken,
      };
      
      const response = await this.admin.messaging().send(message);
      
      // Log to database
      await this._logNotification(null, 'push', title, body, data, 'sent');
      
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Push notification error:', error.message);
      
      // Log error
      await this._logNotification(null, 'push', title, body, data, 'failed', error.message);
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send notification to multiple users
   */
  async sendMulticastNotification(fcmTokens, title, body, data = {}) {
    if (!this.initialized || fcmTokens.length === 0) {
      console.log('📱 [MOCK] Multicast notification:', { count: fcmTokens.length, title, body });
      return;
    }
    
    try {
      const message = {
        notification: { title, body },
        data: data,
        tokens: fcmTokens.filter(t => t), // Remove null tokens
      };
      
      await this.admin.messaging().sendMulticast(message);
      console.log(`✅ Sent notifications to ${fcmTokens.length} devices`);
    } catch (error) {
      console.error('❌ Multicast notification error:', error.message);
    }
  }
  
  // ==========================================
  // NOTIFICATION TYPES
  // ==========================================
  
  /**
   * 1. Daily Reminder (8:30 AM)
   */
  async notifyDailyReminder(users) {
    const title = '🍱 Nhắc nhở đặt cơm hôm nay!';
    const body = 'Đừng quên đặt cơm trưa nhé! Chốt sổ lúc 11:30 AM.';
    
    const tokens = users.map(u => u.fcm_token).filter(t => t);
    await this.sendMulticastNotification(tokens, title, body, { type: 'daily_reminder' });
  }
  
  /**
   * 2. Buyers Selected (11:30 AM)
   */
  async notifyBuyersSelected(selectedBuyers, sessionDate) {
    for (const buyer of selectedBuyers) {
      if (buyer.fcm_token) {
        const title = '🎯 Bạn được chọn đi mua cơm!';
        const body = `Hôm nay (${sessionDate}) bạn là 1 trong 4 người đi mua. Nhớ ghé mua nhé!`;
        
        await this.sendPushNotification(
          buyer.fcm_token,
          title,
          body,
          { type: 'buyer_selected', session_date: sessionDate }
        );
      }
    }
    
    console.log(`✅ Notified ${selectedBuyers.length} buyers`);
  }
  
  /**
   * 3. Payment Reminder (for buyers)
   */
  async notifyPaymentReminder(buyers, sessionDate) {
    for (const buyer of buyers) {
      if (buyer.fcm_token) {
        const title = '💰 Nhắc nhở thanh toán';
        const body = 'Đã mua xong chưa? Nhớ chụp bill và submit thanh toán nhé!';
        
        await this.sendPushNotification(
          buyer.fcm_token,
          title,
          body,
          { type: 'payment_reminder', session_date: sessionDate }
        );
      }
    }
  }
  
  /**
   * 4. Settlement Complete
   */
  async notifySettlementComplete(participants, sessionDate, amountPerPerson, totalBill, payerId) {
    for (const participant of participants) {
      if (participant.fcm_token) {
        const isPayer = participant.user_id === payerId;
        
        const title = isPayer ? '✅ Đã quyết toán (Bạn là người trả)' : '✅ Đã quyết toán';
        const body = isPayer
          ? `Đã trừ ${amountPerPerson.toLocaleString()} VND từ tài khoản của bạn. Tổng bill: ${totalBill.toLocaleString()} VND.`
          : `Đã trừ ${amountPerPerson.toLocaleString()} VND từ tài khoản của bạn.`;
        
        await this.sendPushNotification(
          participant.fcm_token,
          title,
          body,
          {
            type: 'settlement_complete',
            session_date: sessionDate,
            amount_per_person: amountPerPerson,
            is_payer: isPayer
          }
        );
      }
    }
    
    console.log(`✅ Notified ${participants.length} participants about settlement`);
  }
  
  /**
   * 5. Low Balance Warning
   */
  async notifyLowBalance(user, balance, threshold) {
    if (!user.fcm_token) return;
    
    const title = '⚠️ Số dư thấp';
    const body = `Số dư của bạn còn ${balance.toLocaleString()} VND. Nạp thêm để đảm bảo đủ tiền đặt cơm nhé!`;
    
    await this.sendPushNotification(
      user.fcm_token,
      title,
      body,
      { type: 'low_balance', balance, threshold }
    );
  }
  
  /**
   * 6. Deposit Approved
   */
  async notifyDepositApproved(user, amount) {
    if (!user.fcm_token) return;
    
    const title = '✅ Nạp tiền thành công';
    const body = `Admin đã duyệt yêu cầu nạp ${amount.toLocaleString()} VND của bạn.`;
    
    await this.sendPushNotification(
      user.fcm_token,
      title,
      body,
      { type: 'deposit_approved', amount }
    );
  }
  
  /**
   * 7. Deposit Rejected
   */
  async notifyDepositRejected(user, amount, reason) {
    if (!user.fcm_token) return;
    
    const title = '❌ Yêu cầu nạp tiền bị từ chối';
    const body = reason || `Yêu cầu nạp ${amount.toLocaleString()} VND bị từ chối.`;
    
    await this.sendPushNotification(
      user.fcm_token,
      title,
      body,
      { type: 'deposit_rejected', amount, reason }
    );
  }
  
  // ==========================================
  // LOGGING
  // ==========================================
  
  /**
   * Log notification to database
   * @private
   */
  async _logNotification(userId, type, title, body, data, status, errorMessage = null) {
    try {
      await pool.query(`
        INSERT INTO notification_logs (user_id, type, title, body, data, status, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, type, title, body, JSON.stringify(data), status, errorMessage]);
    } catch (error) {
      console.error('Failed to log notification:', error.message);
    }
  }
}

module.exports = new NotificationService();
