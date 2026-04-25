import express from "express";
import { customerController } from "../controllers/customerController.js";

const router = express.Router();

router.get("/", customerController.getAll);
router.get("/:id", customerController.getById);
router.post("/", customerController.create);
router.patch("/:id", customerController.update);
router.delete("/:id", customerController.delete);
router.get("/:id/balance", customerController.getBalance);

export default router;
