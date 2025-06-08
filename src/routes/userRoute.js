import { Router } from "express";
import { loginUser, logoutUser, RefreshTheAcessToken, registerUseer } from "../controllers/User.Controller.js";
import { upload } from "../middlewares/multer.js";
import { VerifyJwt } from "../middlewares/auth.middleware.js";
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
router.route('/login').post(loginUser)
router.route('/logout').post(VerifyJwt, logoutUser)
router.route('/refresh-token').post(RefreshTheAcessToken)
export default router