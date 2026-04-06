const Order = require("../models/Order");
const Withdrawal = require("../models/Withdrawal");

const MIN_WITHDRAWAL = 1000;

function monthBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  return { start, end };
}

function sumPaidInRange(orders, start, end) {
  return orders
    .filter((o) => {
      if (o.paymentStatus !== "paid") return false;
      const d = new Date(o.createdAt);
      return d >= start && d < end;
    })
    .reduce((s, o) => s + (o.totalAmount || 0), 0);
}

function countPaidInRange(orders, start, end) {
  return orders.filter((o) => {
    if (o.paymentStatus !== "paid") return false;
    const d = new Date(o.createdAt);
    return d >= start && d < end;
  }).length;
}

const buildWithdrawal = (w) => {
  if (!w) return null;
  const plain = w.toObject ? w.toObject() : w;
  return {
    id: String(plain._id),
    amount: plain.amount,
    bankAccount: {
      accountNumber: plain.accountNumber || "",
      ifscCode: plain.ifscCode || "",
      bankName: plain.bankName || "",
      accountHolderName: plain.accountHolderName || "",
    },
    status: plain.status,
    requestedAt: plain.createdAt
      ? new Date(plain.createdAt).toISOString()
      : new Date().toISOString(),
    processedAt: plain.processedAt
      ? new Date(plain.processedAt).toISOString()
      : undefined,
    rejectionReason: plain.rejectionReason,
  };
};

async function computeBalances(farmerId) {
  const orders = await Order.find({ farmer: farmerId }).lean();
  const withdrawals = await Withdrawal.find({ farmer: farmerId }).lean();

  const isPaid = (o) => o.paymentStatus === "paid";
  const isPendingPayment = (o) =>
    o.paymentStatus === "pending" && o.status !== "cancelled";

  const totalEarnings = orders.filter(isPaid).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingPayments = orders
    .filter(isPendingPayment)
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  const withdrawnCompleted = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + w.amount, 0);
  const reservedWithdrawals = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((s, w) => s + w.amount, 0);

  const availableBalance = Math.max(
    0,
    totalEarnings - withdrawnCompleted - reservedWithdrawals
  );

  const now = new Date();
  const { start: startThisMonth } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: startLastMonth, end: endLastMonth } = monthBounds(
    now.getFullYear(),
    now.getMonth() - 1
  );

  const thisMonth = sumPaidInRange(orders, startThisMonth, new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const lastMonth = sumPaidInRange(orders, startLastMonth, endLastMonth);

  let growth = 0;
  if (lastMonth > 0) {
    growth = ((thisMonth - lastMonth) / lastMonth) * 100;
  } else if (thisMonth > 0) {
    growth = 100;
  }

  return {
    orders,
    withdrawals,
    totalEarnings,
    pendingPayments,
    withdrawnAmount: withdrawnCompleted,
    thisMonth,
    lastMonth,
    growth,
    availableBalance,
  };
}

