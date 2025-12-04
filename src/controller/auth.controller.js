import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";
import { jwt } from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

      // push refresh token atomically to avoid casting/race issues
    await User.findByIdAndUpdate(
      userId,
      { $push: { refreshTokens: refreshToken } },
      { new: true }
    );
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "error generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const existingUser = await User.findOne({
    // if find any user with same email or username
    $or: [{ email: email }, { username: username }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  const user = await User.create({
    username,
    email,
    password,
    isEmailVerified: false,
  });

  const { unHashToken, hashToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken = hashToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification",
    text: `Please verify your email using this token: ${unHashToken}`,
    mailgenContent: emailVerificationMailgenContent(
      user?.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
    ),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry ",
  );
  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }
  res
    .status(201)
    .json(new ApiResponse(true, "User registered successfully", createdUser));
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
  
    const loginedUser = await User.findById(user._id).select(
    "-password -refreshTokens -emailVerificationToken -emailVerificationExpiry ",
  );
  const options = {
    httpOnly: true,
    secure : true
  }
  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user:loginedUser,
        refreshToken,
        accessToken
      },
      "user loggin successfully"
    )
  )



});



const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshTokens:"",
      },
    },{
      new : true,
    }
  )
  const options = {
    httpOnly : true,
    secure : true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(200, {}, "user logout")
  )
})

const getCurrentUser = asyncHandler(asyncHandler (async (req,res)=>{
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      req.user,
      "current user is this"
    )
  )
}))
const verifyEmail = asyncHandler(asyncHandler (async (req,res)=>{
  const {verificationToken } = req.params
  if(!verificationToken){
    throw new ApiError(400, "email verifitaion token is missing")
  }
  let hashedToken = crypto
  .createHash("sha256")
  .update(verificationToken)
  .digest("hex")

  const user = await User.findOne({
    emailVerificationToken : hashedToken,
    emailVerificationExpiry: {$gt: Date.now()}
  })
   if(!user){
    throw new ApiError(400, "token is invaild or expire")
  }

  user.emailVerificationToken = undefined
  user.emailVerificationExpiry = undefined

  user.isEmailverified = true
  await user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true
      },
      "email is verify"
    )
  )
}))
const resendEmailVerification = asyncHandler(asyncHandler (async (req,res)=>{
  const user = await User.findById(
    req.user?._id
  )
    if(!user){
    throw new ApiError(404, "user does not exist")
  }
    if(user.isEmailverified){
    throw new ApiError(409, "email is verfied")
  }
    const { unHashToken, hashToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken = hashToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification",
    text: `Please verify your email using this token: ${unHashToken}`,
    mailgenContent: emailVerificationMailgenContent(
      user?.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashToken}`,
    ),
  });

  return res.status(200)
  .json(
    200,{}, "mail has been sent"
  )
}))
const refreshAccessToken = asyncHandler(asyncHandler (async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized access")
  }

  try {
   const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id)
      if(!user){
    throw new ApiError(401, "InvaildrefreshToken")
  }
    if(incomingRefreshToken !== user?.refreshTokens){
    throw new ApiError(409, "refresh token is expiry")
  }



  const options = {
    httpOnly: true,
    secure : true
  }

 const {accessToken, refreshToken : newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 user.refreshToken = newRefreshToken;
 await user.save()

 return res.status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", newRefreshToken, options)
 .json(
  new ApiResponse(
    200,
    {accessToken, refreshToken: newRefreshToken},
    "Access token refreshed"
  )
 )


  } catch (error) {
    throw new ApiError(409, "invaild refresh token")
    
  }






}))
const forgotPasswordRequest = asyncHandler(asyncHandler (async (req,res)=>{
  const {email} = req.body
  const user = await User.findOne({email})
  if(!user){
    throw new ApiError(404, "user does not exist")

  }

  const { unHashToken, hashToken, tokenExpiry  } = user.generateTemporaryToken()

  user.forgotPasswordToken = hashToken
  user.forgotPasswordExpiry = tokenExpiry

  await user.save({validateBeforeSave : false})


    await sendEmail({
    email: user?.email,
    subject: "password reset",
    text: `Please verify your email using this token: ${unHashToken}`,
    mailgenContent: forgotPasswordMailgenContent(
      user?.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashToken}`,
    ),
  });

   return res.status(200)
 .json(
  new ApiResponse(
    200,
    {},
    "password reset mail send on mail"
  )
 )

}))

// const getCurrentUser = asyncHandler(asyncHandler (async (req,res)=>{}))

export { registerUser, loginUser, generateAccessAndRefreshToken , logoutUser , getCurrentUser, verifyEmail, resendEmailVerification , refreshAccessToken, forgotPasswordRequest};
