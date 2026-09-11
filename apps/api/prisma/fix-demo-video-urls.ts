import { PrismaClient } from '@prisma/client';

/**
 * Script de mantenimiento: actualiza los vídeos de demostración creados con
 * las antiguas URLs de Google (gtv-videos-bucket, hoy 403 Access Denied) para
 * que apunten a una URL de muestra estable. No toca usuarios ni ningún otro dato.
 */
const prisma = new PrismaClient();

const NEW_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

async function main() {
  const result = await prisma.video.updateMany({
    where: { isDemoContent: true },
    data: { videoUrl: NEW_URL },
  });
  console.log(`Actualizados ${result.count} vídeos de demostración a la nueva URL.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
