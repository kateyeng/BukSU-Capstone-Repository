import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import SupportTicket from "../models/supportTicket.model.js";

const router = express.Router();

/**
 * All support routes require authentication
 */
router.use(protect);

/**
 * GET /api/support/tickets
 * Get current user's support tickets
 */
router.get("/tickets", async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/support/tickets/:id
 * Get single support ticket details
 */
router.get("/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("submittedBy", "fullName email")
      .populate("respondedBy", "fullName email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Users can only see their own tickets unless admin
    if (
      ticket.submittedBy._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not allowed to view this ticket" });
    }

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/support/tickets
 * Create a new support ticket
 * Body: { category, title, description, page?, browserInfo?, attachments? }
 */
router.post("/tickets", async (req, res, next) => {
  try {
    const { category, title, description, page, browserInfo } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ message: "title and description required" });
    }

    const ticket = await SupportTicket.create({
      submittedBy: req.user._id,
      submittedByEmail: req.user.email,
      submittedByName: req.user.fullName || "",
      category: category || "other",
      title: title.trim(),
      description: description.trim(),
      page: page?.trim() || "",
      browserInfo: browserInfo?.trim() || "",
    });

    res.status(201).json({
      message: "Support ticket created",
      ticket,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/support/tickets/:id
 * Update support ticket status (admin only) or add user follow-up
 * Body: { status?, adminResponse? }
 */
router.patch("/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Only admin can change status or add admin response
    if (req.user.role === "admin") {
      const { status, adminResponse } = req.body;

      if (
        status &&
        ["open", "in_progress", "resolved", "closed"].includes(status)
      ) {
        ticket.status = status;
      }

      if (adminResponse) {
        ticket.adminResponse = adminResponse.trim();
        ticket.respondedBy = req.user._id;
        ticket.respondedAt = new Date();
      }

      await ticket.save();
      await ticket.populate("respondedBy", "fullName email");

      return res.json({
        message: "Ticket updated",
        ticket,
      });
    }

    // Regular users cannot update ticket
    res.status(403).json({ message: "Not allowed to update this ticket" });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/support/admin/tickets
 * (ADMIN ONLY) Get all support tickets
 */
router.get("/admin/tickets", requireRole("admin"), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate("submittedBy", "fullName email")
      .populate("respondedBy", "fullName email")
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

export default router;
