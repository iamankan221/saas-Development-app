import express from "express";
import { billController } from "../controllers/billController.js";

const router = express.Router();

router.get("/", billController.getAll);
router.get("/next-number", billController.getNextNumber);
router.get("/:id", billController.getById);
router.post("/", billController.create);
router.patch("/:id", billController.update);
router.delete("/:id", billController.delete);

export default router;
