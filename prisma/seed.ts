import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.subtitle.deleteMany();
  await prisma.streamingServer.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.series.deleteMany();

  // Create series
  const ludwig = await prisma.series.create({
    data: {
      title: 'Ludwig',
      description: 'مسلسل Ludwig - دراما غموض بريطانية مثيرة تتبع عالم ألغاز يتقمص شخصية شقيقه التوأم المختفي الذي يعمل كمفتش شرطة، ليجد نفسه متورطاً في حل جرائم قتل حقيقية.',
      poster: 'https://image.tmdb.org/t/p/w500/xD2SHGbQ1tuMriRlVnshJDkOh0E.jpg',
    },
  });

  const breakingBad = await prisma.series.create({
    data: {
      title: 'Breaking Bad',
      description: 'مسلسل بريكنق باد - معلم كيمياء يُشخَّص بسرطان الرئة فيتحول إلى تصنيع الميثامفيتامين مع طالب سابق لتأمين مستقبل عائلته المادي.',
      poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    },
  });

  const strangerThings = await prisma.series.create({
    data: {
      title: 'Stranger Things',
      description: 'أشياء غريبة - عندما يختفي صبي صغير، تتكشف سلسلة من الأحداث الخارقة في بلدة هوكينز الصغيرة تشمل تجارب حكومية سرية وقوى خارقة للطبيعة.',
      poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    },
  });

  const darkSeries = await prisma.series.create({
    data: {
      title: 'Dark',
      description: 'مسلسل دارك - دراما خيال علمي ألمانية تستكشف تداعيات اختفاء طفل على أربع عائلات مترابطة، كاشفةً عن مؤامرة سفر عبر الزمن تمتد لعدة أجيال.',
      poster: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    },
  });

  const moneyHeist = await prisma.series.create({
    data: {
      title: 'Money Heist',
      description: 'لا كاسا دي بابيل - عقل مدبر يُلقب بالبروفيسور يخطط لأكبر عملية سرقة في تاريخ إسبانيا مستهدفاً دار سك العملة الملكية.',
      poster: 'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg',
    },
  });

  const squidGame = await prisma.series.create({
    data: {
      title: 'Squid Game',
      description: 'لعبة الحبار - مئات اللاعبين المثقلين بالديون يقبلون دعوة غريبة للتنافس في ألعاب أطفال بجائزة مالية ضخمة، لكن الخسارة تعني الموت.',
      poster: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    },
  });

  // Create episodes for Ludwig
  const ludwigEp1 = await prisma.episode.create({
    data: {
      seriesId: ludwig.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'الحلقة 1 - البداية',
      description: 'جون يتقمص شخصية شقيقه التوأم المختفي',
      imdbId: 'tt21817726',
      tmdbId: '253461',
    },
  });

  const ludwigEp2 = await prisma.episode.create({
    data: {
      seriesId: ludwig.id,
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'الحلقة 2 - الأدلة',
      description: 'لودفيج يبدأ بالتحقيق في قضية غامضة',
    },
  });

  // Create episodes for Breaking Bad
  const bbEp1 = await prisma.episode.create({
    data: {
      seriesId: breakingBad.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Pilot - الحلقة التجريبية',
      description: 'والتر وايت يكتشف إصابته بالسرطان ويقرر تغيير حياته',
      imdbId: 'tt0959621',
      tmdbId: '62085',
    },
  });

  const bbEp2 = await prisma.episode.create({
    data: {
      seriesId: breakingBad.id,
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Cat\'s in the Bag... - القطة في الكيس',
      description: 'والتر وجيسي يتعاملان مع تبعات لقائهم الأول مع تاجر المخدرات',
    },
  });

  // Create episodes for Stranger Things
  const stEp1 = await prisma.episode.create({
    data: {
      seriesId: strangerThings.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Chapter One: The Vanishing of Will Byers - اختفاء ويل بايرز',
      description: 'يختفي الطفل ويل بايرز في ظروف غامضة وتبدأ عائلته والشرطة بالبحث عنه',
      imdbId: 'tt4574334',
      tmdbId: '66732',
    },
  });

  // Create episodes for Dark
  const darkEp1 = await prisma.episode.create({
    data: {
      seriesId: darkSeries.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Geheimnisse - الأسرار',
      description: 'اختفاء أطفال في بلدة فيندن يكشف عن أسرار مظلمة',
      imdbId: 'tt5753856',
      tmdbId: '72799',
    },
  });

  // Create episodes for Money Heist  
  const mhEp1 = await prisma.episode.create({
    data: {
      seriesId: moneyHeist.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'الحلقة 1 - خطة البروفيسور',
      description: 'البروفيسور يجمع فريقاً من المجرمين لتنفيذ سرقة دار سك العملة',
      imdbId: 'tt6468322',
      tmdbId: '71446',
    },
  });

  // Create episodes for Squid Game
  const sgEp1 = await prisma.episode.create({
    data: {
      seriesId: squidGame.id,
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Red Light, Green Light - إشارة حمراء، إشارة خضراء',
      description: 'سيونغ جي-هون المثقل بالديون يُدعى للمشاركة في لعبة غامضة',
      imdbId: 'tt10919420',
      tmdbId: '93405',
    },
  });

  // Create streaming servers for Ludwig Ep1
  await prisma.streamingServer.createMany({
    data: [
      {
        episodeId: ludwigEp1.id,
        name: 'VOE',
        embedUrl: 'https://voe.sx/e/example-ludwig-1',
        language: 'مترجم',
        quality: '1080p',
        isTrusted: true,
      },
      {
        episodeId: ludwigEp1.id,
        name: 'LuluVDO',
        embedUrl: 'https://luluvdo.com/e/example-ludwig-1',
        language: 'مترجم',
        quality: '720p',
        isTrusted: true,
      },
      {
        episodeId: ludwigEp1.id,
        name: 'Streamtape',
        embedUrl: 'https://streamtape.com/e/example-ludwig-1',
        language: 'مدبلج',
        quality: '1080p',
        isTrusted: false,
      },
    ],
  });

  // Create servers for Ludwig Ep2
  await prisma.streamingServer.createMany({
    data: [
      {
        episodeId: ludwigEp2.id,
        name: 'VOE',
        embedUrl: 'https://voe.sx/e/example-ludwig-2',
        language: 'مترجم',
        quality: '1080p',
        isTrusted: true,
      },
      {
        episodeId: ludwigEp2.id,
        name: 'DoodStream',
        embedUrl: 'https://doodstream.com/e/example-ludwig-2',
        language: 'مترجم',
        quality: '720p',
        isTrusted: false,
      },
    ],
  });

  // Create servers for Breaking Bad Ep1
  await prisma.streamingServer.createMany({
    data: [
      {
        episodeId: bbEp1.id,
        name: 'VOE',
        embedUrl: 'https://voe.sx/e/example-bb-1',
        language: 'مترجم',
        quality: '1080p',
        isTrusted: true,
      },
      {
        episodeId: bbEp1.id,
        name: 'VixCloud',
        embedUrl: 'https://vixcloud.co/e/example-bb-1',
        language: 'مترجم',
        quality: '1080p',
        isTrusted: true,
      },
      {
        episodeId: bbEp1.id,
        name: 'Streamtape',
        embedUrl: 'https://streamtape.com/e/example-bb-1',
        language: 'مدبلج',
        quality: '720p',
        isTrusted: false,
      },
    ],
  });

  // Create servers for other episodes
  const otherEpisodes = [bbEp2, stEp1, darkEp1, mhEp1, sgEp1];
  for (const ep of otherEpisodes) {
    await prisma.streamingServer.createMany({
      data: [
        {
          episodeId: ep.id,
          name: 'VOE',
          embedUrl: `https://voe.sx/e/example-${ep.id}`,
          language: 'مترجم',
          quality: '1080p',
          isTrusted: true,
        },
        {
          episodeId: ep.id,
          name: 'LuluVDO',
          embedUrl: `https://luluvdo.com/e/example-${ep.id}`,
          language: 'مترجم',
          quality: '720p',
          isTrusted: true,
        },
      ],
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log(`📺 Created ${6} series with episodes and streaming servers`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
