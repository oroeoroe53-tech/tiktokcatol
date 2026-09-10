import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Vídeos de muestra Creative Commons (Blender Foundation / Google GTV sample bucket) usados
// ÚNICAMENTE como placeholders reproducibles para el feed de demostración — no son contenido
// católico real. Todos los vídeos creados con estas URLs se marcan `isDemoContent: true`.
const SAMPLE_VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

const CATEGORY_LABELS: Record<string, { es: string; en: string; icon: string }> = {
  PRAYER: { es: 'Oración', en: 'Prayer', icon: 'flame' },
  BIBLE: { es: 'Biblia', en: 'Bible', icon: 'book-open' },
  SAINTS: { es: 'Santos', en: 'Saints', icon: 'star' },
  JESUS: { es: 'Jesús', en: 'Jesus', icon: 'sun' },
  FORMATION: { es: 'Formación', en: 'Formation', icon: 'graduation-cap' },
  TESTIMONY: { es: 'Testimonios', en: 'Testimony', icon: 'mic' },
  SACRAMENTS: { es: 'Sacramentos', en: 'Sacraments', icon: 'droplet' },
  YOUTH: { es: 'Jóvenes', en: 'Youth', icon: 'users' },
  FAMILY: { es: 'Familia', en: 'Family', icon: 'home' },
  MUSIC: { es: 'Música', en: 'Music', icon: 'music' },
  CHURCH_HISTORY: { es: 'Historia de la Iglesia', en: 'Church History', icon: 'landmark' },
  OTHER: { es: 'Otros', en: 'Other', icon: 'sparkles' },
};

const DEMO_VIDEO_TITLES: { title: string; description: string; category: string; hashtags: string[] }[] = [
  { title: 'Evangelio de hoy explicado en 60 segundos', description: 'Contenido de demostración — reflexión breve sobre la lectura del día.', category: 'BIBLE', hashtags: ['evangeliodeldia', 'biblia'] },
  { title: '¿Cómo empezar a rezar el Rosario?', description: 'Contenido de demostración — guía rápida para principiantes.', category: 'PRAYER', hashtags: ['rosario', 'oracion'] },
  { title: 'La historia de Santa Teresa de Calcuta', description: 'Contenido de demostración — vida y virtudes de una santa moderna.', category: 'SAINTS', hashtags: ['santos', 'testimonio'] },
  { title: 'Mi testimonio: cómo volví a la fe', description: 'Contenido de demostración — testimonio personal de conversión.', category: 'TESTIMONY', hashtags: ['testimonio', 'conversion'] },
  { title: '¿Qué es la Eucaristía?', description: 'Contenido de demostración — formación básica sobre los sacramentos.', category: 'SACRAMENTS', hashtags: ['eucaristia', 'formacion'] },
  { title: '3 claves para vivir la fe en familia', description: 'Contenido de demostración — consejos prácticos para padres.', category: 'FAMILY', hashtags: ['familia', 'hogar'] },
  { title: 'Alabanza para empezar el día', description: 'Contenido de demostración — música católica contemporánea.', category: 'MUSIC', hashtags: ['musica', 'alabanza'] },
  { title: 'San Juan Pablo II y los jóvenes', description: 'Contenido de demostración — legado de un santo cercano a la juventud.', category: 'YOUTH', hashtags: ['jovenes', 'jpii'] },
  { title: '¿Quién fue realmente Jesús de Nazaret?', description: 'Contenido de demostración — introducción histórica y espiritual.', category: 'JESUS', hashtags: ['jesus', 'formacion'] },
  { title: 'El Concilio de Nicea en 90 segundos', description: 'Contenido de demostración — historia de la Iglesia explicada rápido.', category: 'CHURCH_HISTORY', hashtags: ['historia', 'iglesia'] },
];

