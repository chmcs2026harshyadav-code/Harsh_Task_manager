// Creates the first ADMIN account.
//   npm run seed              -> creates admin (skips if email already exists)
//   npm run seed -- --reset   -> also resets that admin's password
//   npm run seed -- --demo    -> also creates a demo employee (employee@example.com / Employee@123)
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/userModel.js";

dotenv.config();

const args = process.argv.slice(2);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@123";

  let admin = await User.findOne({ email });
  if (!admin) {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      title: "Administrator",
      role: "Admin",
      email,
      password,
      isAdmin: true,
    });
    console.log(`Admin created  ->  ${email} / ${password}`);
  } else if (args.includes("--reset")) {
    admin.password = password;
    admin.isAdmin = true;
    admin.isActive = true;
    await admin.save();
    console.log(`Admin password reset  ->  ${email} / ${password}`);
  } else {
    console.log(`Admin ${email} already exists (use --reset to reset password).`);
  }

  if (args.includes("--demo")) {
    const demo = "employee@example.com";
    if (!(await User.findOne({ email: demo }))) {
      await User.create({
        name: "Demo Employee",
        title: "Developer",
        role: "Employee",
        email: demo,
        password: "Employee@123",
      });
      console.log(`Demo employee created  ->  ${demo} / Employee@123`);
    }
  }

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
