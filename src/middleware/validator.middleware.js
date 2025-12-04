import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().forEach((err) =>
        extractedErrors.push({ [err.param ?? err.path]: err.msg })
    );

    // pass error to your centralized error handler instead of throwing
    return next(new ApiError(422, "received data is not valid", extractedErrors));
};