const PRAYERS: { title: string; content: string; category: string; durationSeconds: number }[] = [
  { title: 'Padre Nuestro', content: 'Padre nuestro, que estás en el cielo, santificado sea tu nombre...', category: 'MORNING', durationSeconds: 60 },
  { title: 'Ave María', content: 'Dios te salve, María, llena eres de gracia...', category: 'ROSARY', durationSeconds: 45 },
  { title: 'Oración de la mañana', content: 'Señor, te doy gracias por este nuevo día que comienza...', category: 'MORNING', durationSeconds: 90 },
  { title: 'Oración de la noche', content: 'Antes de descansar, Señor, pongo en tus manos este día...', category: 'NIGHT', durationSeconds: 90 },
  { title: 'Oración antes de dormir', content: 'Visita, Señor, esta casa y aleja de ella toda acechanza del enemigo...', category: 'BEFORE_SLEEP', durationSeconds: 60 },
  { title: 'Oración de gratitud', content: 'Gracias, Señor, por los dones recibidos hoy...', category: 'GRATITUDE', durationSeconds: 60 },
  { title: 'Oración de perdón', content: 'Señor, ayúdame a perdonar como tú me perdonas...', category: 'FORGIVENESS', durationSeconds: 60 },
  { title: 'Oración por la familia', content: 'Señor, bendice a mi familia y mantennos unidos en tu amor...', category: 'FAMILY', durationSeconds: 60 },
  { title: 'Oración por los enfermos', content: 'Señor Jesús, que sanaste a los enfermos, extiende tu mano sanadora...', category: 'SICKNESS', durationSeconds: 60 },
  { title: 'Oración en momentos difíciles', content: 'Señor, en medio de la tormenta, recuerdo que tú estás conmigo...', category: 'DIFFICULT_TIMES', durationSeconds: 75 },
  { title: 'Oración de acción de gracias', content: 'Te alabamos, Señor, por tu bondad infinita...', category: 'THANKSGIVING', durationSeconds: 60 },
];

const SAINTS: { name: string; feastMonth: number; feastDay: number; shortBio: string; virtues: string[] }[] = [
  { name: 'San Francisco de Asís', feastMonth: 10, feastDay: 4, shortBio: 'Fundador de los franciscanos, patrono de la ecología.', virtues: ['pobreza', 'humildad', 'amor a la creación'] },
  { name: 'Santa Teresa de Calcuta', feastMonth: 9, feastDay: 5, shortBio: 'Misionera de la caridad entre los más pobres.', virtues: ['caridad', 'servicio', 'humildad'] },
  { name: 'San Juan Pablo II', feastMonth: 10, feastDay: 22, shortBio: 'Papa que acercó la Iglesia a los jóvenes de todo el mundo.', virtues: ['valentía', 'esperanza', 'cercanía'] },
  { name: 'Santa Teresa de Ávila', feastMonth: 10, feastDay: 15, shortBio: 'Doctora de la Iglesia y mística reformadora del Carmelo.', virtues: ['oración', 'perseverancia', 'sabiduría'] },
  { name: 'San Josemaría Escrivá', feastMonth: 6, feastDay: 26, shortBio: 'Predicó la santidad en la vida ordinaria y el trabajo.', virtues: ['laboriosidad', 'alegría', 'fe cotidiana'] },
  { name: 'Santa Faustina Kowalska', feastMonth: 10, feastDay: 5, shortBio: 'Apóstol de la Divina Misericordia.', virtues: ['confianza', 'misericordia', 'sencillez'] },
  { name: 'San Carlo Acutis', feastMonth: 10, feastDay: 12, shortBio: 'Joven beato conocido como "el influencer de Dios".', virtues: ['pureza', 'creatividad', 'devoción eucarística'] },
  { name: 'Santa Mónica', feastMonth: 8, feastDay: 27, shortBio: 'Madre de San Agustín, modelo de oración perseverante.', virtues: ['perseverancia', 'oración', 'esperanza'] },
];

