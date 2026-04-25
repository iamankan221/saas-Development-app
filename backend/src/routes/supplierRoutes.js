import express from "express";
import { supplierController } from "../controllers/supplierController.js";

const router = express.Router();

router.get("/", supplierController.getAll);
router.get("/:id", supplierController.getById);
router.post("/", supplierController.create);
router.patch("/:id", supplierController.update);
router.delete("/:id", supplierController.delete);

export default router;
