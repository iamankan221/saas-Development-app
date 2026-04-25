import { billService } from "../services/billService.js";

// ============================================================================
// BILL CONTROLLER
// ============================================================================

export const billController = {
  // Get all bills
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await billService.findAll(page, limit, req.query);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get bill by ID
  async getById(req, res) {
    try {
      const bill = await billService.findById(req.params.id);
      res.json(bill);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // Create bill
  async create(req, res) {
    try {
      const bill = await billService.create(req.body);
      res.status(201).json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update bill
  async update(req, res) {
    try {
      const bill = await billService.update(req.params.id, req.body);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete bill
  async delete(req, res) {
    try {
      await billService.delete(req.params.id);
      res.json({ message: "Bill deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get next bill number
  async getNextNumber(req, res) {
    try {
      const billNumber = await billService.getNextBillNumber();
      res.json({ billNumber });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
