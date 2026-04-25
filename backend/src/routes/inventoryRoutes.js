import express from "express";
import { inventoryController } from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", inventoryController.getAll);
router.get("/summary", inventoryController.getSummary);
router.get("/low-stock", inventoryController.getLowStock);
router.get("/:id", inventoryController.getById);
router.post("/", inventoryController.create);
router.patch("/:id", inventoryController.update);
router.delete("/:id", inventoryController.delete);

export default router;