const FAITH_PATH_TEMPLATES: {
  objective: string;
  title: string;
  description: string;
  steps: { title: string; description: string }[];
}[] = [
  {
    objective: 'GET_CLOSER_TO_JESUS',
    title: 'Acercarme a Jesús',
    description: 'Un itinerario de 5 días para descubrir quién es Jesús y qué significa seguirle.',
    steps: [
      { title: 'Día 1: ¿Quién es Jesús?', description: 'Descubre el corazón del mensaje cristiano.' },
      { title: 'Día 2: El amor de Dios', description: 'Reflexiona sobre el amor incondicional de Dios.' },
      { title: 'Día 3: Una oración sencilla', description: 'Aprende a hablar con Jesús con tus propias palabras.' },
      { title: 'Día 4: La Biblia como carta de amor', description: 'Lee un pasaje del Evangelio de Juan.' },
      { title: 'Día 5: Un primer paso', description: 'Elige una pequeña acción concreta esta semana.' },
    ],
  },
  {
    objective: 'START_PRAYING',
    title: 'Empezar a rezar',
    description: 'Aprende a construir un hábito de oración diaria en 5 pasos.',
    steps: [
      { title: 'Día 1: ¿Por qué rezar?', description: 'Entiende el sentido de la oración cristiana.' },
      { title: 'Día 2: El Padre Nuestro', description: 'Reza y medita la oración que enseñó Jesús.' },
      { title: 'Día 3: El silencio', description: 'Aprende a escuchar a Dios en el silencio.' },
      { title: 'Día 4: Oración de gratitud', description: 'Da gracias por tres cosas hoy.' },
      { title: 'Día 5: Tu rincón de oración', description: 'Crea un espacio y horario fijo para rezar.' },
    ],
  },
  {
    objective: 'KNOW_THE_BIBLE',
    title: 'Conocer la Biblia',
    description: 'Introducción práctica a la Sagrada Escritura en 5 pasos.',
    steps: [
      { title: 'Día 1: ¿Qué es la Biblia?', description: 'Antiguo y Nuevo Testamento explicados de forma sencilla.' },
      { title: 'Día 2: El Evangelio de Juan', description: 'Lee el primer capítulo del Evangelio de Juan.' },
      { title: 'Día 3: Los Salmos', description: 'Descubre la oración a través de los Salmos.' },
      { title: 'Día 4: Cómo leer la Biblia', description: 'Consejos prácticos de lectio divina.' },
      { title: 'Día 5: Tu primer plan de lectura', description: 'Elige un libro para leer esta semana.' },
    ],
  },
  {
    objective: 'KNOW_THE_SAINTS',
    title: 'Conocer a los santos',
    description: 'Descubre vidas que inspiran en 5 pasos.',
    steps: [
      { title: 'Día 1: ¿Qué es un santo?', description: 'La santidad como vocación de todos.' },
      { title: 'Día 2: San Francisco de Asís', description: 'Una vida de sencillez y amor a la creación.' },
      { title: 'Día 3: Santa Teresa de Calcuta', description: 'El amor que se hace servicio.' },
      { title: 'Día 4: San Carlo Acutis', description: 'La santidad en la era digital.' },
      { title: 'Día 5: Tu santo patrono', description: 'Descubre un santo con el que te identifiques.' },
    ],
  },
  {
    objective: 'RETURN_TO_CHURCH',
    title: 'Volver a la Iglesia',
    description: 'Un camino sin juicio para reencontrarte con la fe en 5 pasos.',
    steps: [
      { title: 'Día 1: Sin prisa, sin juicio', description: 'Dios te espera tal como estás.' },
      { title: 'Día 2: La misericordia', description: 'Descubre el amor incondicional de Dios.' },
      { title: 'Día 3: Una oración de reencuentro', description: 'Vuelve a hablar con Dios con confianza.' },
      { title: 'Día 4: La comunidad', description: 'Conoce formas sencillas de acercarte a una parroquia.' },
      { title: 'Día 5: Un siguiente paso', description: 'Elige una acción concreta para retomar el camino.' },
    ],
  },
];

const CHALLENGES: { title: string; description: string; category: string; durationDays: number }[] = [
  { title: '7 días de oración', description: 'Una oración corta cada día durante una semana.', category: 'PRAYER', durationDays: 7 },
  { title: '7 días con el Evangelio', description: 'Lee y reflexiona un pasaje del Evangelio cada día.', category: 'BIBLE', durationDays: 7 },
  { title: '7 días de Rosario', description: 'Reza un misterio del Rosario cada día.', category: 'PRAYER', durationDays: 7 },
  { title: '30 días con los santos', description: 'Conoce a un santo diferente cada día durante un mes.', category: 'SAINTS', durationDays: 30 },
];

