import { Router } from "express";
import { registerUser, loginUser, logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification } from "../controller/auth.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import { userRegistrationValidator, userLoginValidator, } from "../validators/index.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegistrationValidator(), validate, registerUser);
router.route("/login").post( userLoginValidator() , validate ,loginUser );
router.route("/verify-email/:verificationToken").get( verifyEmail );
router.route("/refresh-token").post( refreshAccessToken );
router.route("/forgot-password").post( forgotPasswordRequest );
router.route("/reset-password/:resetToken").post( resetForgotPassword );


// protected route
router.route("/logout").post(  verifyJWT , logoutUser );
router.route("/current-user").post(  verifyJWT , getCurrentUser );
router.route("/change-password").post(  verifyJWT , changeCurrentPassword );
router.route("/resent-email-verification").post(  verifyJWT , resendEmailVerification );
export default router;

