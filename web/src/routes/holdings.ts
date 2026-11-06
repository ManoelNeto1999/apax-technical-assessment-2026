import { Router, Response } from "express";
import Holding from "../models/holdingsModel";
import { AuthenticatedRequest, isAuthenticatedUser } from "../middlewares/user_actions/auth";
import asyncErrorHandler from "../middlewares/helpers/asyncErrorHandler";
import { serializeHoldings } from "../services/holdings";

const router = Router();
router.get("/", isAuthenticatedUser, asyncErrorHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please Login to Access" });
    }
    // Ownership comes exclusively from the verified JWT's resolved user.
    const rows = await Holding.find({ user: req.user._id })
      .select("asset amount updatedAt -_id").lean().exec();
    res.set("Cache-Control", "no-store");
    return res.json(serializeHoldings(rows));
  }
));
export default router;
