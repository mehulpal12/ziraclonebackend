import { ApiResponse } from "../utils/api-response.js";

const healthCheck = (req, res) => {
  try {
    res
    .status(200)
    .json(
        new ApiResponse(200,{message: "Health check successful"})
    );
  } catch (error) {
    console.error("Health check error:", error);
  }
}
export { healthCheck };