// GET /api/earnings — farmer only: summary, chart, transactions, withdrawals
exports.getEarnings = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can access earnings" });
    }

    const farmerId = req.user.id;
    const {
      orders,
      withdrawals,
      totalEarnings,
      pendingPayments,
      withdrawnAmount,
      thisMonth,
      lastMonth,
      growth,
      availableBalance,
    } = await computeBalances(farmerId);

    const now = new Date();
    const chartByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const { start, end } = monthBounds(d.getFullYear(), d.getMonth());
      const earnings = sumPaidInRange(orders, start, end);
      chartByMonth.push({ month: label, earnings });
    }

    const monthlyBreakdown = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { start, end } = monthBounds(d.getFullYear(), d.getMonth());
      const amount = sumPaidInRange(orders, start, end);
      const orderCount = countPaidInRange(orders, start, end);
      const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
      monthlyBreakdown.push({ month: label, amount, orders: orderCount });
    }

    const transactions = [];

    for (const o of orders) {
      const oid = String(o._id);
      const shortId = oid.slice(-6);
      if (o.paymentStatus === "paid") {
        transactions.push({
          id: `order-${oid}`,
          orderId: oid,
          type: "order_payment",
          amount: o.totalAmount || 0,
          status: "completed",
          description: `Order payment #${shortId}`,
          createdAt: new Date(o.updatedAt || o.createdAt).toISOString(),
          updatedAt: new Date(o.updatedAt || o.createdAt).toISOString(),
        });
      } else if (o.paymentStatus === "pending" && o.status !== "cancelled") {
        transactions.push({
          id: `order-pending-${oid}`,
          orderId: oid,
          type: "order_payment",
          amount: o.totalAmount || 0,
          status: "pending",
          description: `Pending payment — order #${shortId}`,
          createdAt: new Date(o.createdAt).toISOString(),
          updatedAt: new Date(o.updatedAt || o.createdAt).toISOString(),
        });
      }
    }

    for (const w of withdrawals) {
      const wid = String(w._id);
      let txStatus = "pending";
      if (w.status === "completed") txStatus = "completed";
      else if (w.status === "rejected") txStatus = "failed";

      transactions.push({
        id: `wd-${wid}`,
        type: "withdrawal",
        amount: -w.amount,
        status: txStatus,
        description: `Withdrawal — ${w.bankName || "Bank"}`,
        createdAt: new Date(w.createdAt).toISOString(),
        updatedAt: new Date(w.updatedAt || w.createdAt).toISOString(),
      });
    }

    transactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const withdrawalList = withdrawals
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((w) => buildWithdrawal(w));

    return res.json({
      summary: {
        totalEarnings,
        availableBalance,
        pendingPayments,
        withdrawnAmount,
        thisMonth,
        lastMonth,
        growth: Math.round(growth * 10) / 10,
      },
      chartByMonth,
      monthlyBreakdown,
      transactions,
      withdrawals: withdrawalList,
    });
  } catch (err) {
    console.error("Get earnings error:", err);
    return res.status(500).json({
      message: err.message || "Server error while loading earnings",
    });
  }
};

// GET /api/earnings/withdrawals/export.csv — farmer: own payout requests
exports.exportFarmerWithdrawalsCsv = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can export withdrawals" });
    }

    const farmerId = req.user.id;
    const list = await Withdrawal.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const { rowsToCsv, withUtf8Bom } = require("../utils/csv");
    const header = [
      "id",
      "amount",
      "status",
      "bankName",
      "accountNumber",
      "ifscCode",
      "accountHolderName",
      "requestedAt",
      "processedAt",
      "rejectionReason",
    ];
    const rows = [header];

    for (const w of list) {
      rows.push([
        String(w._id),
        String(w.amount ?? ""),
        w.status || "",
        w.bankName || "",
        w.accountNumber || "",
        w.ifscCode || "",
        w.accountHolderName || "",
        w.createdAt ? new Date(w.createdAt).toISOString() : "",
        w.processedAt ? new Date(w.processedAt).toISOString() : "",
        w.rejectionReason || "",
      ]);
    }

    const body = withUtf8Bom(rowsToCsv(rows));
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="my-payouts-${stamp}.csv"`);
    return res.send(body);
  } catch (err) {
    console.error("Export farmer withdrawals CSV error:", err);
    return res.status(500).json({
      message: err.message || "Server error while exporting withdrawals",
    });
  }
};

// POST /api/earnings/withdrawals
exports.createWithdrawal = async (req, res) => {
  try {
    if (req.user?.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can request withdrawals" });
    }

    const farmerId = req.user.id;
    const amount = Number(req.body.amount);
    const {
      bankName = "",
      accountNumber = "",
      ifscCode = "",
      accountHolderName = "",
    } = req.body;

    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        message: `Minimum withdrawal is ₹${MIN_WITHDRAWAL.toLocaleString("en-IN")}`,
      });
    }

    const { availableBalance } = await computeBalances(farmerId);

    if (amount > availableBalance) {
      return res.status(400).json({ message: "Insufficient available balance" });
    }

    const w = await Withdrawal.create({
      farmer: farmerId,
      amount,
      status: "pending",
      bankName: String(bankName).trim() || "Not specified",
      accountNumber: String(accountNumber).trim() || "—",
      ifscCode: String(ifscCode).trim() || "—",
      accountHolderName: String(accountHolderName).trim() || "—",
    });

    return res.status(201).json({ withdrawal: buildWithdrawal(w) });
  } catch (err) {
    console.error("Create withdrawal error:", err);
    return res.status(500).json({
      message: err.message || "Server error while creating withdrawal",
    });
  }
};
