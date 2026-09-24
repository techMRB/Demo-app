import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Role from "../models/role.js";
import Permission from "../models/permission.js";

const DEFAULT_ROLES = [
  {
    name: "admin",
    description: "Full system access",
    isSystem: true,
    permissionKeys: null,
  },
  {
    name: "user",
    description: "Limited access",
    isSystem: true,
    permissionKeys: ["user:read"],
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const allPermissions = await Permission.find();
  if (allPermissions.length === 0) {
    console.error("No permission found. Run script/seedPermissions.js first.");
    process.exit(1);
  }
  for (const roleData of DEFAULT_ROLES) {
    const permissionIds =
      roleData.permissionKeys === null
        ? allPermissions.map((p) => p._id)
        : allPermissions
            .filter((p) => roleData.permissionKeys.includes(p.key))
            .map((p) => p._id);

    await Role.findOneAndUpdate(
      { name: roleData.name },
      {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: permissionIds,
      },
      { upsert: true, new: true },
    );
  }

  console.log("Roles Seeding Completed");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
