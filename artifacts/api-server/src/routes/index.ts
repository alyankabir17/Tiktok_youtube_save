import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadRouter from "./download";
import authRouter from "./auth";
import historyRouter from "./history";
import blogRouter from "./blog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadRouter);
router.use(authRouter);
router.use(historyRouter);
router.use(blogRouter);

export default router;
