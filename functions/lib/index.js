"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSummary = exports.onOrderStatusUpdate = exports.onNewOrder = exports.onDesignRequestStatusUpdate = exports.onNewCustomDesignRequest = exports.onContactMessageReply = exports.onNewContactMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
const db = admin.firestore();
// Configure email transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const ADMIN_EMAIL = process.env.EMAIL_USER || 'nilkanthfashions1309@gmail.com';
// ====== TRIGGER: New Contact Message ======
exports.onNewContactMessage = functions.firestore
    .document('contactMessages/{msgId}')
    .onCreate(async (snap) => {
    const data = snap.data();
    if (!data)
        return;
    try {
        const priorityEmoji = { urgent: '🚨', high: '⚠️', medium: '📩', low: '📬' };
        const emoji = priorityEmoji[data.priority || 'medium'] || '📩';
        // Notify admin
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `${emoji} New Contact Message — ${data.name} [${data.priority || 'medium'} priority]`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px;">${emoji} New Contact Message</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:6px 0; color:#6b7280; width:120px;">Name</td><td style="padding:6px 0; color:#111827; font-weight:600;">${data.name}</td></tr>
                <tr><td style="padding:6px 0; color:#6b7280;">Email</td><td style="padding:6px 0; color:#111827;">${data.email}</td></tr>
                ${data.phone ? `<tr><td style="padding:6px 0; color:#6b7280;">Phone</td><td style="padding:6px 0; color:#111827;">${data.phone}</td></tr>` : ''}
                <tr><td style="padding:6px 0; color:#6b7280;">Subject</td><td style="padding:6px 0; color:#111827; text-transform:capitalize;">${(data.subject || '').replace(/-/g, ' ')}</td></tr>
                <tr><td style="padding:6px 0; color:#6b7280;">Priority</td><td style="padding:6px 0; font-weight:bold; color:${data.priority === 'urgent' ? '#dc2626' : data.priority === 'high' ? '#ea580c' : '#2563eb'};">${(data.priority || 'medium').toUpperCase()}</td></tr>
              </table>
              <div style="background:white; padding:16px; border-radius:10px; margin-top:16px; border-left:4px solid #e11d48;">
                <p style="margin:0; color:#374151;">${data.message}</p>
              </div>
              <div style="text-align:center; margin-top:20px;">
                <a href="https://nilkanthfashion.ca/admin/messages" style="background:linear-gradient(135deg,#e11d48,#9333ea); color:white; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold;">
                  Reply in Admin Panel
                </a>
              </div>
            </div>
          </div>
        `,
        });
        // Confirm to sender
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: data.email,
            subject: '✅ Message Received — Nilkanth Fashions',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Message Received!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p>Hi <strong>${data.name}</strong>,</p>
              <p>Thank you for reaching out to Nilkanth Fashions! We've received your message and will get back to you within <strong>24 hours</strong>.</p>
              <div style="background:white; padding:16px; border-radius:10px; margin:16px 0; border-left:4px solid #e11d48;">
                <p style="margin:0; color:#6b7280; font-size:14px;"><em>"${data.message.slice(0, 200)}${data.message.length > 200 ? '…' : ''}"</em></p>
              </div>
              <p>You can view your message history in your <a href="https://nilkanthfashion.ca/user/messages" style="color:#e11d48;">account dashboard</a>.</p>
              <p style="color:#6b7280; font-size:14px;">— Team Nilkanth Fashions<br>nilkanthfashion.ca</p>
            </div>
          </div>
        `,
        });
    }
    catch (error) {
        console.error('Contact message email error:', error);
    }
});
// ====== TRIGGER: Admin Reply to Contact Message ======
exports.onContactMessageReply = functions.firestore
    .document('contactMessages/{msgId}')
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after)
        return;
    const prevReplies = before?.replies?.length || 0;
    const newReplies = after?.replies?.length || 0;
    if (newReplies <= prevReplies)
        return; // No new reply added
    const latestReply = after.replies[newReplies - 1];
    if (!latestReply || !after.email)
        return;
    try {
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: after.email,
            subject: '💬 Reply from Nilkanth Fashions — Your Message',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed, #e11d48); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">You have a reply!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p>Hi <strong>${after.name}</strong>,</p>
              <p>We've replied to your message about <strong>${(after.subject || '').replace(/-/g, ' ')}</strong>:</p>
              <div style="background:white; border:1px solid #e5e7eb; padding:20px; border-radius:12px; margin:16px 0; border-left:4px solid #7c3aed;">
                <p style="margin:0; color:#374151;">${latestReply.message}</p>
                <p style="margin:12px 0 0; color:#9ca3af; font-size:12px;">— ${latestReply.adminName}</p>
              </div>
              <div style="text-align:center; margin-top:20px;">
                <a href="https://nilkanthfashion.ca/user/messages" style="background:linear-gradient(135deg,#7c3aed,#e11d48); color:white; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold;">
                  View Full Conversation
                </a>
              </div>
              <p style="color:#6b7280; font-size:14px; margin-top:20px;">— Team Nilkanth Fashions</p>
            </div>
          </div>
        `,
        });
    }
    catch (error) {
        console.error('Reply email error:', error);
    }
});
// ====== TRIGGER: New Custom Design Request ======
exports.onNewCustomDesignRequest = functions.firestore
    .document('customDesignRequests/{requestId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    try {
        // Notify admin
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `🎨 New Custom Design Request — ${data.userName}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Design Request</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937;">Customer Details</h2>
              <p><strong>Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Category:</strong> ${data.category?.replace(/-/g, ' ')}</p>
              <p><strong>Occasion:</strong> ${data.occasion}</p>
              <p><strong>Preferred Fabric:</strong> ${data.preferredFabric || 'Not specified'}</p>
              <p><strong>Budget:</strong> ${data.budget ? `CAD $${data.budget}` : 'Not specified'}</p>
              <h3 style="color: #1f2937;">Description</h3>
              <p style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #e11d48;">${data.description}</p>
              <div style="margin-top: 20px; text-align: center;">
                <a href="https://nilkanthfashion.ca/admin/requests"
                   style="background: linear-gradient(135deg, #e11d48, #9333ea); color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold;">
                  Review in Admin Panel
                </a>
              </div>
            </div>
          </div>
        `,
        });
        // Confirm to user
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: data.userEmail,
            subject: '✨ Your Design Request is Under Review — Nilkanth Fashions',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Request Received!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p>Hi <strong>${data.userName}</strong>,</p>
              <p>Thank you for submitting your custom design request to Nilkanth Fashions! 🎉</p>
              <p>Our design team is reviewing your request and will get back to you within <strong>24-48 hours</strong>.</p>
              <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #e11d48;">
                <h3 style="color: #e11d48; margin-top: 0;">What Happens Next?</h3>
                <ol>
                  <li>Our team reviews your design images</li>
                  <li>We confirm feasibility and provide a price estimate</li>
                  <li>You receive an approval notification</li>
                  <li>You proceed to fabric selection and measurements</li>
                  <li>Production begins after your final confirmation</li>
                </ol>
              </div>
              <p>Questions? Reply to this email or WhatsApp us!</p>
              <p style="color: #6b7280; font-size: 14px;">— Team Nilkanth Fashions<br>nilkanthfashion.ca</p>
            </div>
          </div>
        `,
        });
    }
    catch (error) {
        console.error('Email notification error:', error);
    }
});
// ====== TRIGGER: Design Request Approved ======
exports.onDesignRequestStatusUpdate = functions.firestore
    .document('customDesignRequests/{requestId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after || before?.status === after.status)
        return;
    if (after.status === 'approved') {
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: after.userEmail,
            subject: '✅ Your Design Request is Approved! — Nilkanth Fashions',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">🎉 Design Approved!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <p>Hi <strong>${after.userName}</strong>,</p>
              <p>Great news! Your custom design request has been <strong style="color: #10b981;">approved</strong>!</p>
              <p>Please log in to your dashboard to:</p>
              <ul>
                <li>Select your fabric</li>
                <li>Provide your measurements</li>
                <li>Choose delivery method</li>
                <li>Confirm your order</li>
              </ul>
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://nilkanthfashion.ca/user/dashboard"
                   style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
        });
    }
    else if (after.status === 'rejected') {
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: after.userEmail,
            subject: 'Design Request Update — Nilkanth Fashions',
            html: `
          <p>Hi ${after.userName}, unfortunately we could not accommodate your design request at this time. ${after.adminNote ? `Note from our team: ${after.adminNote}` : ''} Please browse our existing collections or submit a new request. — Team Nilkanth Fashions</p>
        `,
        });
    }
});
// ====== TRIGGER: New Order ======
exports.onNewOrder = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data)
        return;
    try {
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `📦 New Order — ${data.userName} (#${context.params.orderId.slice(-6).toUpperCase()})`,
            html: `
          <p>New order received from <strong>${data.userName}</strong> (${data.userEmail}).</p>
          <p>Order ID: <strong>${context.params.orderId.slice(-6).toUpperCase()}</strong></p>
          <p>Amount: <strong>CAD $${data.totalAmount?.toFixed(2)}</strong></p>
          <p>Items: ${data.items?.map((i) => i.designName).join(', ')}</p>
          <p>Delivery: ${data.deliveryMethod}</p>
          <a href="https://nilkanthfashion.ca/admin/orders">View in Admin Panel</a>
        `,
        });
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: data.userEmail,
            subject: `🎉 Order Confirmed! #${context.params.orderId.slice(-6).toUpperCase()} — Nilkanth Fashions`,
            html: `
          <p>Hi ${data.userName}, your order has been received! We'll review and confirm it within 24 hours. Track it in your dashboard: <a href="https://nilkanthfashion.ca/user/orders">My Orders</a></p>
        `,
        });
    }
    catch (error) {
        console.error('Order email error:', error);
    }
});
// ====== TRIGGER: Order Status Update ======
exports.onOrderStatusUpdate = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after || before?.status === after.status)
        return;
    const statusMessages = {
        'in-production': 'Your order is now in production! Our tailors are crafting your outfit.',
        'quality-check': 'Your outfit has passed quality check and is being prepared for delivery.',
        'shipped': `Your order has been shipped! Tracking: ${after.trackingNumber || 'Will be updated shortly'}`,
        'delivered': 'Your order has been delivered! We hope you love it. 🎉',
    };
    const message = statusMessages[after.status];
    if (message && after.userEmail) {
        await transporter.sendMail({
            from: `"Nilkanth Fashions" <${ADMIN_EMAIL}>`,
            to: after.userEmail,
            subject: `Order Update: ${after.status.replace(/-/g, ' ')} — Nilkanth Fashions`,
            html: `<p>Hi ${after.userName}, ${message}</p><p><a href="https://nilkanthfashion.ca/user/orders">Track your order</a></p>`,
        }).catch(console.error);
    }
});
// ====== CALLABLE: Get Analytics Summary ======
exports.getAnalyticsSummary = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin')
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    const [ordersSnap, usersSnap, requestsSnap] = await Promise.all([
        db.collection('orders').get(),
        db.collection('users').get(),
        db.collection('customDesignRequests').get(),
    ]);
    const orders = ordersSnap.docs.map(d => d.data());
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const popularDesigns = {};
    orders.forEach(o => o.items?.forEach((i) => {
        popularDesigns[i.designName] = (popularDesigns[i.designName] || 0) + 1;
    }));
    return {
        totalOrders: ordersSnap.size,
        totalUsers: usersSnap.size,
        totalRequests: requestsSnap.size,
        totalRevenue,
        popularDesigns: Object.entries(popularDesigns).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
});
