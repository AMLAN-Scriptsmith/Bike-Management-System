require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../models");

(async () => {
  try {
    await db.sequelize.sync();

    const userCount = await db.User.count();
    if (userCount === 0) {
      const hashed = await bcrypt.hash("1234", 10);

      const users = await db.User.bulkCreate([
        { name: "Super Admin", email: "admin@test.com", password: hashed, role: "Super Admin", phone: "9000000001" },
        { name: "Center Manager", email: "manager@test.com", password: hashed, role: "Manager", phone: "9000000002" },
        { name: "Front Desk", email: "reception@test.com", password: hashed, role: "Receptionist", phone: "9000000003" },
        { name: "Lead Technician", email: "tech@test.com", password: hashed, role: "Technician", phone: "9000000004" },
        { name: "Customer One", email: "customer@test.com", password: hashed, role: "Customer", phone: "9000000005" },
      ]);

      const center = await db.ServiceCenter.create({
        name: "Bike Care Central",
        location: "Downtown",
        admin_id: users[1].id,
      });

      const [bike1] = await db.Bike.bulkCreate([
        { user_id: users[4].id, model: "CB Shine", number_plate: "KA01AB1234", brand: "Honda" },
      ]);

      const services = await db.Service.bulkCreate([
        { name: "General Service", price: 1500, description: "Full periodic maintenance" },
        { name: "Oil Change", price: 500, description: "Engine oil replacement" },
        { name: "Brake Service", price: 800, description: "Front and rear brake tuning" },
      ]);

      await db.SparePart.bulkCreate([
        { name: "Brake Pad Set", stock: 25, price: 450 },
        { name: "Air Filter", stock: 40, price: 220 },
        { name: "Spark Plug", stock: 60, price: 180 },
      ]);

      const job = await db.JobCard.create({
        bike_id: bike1.id,
        service_center_id: center.id,
        status: "Assigned",
        assigned_to: users[3].id,
      });

      await db.JobService.bulkCreate([
        { job_id: job.id, service_id: services[0].id, status: "In Progress" },
        { job_id: job.id, service_id: services[1].id, status: "Pending" },
      ]);

      await db.Invoice.create({
        job_id: job.id,
        total_amount: 2000,
        payment_status: "Pending",
        payment_method: null,
      });

      console.log("Database setup completed with baseline seed data");
    } else {
      console.log("Database schema ready (existing data kept)");
    }

    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
})();
