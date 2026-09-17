import bcrypt from "bcrypt";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@university.com";
const ADMIN_PASSWORD = "Admin@12345";

const main = async () => {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: ADMIN_EMAIL,
    },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== UserRole.ADMIN) {
      const updatedAdmin = await prisma.user.update({
        where: {
          email: ADMIN_EMAIL,
        },
        data: {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          password: hashedPassword,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });

      console.log("Existing user promoted to ADMIN:");
      console.table(updatedAdmin);
    } else {
      console.log("Admin account already exists:");
      console.log(ADMIN_EMAIL);
    }

    return;
  }

  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("Admin account created successfully:");
  console.table(admin);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });