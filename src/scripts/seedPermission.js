import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Permission from "../models/permission.js";

const DEFAULT_PERMISSIONS = [
  { key: "user:create", label: "Create User", module: "user", isSystem: true },
  { key: "user:read", label: "Read User", module: "user", isSystem: true },
  { key: "user:update", label: "Update User", module: "user", isSystem: true },
  { key: "user:delete", label: "Delete User", module: "user", isSystem: true },

  { key: "role:create", label: "Create Role", module: "role", isSystem: true },
  { key: "role:read", label: "Read Role", module: "role", isSystem: true },
  { key: "role:update", label: "Update Role", module: "role", isSystem: true },
  { key: "role:delete", label: "Delete Role", module: "role", isSystem: true },

  {
    key: "permission:create",
    label: "Create Permission",
    module: "permission",
    isSystem: true,
  },
  {
    key: "permission:read",
    label: "Read Permission",
    module: "permission",
    isSystem: true,
  },
  {
    key: "permission:update",
    label: "Update Permission",
    module: "permission",
    isSystem: true,
  },
  {
    key: "permission:delete",
    label: "Delete Permission",
    module: "permission",
    isSystem: true,
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const p of DEFAULT_PERMISSIONS) {
    await Permission.findOneAndUpdate(
      { key: p.key },
      { $set: p },
      { upsert: true, new: true },
    );
  }

  console.log("Permission Seeding Completed");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
