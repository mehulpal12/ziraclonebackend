import mongoose, {Schema} from "mongoose";
import brcypt from "bcrypt";



const userSchema = new Schema(
    {
    avatar:{
        type: {
            url: String,
            localPath: String,
        },
        default:{
            url:`https://placehold.co/200x200`,
            localPath:``,
        }
    },
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{  
        type: String,
        trim: true,
    },
    password:{
        type: String,
        required: [true, "Password is required"],
    },
    isEmailverified:{
        type: Boolean,
        default: false,
    },
    refershTokens:{
        type: String,
    },
    forgotPasswordToken:{
        type: String,
    },
    forgotPasswordExpiry:{
        type: Date,
    },
    emailVerificationToken:{
        type: String,
    },
    emailVerificationExpiry:{
        type: Date,
    }
}, {timestamps: true});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    const salt = await brcypt.genSalt(10);
    this.password = await brcypt.hash(this.password, salt);
    next();
});

export const User = mongoose.model("User", userSchema);