import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export default mongoose.model("Admin", AdminSchema);
