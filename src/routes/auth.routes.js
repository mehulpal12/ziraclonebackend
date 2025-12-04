import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controller/auth.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import { userRegistrationValidator, userLoginValidator, } from "../validators/index.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post( userLoginValidator() , validate ,loginUser );


// protected route
router.route("/logout").post(  verifyJWT , logoutUser );
export default router;

