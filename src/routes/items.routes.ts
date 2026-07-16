import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createItemSchema, updateItemSchema } from "../schemas/items.schema";
import { createItem, listItems, getItem, updateItem, deleteItem } from "../controllers/items.controller";

const router = Router();

router.use(requireAuth);

router.post("/", validateBody(createItemSchema), createItem);
router.get("/", listItems);
router.get("/:id", getItem);
router.patch("/:id", validateBody(updateItemSchema), updateItem);
router.delete("/:id", deleteItem);

export default router;
