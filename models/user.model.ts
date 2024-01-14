require ('dotenv').config();
import mongoose,{Document,Model,Schema} from "mongoose";
import bcrypt from "bcryptjs"   //for use hashing password
import { timeStamp } from "console";
import { Mode, promises } from "fs";
import jwt from 'jsonwebtoken';


const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;
    isVerified: boolean; // Tracks email verification status
    isActivated: boolean; // Tracks whether the user's account is activated
    courses: mongoose.Types.ObjectId[]; // Array of ObjectIds
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: {
            validator: function(value: string) {
                return emailRegexPattern.test(value);
            },
            message: 'Please enter a valid email',
        },
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActivated: { // New field added
        type: Boolean,
        default: false,
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre<IUser>('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});



// Compare password
userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel: Model<IUser> = mongoose.model('User', userSchema);
export default UserModel;