import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@misionmanizales.org").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!password) {
    console.error("SEED_ADMIN_PASSWORD no está definido en .env");
    process.exit(1);
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    console.error("No existe admin con email:", email);
    process.exit(1);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  console.log("Admin encontrado:", email);
  console.log("Activo:", user.active);
  console.log("Contraseña coincide:", match);
  console.log("AUTH_SECRET definido:", Boolean(process.env.AUTH_SECRET));

  if (!match) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
