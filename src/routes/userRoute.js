import { Router } from "express";
import { registerUseer } from "../controllers/User.Controller.js";
import { upload } from "../middlewares/multer.js";
const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        }, {
            name: 'CoverImage',
            maxCount: 1
        }
    ]),
    registerUseer
)
export default router