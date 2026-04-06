const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");
const calendarController = require("../controllers/calendar.controller");

// All admin routes require authentication
router.use(auth);

// Stats and user management
router.get("/stats", adminController.getStats);
router.get("/audit-logs", adminController.listAuditLogs);
router.get("/analytics/overview", adminController.getOverviewAnalytics);
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.patchUser);
router.post("/users/:id/approve-kyc", adminController.approveKYC);
router.post("/users/:id/reject-kyc", adminController.rejectKYC);
router.post(
  "/users/:id/send-password-reset",
  adminController.sendPasswordResetEmail
);

// Listings moderation
router.post("/listings/:id/moderate", adminController.moderateListing);

// Reviews
router.get("/reviews", adminController.listReviews);
router.post("/reviews/:id/moderate", adminController.moderateReview);

// Farmer payouts / withdrawals
router.get("/withdrawals/export.csv", adminController.exportWithdrawalsCsv);
router.get("/withdrawals", adminController.listWithdrawals);
router.patch("/withdrawals/:id", adminController.updateWithdrawal);

// Support tickets
router.get("/support-tickets", adminController.listSupportTickets);
router.get("/support-tickets/:id", adminController.getSupportTicket);
router.patch("/support-tickets/:id", adminController.patchSupportTicket);
router.post("/support-tickets/:id/reply", adminController.replySupportTicket);

// Notifications broadcast / targeted
router.post("/notifications/broadcast", adminController.broadcastNotifications);

// Seasonal crop calendar (admin CRUD; public read at GET /api/calendar)
router.get("/calendar/entries", calendarController.adminListEntries);
router.post("/calendar/entries", calendarController.adminCreateEntry);
router.patch("/calendar/entries/:id", calendarController.adminUpdateEntry);
router.delete("/calendar/entries/:id", calendarController.adminDeleteEntry);

module.exports = router;

