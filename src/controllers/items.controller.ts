import { Request, Response, NextFunction } from "express";
import { Item } from "../models/Item";
import { CreateItemInput, UpdateItemInput } from "../schemas/items.schema";
import { AppError } from "../utils/AppError";

// ponytail: 404 (not 403) on "exists but not yours" - avoids confirming to a
// probing user that another user's item id exists at all.
async function findOwnedOr404(id: string, ownerId: string) {
  const item = await Item.findOne({ _id: id, owner: ownerId });
  if (!item) {
    throw new AppError(404, "Item not found");
  }
  return item;
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description } = req.body as CreateItemInput;
    const item = await Item.create({ title, description, owner: req.user!._id });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function listItems(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await Item.find({ owner: req.user!._id }).sort({ createdAt: -1 });
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
}

export async function getItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await findOwnedOr404(req.params.id, req.user!._id.toString());
    res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await findOwnedOr404(req.params.id, req.user!._id.toString());
    const updates = req.body as UpdateItemInput;
    Object.assign(item, updates);
    await item.save();
    res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await findOwnedOr404(req.params.id, req.user!._id.toString());
    await item.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
