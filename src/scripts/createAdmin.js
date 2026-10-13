import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import readline from "readline";
import Role from "../models/role.js";
import User from "../models/user.js";

const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
};

const promptHidden = (question) => {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    let input = "";
    const onData = (char) => {
      char = char.toString("utf8");
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
      } else if (char === "\u0003") {
        process.exit(1);
      } else if (char === "\u007f") {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };

    stdin.on("data", onData);
  });
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const role = await Role.findOne({ name: "admin" });
    if (!role) {
      console.log("Admin role not found. Please seed roles first.");
      process.exit(1);
    }
    const userName = await prompt("Enter admin name: ");
    const userEmail = (await prompt("Enter admin email: "))
      .trim()
      .toLowerCase();
    const userContact = await prompt("Enter contact: ");
    const userPassword = await promptHidden("Enter admin password: ");
    if (!userName || !userEmail || !userPassword | !userContact) {
      console.error("\nAll fields are requried. Aborting.");
      process.exit(1);
    }

    if (userPassword.length < 6) {
      console.error("\nPassword must be at least 6 characters long. Aborting.");
      process.exit(1);
    }

    const existing = await User.findOne({ userEmail }).populate("userRole");
    if (existing) {
      if (existing.userRole?.name === "admin") {
        console.log(
          `\nUser ${userEmail} already exists and is already an admin.`,
        );
      } else {
        const confirm = await prompt(
          `\nUser exists with role '${existing.userRole?.name}'. Convert to admin? (y/n): `,
        );
        if (confirm.toLowerCase() === "y") {
          existing.userRole = adminRole._id;
          await existing.invalidateSessions();
          console.log(`\n ${userEmail} promoted to admin.`);
        } else {
          console.log("\nAborted.");
        }
      }
      process.exit(0);
    }
    const userData = {
      userName,
      userEmail,
      userPassword,
      userContact,
      userRole: role._id,
      isVerified: true,
    };
    const adminUser = await User.create(userData);
    console.log(`Admin user created successfully: ${adminUser.userEmail}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("\n Error:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
