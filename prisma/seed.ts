import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD no definidos — seed omitido");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      name: "Administrador",
      role: "SUPERADMIN",
    },
    update: { passwordHash, role: "SUPERADMIN", active: true },
  });

  await prisma.thermometerSetting.upsert({
    where: { id: 1 },
    create: { id: 1, goalCOP: 500_000_000, manualAdjustCOP: 0 },
    update: {},
  });

  await prisma.contentBlock.upsert({
    where: { section: "payment_info" },
    create: {
      section: "payment_info",
      data: {
        bank: "Bancolombia",
        account: "123456789",
        holder: "Misión Manizales",
      },
    },
    update: {},
  });

  console.log("Seed completado:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
