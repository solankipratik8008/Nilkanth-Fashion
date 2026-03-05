"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSummary = exports.onOrderStatusUpdate = exports.onNewOrder = exports.onDesignRequestStatusUpdate = exports.onNewCustomDesignRequest = void 0;
var functions = require("firebase-functions");
var admin = require("firebase-admin");
var nodemailer = require("nodemailer");
admin.initializeApp();
var db = admin.firestore();
// Configure email transport
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.user) || process.env.EMAIL_USER,
        pass: ((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.pass) || process.env.EMAIL_PASS,
    },
});
var ADMIN_EMAIL = 'hello@nilkanthfashion.ca';
// ====== TRIGGER: New Custom Design Request ======
exports.onNewCustomDesignRequest = functions.firestore
    .document('customDesignRequests/{requestId}')
    .onCreate(function (snap, context) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                data = snap.data();
                if (!data)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                // Notify admin
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: ADMIN_EMAIL,
                        subject: "\uD83C\uDFA8 New Custom Design Request \u2014 ".concat(data.userName),
                        html: "\n          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n            <div style=\"background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;\">\n              <h1 style=\"color: white; margin: 0; font-size: 24px;\">New Design Request</h1>\n            </div>\n            <div style=\"background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;\">\n              <h2 style=\"color: #1f2937;\">Customer Details</h2>\n              <p><strong>Name:</strong> ".concat(data.userName, "</p>\n              <p><strong>Email:</strong> ").concat(data.userEmail, "</p>\n              <p><strong>Category:</strong> ").concat((_a = data.category) === null || _a === void 0 ? void 0 : _a.replace(/-/g, ' '), "</p>\n              <p><strong>Occasion:</strong> ").concat(data.occasion, "</p>\n              <p><strong>Preferred Fabric:</strong> ").concat(data.preferredFabric || 'Not specified', "</p>\n              <p><strong>Budget:</strong> ").concat(data.budget ? "CAD $".concat(data.budget) : 'Not specified', "</p>\n              <h3 style=\"color: #1f2937;\">Description</h3>\n              <p style=\"background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #e11d48;\">").concat(data.description, "</p>\n              <div style=\"margin-top: 20px; text-align: center;\">\n                <a href=\"https://nilkanthfashion.ca/admin/requests\"\n                   style=\"background: linear-gradient(135deg, #e11d48, #9333ea); color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold;\">\n                  Review in Admin Panel\n                </a>\n              </div>\n            </div>\n          </div>\n        "),
                    })];
            case 2:
                // Notify admin
                _b.sent();
                // Confirm to user
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: data.userEmail,
                        subject: '✨ Your Design Request is Under Review — Nilkanth Fashions',
                        html: "\n          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n            <div style=\"background: linear-gradient(135deg, #e11d48, #9333ea); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;\">\n              <h1 style=\"color: white; margin: 0;\">Request Received!</h1>\n            </div>\n            <div style=\"background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;\">\n              <p>Hi <strong>".concat(data.userName, "</strong>,</p>\n              <p>Thank you for submitting your custom design request to Nilkanth Fashions! \uD83C\uDF89</p>\n              <p>Our design team is reviewing your request and will get back to you within <strong>24-48 hours</strong>.</p>\n              <div style=\"background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #e11d48;\">\n                <h3 style=\"color: #e11d48; margin-top: 0;\">What Happens Next?</h3>\n                <ol>\n                  <li>Our team reviews your design images</li>\n                  <li>We confirm feasibility and provide a price estimate</li>\n                  <li>You receive an approval notification</li>\n                  <li>You proceed to fabric selection and measurements</li>\n                  <li>Production begins after your final confirmation</li>\n                </ol>\n              </div>\n              <p>Questions? Reply to this email or WhatsApp us!</p>\n              <p style=\"color: #6b7280; font-size: 14px;\">\u2014 Team Nilkanth Fashions<br>nilkanthfashion.ca</p>\n            </div>\n          </div>\n        "),
                    })];
            case 3:
                // Confirm to user
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error('Email notification error:', error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ====== TRIGGER: Design Request Approved ======
exports.onDesignRequestStatusUpdate = functions.firestore
    .document('customDesignRequests/{requestId}')
    .onUpdate(function (change, context) { return __awaiter(void 0, void 0, void 0, function () {
    var before, after;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                before = change.before.data();
                after = change.after.data();
                if (!after || (before === null || before === void 0 ? void 0 : before.status) === after.status)
                    return [2 /*return*/];
                if (!(after.status === 'approved')) return [3 /*break*/, 2];
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: after.userEmail,
                        subject: '✅ Your Design Request is Approved! — Nilkanth Fashions',
                        html: "\n          <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n            <div style=\"background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;\">\n              <h1 style=\"color: white; margin: 0;\">\uD83C\uDF89 Design Approved!</h1>\n            </div>\n            <div style=\"background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;\">\n              <p>Hi <strong>".concat(after.userName, "</strong>,</p>\n              <p>Great news! Your custom design request has been <strong style=\"color: #10b981;\">approved</strong>!</p>\n              <p>Please log in to your dashboard to:</p>\n              <ul>\n                <li>Select your fabric</li>\n                <li>Provide your measurements</li>\n                <li>Choose delivery method</li>\n                <li>Confirm your order</li>\n              </ul>\n              <div style=\"text-align: center; margin: 20px 0;\">\n                <a href=\"https://nilkanthfashion.ca/user/dashboard\"\n                   style=\"background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold;\">\n                  Go to Dashboard\n                </a>\n              </div>\n            </div>\n          </div>\n        "),
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2:
                if (!(after.status === 'rejected')) return [3 /*break*/, 4];
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: after.userEmail,
                        subject: 'Design Request Update — Nilkanth Fashions',
                        html: "\n          <p>Hi ".concat(after.userName, ", unfortunately we could not accommodate your design request at this time. ").concat(after.adminNote ? "Note from our team: ".concat(after.adminNote) : '', " Please browse our existing collections or submit a new request. \u2014 Team Nilkanth Fashions</p>\n        "),
                    })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
// ====== TRIGGER: New Order ======
exports.onNewOrder = functions.firestore
    .document('orders/{orderId}')
    .onCreate(function (snap, context) { return __awaiter(void 0, void 0, void 0, function () {
    var data, error_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                data = snap.data();
                if (!data)
                    return [2 /*return*/];
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: ADMIN_EMAIL,
                        subject: "\uD83D\uDCE6 New Order \u2014 ".concat(data.userName, " (#").concat(context.params.orderId.slice(-6).toUpperCase(), ")"),
                        html: "\n          <p>New order received from <strong>".concat(data.userName, "</strong> (").concat(data.userEmail, ").</p>\n          <p>Order ID: <strong>").concat(context.params.orderId.slice(-6).toUpperCase(), "</strong></p>\n          <p>Amount: <strong>CAD $").concat((_a = data.totalAmount) === null || _a === void 0 ? void 0 : _a.toFixed(2), "</strong></p>\n          <p>Items: ").concat((_b = data.items) === null || _b === void 0 ? void 0 : _b.map(function (i) { return i.designName; }).join(', '), "</p>\n          <p>Delivery: ").concat(data.deliveryMethod, "</p>\n          <a href=\"https://nilkanthfashion.ca/admin/orders\">View in Admin Panel</a>\n        "),
                    })];
            case 2:
                _c.sent();
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: data.userEmail,
                        subject: "\uD83C\uDF89 Order Confirmed! #".concat(context.params.orderId.slice(-6).toUpperCase(), " \u2014 Nilkanth Fashions"),
                        html: "\n          <p>Hi ".concat(data.userName, ", your order has been received! We'll review and confirm it within 24 hours. Track it in your dashboard: <a href=\"https://nilkanthfashion.ca/user/orders\">My Orders</a></p>\n        "),
                    })];
            case 3:
                _c.sent();
                return [3 /*break*/, 5];
            case 4:
                error_2 = _c.sent();
                console.error('Order email error:', error_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ====== TRIGGER: Order Status Update ======
exports.onOrderStatusUpdate = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(function (change, context) { return __awaiter(void 0, void 0, void 0, function () {
    var before, after, statusMessages, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                before = change.before.data();
                after = change.after.data();
                if (!after || (before === null || before === void 0 ? void 0 : before.status) === after.status)
                    return [2 /*return*/];
                statusMessages = {
                    'in-production': 'Your order is now in production! Our tailors are crafting your outfit.',
                    'quality-check': 'Your outfit has passed quality check and is being prepared for delivery.',
                    'shipped': "Your order has been shipped! Tracking: ".concat(after.trackingNumber || 'Will be updated shortly'),
                    'delivered': 'Your order has been delivered! We hope you love it. 🎉',
                };
                message = statusMessages[after.status];
                if (!(message && after.userEmail)) return [3 /*break*/, 2];
                return [4 /*yield*/, transporter.sendMail({
                        from: "\"Nilkanth Fashions\" <".concat(ADMIN_EMAIL, ">"),
                        to: after.userEmail,
                        subject: "Order Update: ".concat(after.status.replace(/-/g, ' '), " \u2014 Nilkanth Fashions"),
                        html: "<p>Hi ".concat(after.userName, ", ").concat(message, "</p><p><a href=\"https://nilkanthfashion.ca/user/orders\">Track your order</a></p>"),
                    }).catch(console.error)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
// ====== CALLABLE: Get Analytics Summary ======
exports.getAnalyticsSummary = functions.https.onCall(function (data, context) { return __awaiter(void 0, void 0, void 0, function () {
    var userDoc, _a, ordersSnap, usersSnap, requestsSnap, orders, totalRevenue, popularDesigns;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!context.auth)
                    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
                return [4 /*yield*/, db.collection('users').doc(context.auth.uid).get()];
            case 1:
                userDoc = _c.sent();
                if (((_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== 'admin')
                    throw new functions.https.HttpsError('permission-denied', 'Admin only');
                return [4 /*yield*/, Promise.all([
                        db.collection('orders').get(),
                        db.collection('users').get(),
                        db.collection('customDesignRequests').get(),
                    ])];
            case 2:
                _a = _c.sent(), ordersSnap = _a[0], usersSnap = _a[1], requestsSnap = _a[2];
                orders = ordersSnap.docs.map(function (d) { return d.data(); });
                totalRevenue = orders.reduce(function (sum, o) { return sum + (o.totalAmount || 0); }, 0);
                popularDesigns = {};
                orders.forEach(function (o) {
                    var _a;
                    return (_a = o.items) === null || _a === void 0 ? void 0 : _a.forEach(function (i) {
                        popularDesigns[i.designName] = (popularDesigns[i.designName] || 0) + 1;
                    });
                });
                return [2 /*return*/, {
                        totalOrders: ordersSnap.size,
                        totalUsers: usersSnap.size,
                        totalRequests: requestsSnap.size,
                        totalRevenue: totalRevenue,
                        popularDesigns: Object.entries(popularDesigns).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5),
                    }];
        }
    });
}); });
