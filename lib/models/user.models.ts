import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  id: { type: String, required: true },
  username: {
    type: String,
    required: [true, "Username is required!"],
    // match: [
    //   /^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/,
    //   "Username invalid, it should contain 8-20 alphanumeric letters and be unique!",
    // ],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Username is required!"],
  },
  bio: {
    type: String,
  },
  image: {
    type: String,
  },
  threads: [
    {
      type: Schema.Types.ObjectId,
      ref: "Thread",
    },
  ],
  onboarded: {
    type: Boolean,
    default: false,
  },
  communities: [
    {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
});

const User = models.User || model("User", UserSchema);

export default User;
