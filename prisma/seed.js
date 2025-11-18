const { PrismaClient } = require("@prisma/client");
const cryptojs = require("crypto-js");

const prisma = new PrismaClient();
async function main() {
  const key = process.env.KEY;
  const adminData = {
    email: "harry@gamil.com",
    phone: "47845965",
    password: "1234",
    role: "ADMIN",
  };
  const ciphertext = cryptojs.AES.encrypt(adminData.password, key).toString();
  const adminUser = await prisma.user.upsert({
    where: { email: "jams@gmail.com" },
    update: {},
    create: {
      name: "Admin",
      email: adminData.email,
      phone: adminData.phone,
      password: ciphertext,
      role: adminData.role,
    },
  });
  console.log("admin created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