async function main() {
  console.log('Sembrando datos de demostración de Faro...');

  // ── Categorías ────────────────────────────────────────────────────────
  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    await prisma.category.upsert({
      where: { key: key as any },
      create: { key: key as any, labelEs: label.es, labelEn: label.en, icon: label.icon },
      update: { labelEs: label.es, labelEn: label.en, icon: label.icon },
    });
  }
  console.log(`  ✓ ${Object.keys(CATEGORY_LABELS).length} categorías`);

  // ── Usuarios de demostración ─────────────────────────────────────────
  const demoPasswordHash = await bcrypt.hash('Demo1234', 12);
  const users = [];
  for (let i = 0; i < 20; i += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = `${firstName}.${lastName}.${i}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const user = await prisma.user.upsert({
      where: { email: `demo.user${i}@faro.app` },
      create: {
        email: `demo.user${i}@faro.app`,
        username,
        displayName: `${firstName} ${lastName}`,
        passwordHash: demoPasswordHash,
        dateOfBirth: faker.date.birthdate({ min: 16, max: 65, mode: 'age' }),
        bio: 'Cuenta de demostración de Faro.',
        emailVerifiedAt: new Date(),
        role: i === 0 ? 'SUPER_ADMIN' : i === 1 ? 'MODERATOR' : i < 5 ? 'CREATOR' : 'USER',
        preferences: {
          create: {
            interests: faker.helpers.arrayElements(Object.keys(CATEGORY_LABELS), 3),
            language: 'es',
            onboardingCompleted: true,
          },
        },
      },
      update: {},
    });
    users.push(user);
  }
  console.log(`  ✓ ${users.length} usuarios de demostración (contraseña: Demo1234)`);

  // ── Vídeos de demostración ───────────────────────────────────────────
  let videoCount = 0;
  for (let i = 0; i < 50; i += 1) {
    const template = DEMO_VIDEO_TITLES[i % DEMO_VIDEO_TITLES.length]!;
    const creator = users[i % users.length]!;
    const videoUrl = SAMPLE_VIDEO_URLS[i % SAMPLE_VIDEO_URLS.length]!;
    const publishedAt = faker.date.recent({ days: 20 });

    const video = await prisma.video.create({
      data: {
        creatorId: creator.id,
        title: `${template.title} #${i + 1}`,
        description: template.description,
        storageKey: `seed/demo-${i}.mp4`,
        videoUrl,
        thumbnailUrl: `https://picsum.photos/seed/faro-${i}/480/854`,
        duration: faker.number.int({ min: 15, max: 90 }),
        category: template.category as any,
        language: 'es',
        status: 'READY',
        visibility: 'PUBLIC',
        moderationStatus: 'APPROVED',
        isDemoContent: true,
        publishedAt,
        createdAt: publishedAt,
        likeCount: faker.number.int({ min: 0, max: 400 }),
        commentCount: 0,
        saveCount: faker.number.int({ min: 0, max: 80 }),
        shareCount: faker.number.int({ min: 0, max: 60 }),
        viewCount: faker.number.int({ min: 50, max: 5000 }),
        completedViewCount: faker.number.int({ min: 20, max: 2000 }),
        hashtags: {
          create: await Promise.all(
            template.hashtags.map(async (tag) => {
              const hashtag = await prisma.hashtag.upsert({
                where: { tag },
                create: { tag, useCount: 1 },
                update: { useCount: { increment: 1 } },
              });
              return { hashtagId: hashtag.id };
            }),
          ),
        },
      },
    });
    videoCount += 1;
    void video;
  }
  console.log(`  ✓ ${videoCount} vídeos de demostración`);

  // ── Oraciones ─────────────────────────────────────────────────────────
  const createdPrayers: Record<string, string> = {};
  for (const prayer of PRAYERS) {
    const record = await prisma.prayer.upsert({
      where: { id: `seed-prayer-${prayer.title}` },
      create: {
        id: `seed-prayer-${prayer.title}`,
        title: prayer.title,
        content: prayer.content,
        category: prayer.category as any,
        durationSeconds: prayer.durationSeconds,
        language: 'es',
        isDemoContent: false,
      },
      update: {},
    });
    createdPrayers[prayer.title] = record.id;
  }
  console.log(`  ✓ ${PRAYERS.length} oraciones`);

  // ── Santos ────────────────────────────────────────────────────────────
  for (const saint of SAINTS) {
    await prisma.saint.upsert({
      where: { id: `seed-saint-${saint.name}` },
      create: {
        id: `seed-saint-${saint.name}`,
        name: saint.name,
        feastMonth: saint.feastMonth,
        feastDay: saint.feastDay,
        shortBio: saint.shortBio,
        biography: `${saint.shortBio} (Biografía completa de demostración — contenido pendiente de redacción editorial definitiva.)`,
        virtues: saint.virtues,
        language: 'es',
        imageUrl: `https://picsum.photos/seed/saint-${saint.name.replace(/\s/g, '')}/400/400`,
      },
      update: {},
    });
  }
  console.log(`  ✓ ${SAINTS.length} santos`);

  // ── Biblia (contenido limitado de ejemplo — ver docs/PLANNING.md §8 sobre licencias) ──
  const johnBook = await prisma.bibleBook.upsert({
    where: { language_order: { language: 'es', order: 43 } },
    create: { name: 'Juan', testament: 'NEW', order: 43, language: 'es' },
    update: {},
  });
  const johnChapter1 = await prisma.bibleChapter.upsert({
    where: { bookId_chapterNumber: { bookId: johnBook.id, chapterNumber: 1 } },
    create: { bookId: johnBook.id, chapterNumber: 1 },
    update: {},
  });
  const johnVerses = [
    'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.',
    'Este era en el principio con Dios.',
    'Todas las cosas fueron hechas por él, y sin él nada de lo que ha sido hecho fue hecho.',
    'En él estaba la vida, y la vida era la luz de los hombres.',
    'Y la luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.',
  ];
  for (let i = 0; i < johnVerses.length; i += 1) {
    await prisma.bibleVerse.upsert({
      where: { chapterId_verseNumber: { chapterId: johnChapter1.id, verseNumber: i + 1 } },
      create: {
        chapterId: johnChapter1.id,
        verseNumber: i + 1,
        text: johnVerses[i]!,
        translation: 'Douay-Rheims (adaptada, dominio público — sustituir por traducción licenciada en producción)',
      },
      update: {},
    });
  }
  const psalmsBook = await prisma.bibleBook.upsert({
    where: { language_order: { language: 'es', order: 19 } },
    create: { name: 'Salmos', testament: 'OLD', order: 19, language: 'es' },
    update: {},
  });
  const psalm23 = await prisma.bibleChapter.upsert({
    where: { bookId_chapterNumber: { bookId: psalmsBook.id, chapterNumber: 23 } },
    create: { bookId: psalmsBook.id, chapterNumber: 23 },
    update: {},
  });
  const psalmVerses = [
    'El Señor es mi pastor, nada me falta.',
    'En verdes praderas me hace recostar, me conduce hacia fuentes tranquilas y repara mis fuerzas.',
    'Me guía por el sendero justo, por el honor de su nombre.',
  ];
  for (let i = 0; i < psalmVerses.length; i += 1) {
    await prisma.bibleVerse.upsert({
      where: { chapterId_verseNumber: { chapterId: psalm23.id, verseNumber: i + 1 } },
      create: {
        chapterId: psalm23.id,
        verseNumber: i + 1,
        text: psalmVerses[i]!,
        translation: 'Douay-Rheims (adaptada, dominio público — sustituir por traducción licenciada en producción)',
      },
      update: {},
    });
  }
  console.log('  ✓ Contenido bíblico de ejemplo (Juan 1, Salmo 23)');

  // ── Camino de Fe (plantillas) ─────────────────────────────────────────
  for (const template of FAITH_PATH_TEMPLATES) {
    const record = await prisma.faithPathTemplate.upsert({
      where: { objective: template.objective as any },
      create: { objective: template.objective as any, title: template.title, description: template.description },
      update: { title: template.title, description: template.description },
    });
    for (let i = 0; i < template.steps.length; i += 1) {
      const step = template.steps[i]!;
      await prisma.faithPathStep.upsert({
        where: { templateId_order: { templateId: record.id, order: i + 1 } },
        create: { templateId: record.id, order: i + 1, title: step.title, description: step.description },
        update: { title: step.title, description: step.description },
      });
    }
  }
  console.log(`  ✓ ${FAITH_PATH_TEMPLATES.length} itinerarios de Camino de Fe`);

  // ── Retos ─────────────────────────────────────────────────────────────
  for (const challenge of CHALLENGES) {
    const record = await prisma.challenge.upsert({
      where: { id: `seed-challenge-${challenge.title}` },
      create: {
        id: `seed-challenge-${challenge.title}`,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category as any,
        durationDays: challenge.durationDays,
        imageUrl: `https://picsum.photos/seed/challenge-${challenge.title.replace(/\s/g, '')}/600/400`,
      },
      update: {},
    });
    for (let day = 1; day <= Math.min(challenge.durationDays, 7); day += 1) {
      await prisma.challengeDay.upsert({
        where: { challengeId_dayNumber: { challengeId: record.id, dayNumber: day } },
        create: {
          challengeId: record.id,
          dayNumber: day,
          title: `Día ${day}`,
          description: `Actividad del día ${day} de "${challenge.title}" (contenido de demostración).`,
        },
        update: {},
      });
    }
  }
  console.log(`  ✓ ${CHALLENGES.length} retos`);

  console.log('Seed completado. Usuarios demo: demo.user0@faro.app … demo.user19@faro.app / Demo1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
