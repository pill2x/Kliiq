import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user with correct bcrypt hash for password "password123"
  const testUser = await prisma.user.create({
    data: {
      email: 'test@kliiq.com',
      password: '$2a$10$qGZTv3YRVPRtQTWlcUGSMedCcapqJvfIFXY4BzYw9xjijP06sUUYi', // password123
      name: 'Test User',
    },
  });

  // Create applications
  const vscode = await prisma.application.create({
    data: {
      name: 'VS Code',
      description: 'Code editor developed by Microsoft',
      category: 'developer',
      developer: 'Microsoft',
      website: 'https://code.visualstudio.com',
      downloadUrl: 'https://code.visualstudio.com/download',
    },
  });

  const chrome = await prisma.application.create({
    data: {
      name: 'Google Chrome',
      description: 'Fast and secure web browser',
      category: 'browser',
      developer: 'Google',
      website: 'https://www.google.com/chrome/',
      downloadUrl: 'https://dl.google.com/chrome/install/latest/chrome_installer.exe',
    },
  });

  const slack = await prisma.application.create({
    data: {
      name: 'Slack',
      description: 'Team communication platform',
      category: 'communication',
      developer: 'Slack Technologies',
      website: 'https://slack.com',
      downloadUrl: 'https://downloads.slack-edge.com/releases/windows/latest/x64/SlackSetup.exe',
    },
  });

  const docker = await prisma.application.create({
    data: {
      name: 'Docker',
      description: 'Containerization platform',
      category: 'developer',
      developer: 'Docker Inc.',
      website: 'https://www.docker.com',
      downloadUrl: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
    },
  });

  const figma = await prisma.application.create({
    data: {
      name: 'Figma',
      description: 'Collaborative design tool',
      category: 'designer',
      developer: 'Figma',
      website: 'https://www.figma.com',
      downloadUrl: 'https://www.figma.com/download',
    },
  });

  const git = await prisma.application.create({
    data: {
      name: 'Git',
      description: 'Version control system',
      category: 'developer',
      developer: 'The Linux Kernel Organization',
      website: 'https://git-scm.com',
      downloadUrl: 'https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe',
    },
  });

  // Create versions
  const vscodeV1 = await prisma.version.create({
    data: {
      applicationId: vscode.id,
      versionNumber: '1.85.0',
      releaseDate: new Date('2023-11-01'),
      downloadUrl: 'https://code.visualstudio.com/download',
      size: BigInt(120000000),
      changelog: 'Initial release',
    },
  });

  const chromeV1 = await prisma.version.create({
    data: {
      applicationId: chrome.id,
      versionNumber: '120.0',
      releaseDate: new Date('2024-01-01'),
      downloadUrl: 'https://dl.google.com/chrome/install/latest/chrome_installer.exe',
      size: BigInt(200000000),
      changelog: 'Latest Chrome version',
    },
  });

  const slackV1 = await prisma.version.create({
    data: {
      applicationId: slack.id,
      versionNumber: '4.35.126',
      releaseDate: new Date('2024-01-15'),
      downloadUrl: 'https://downloads.slack-edge.com/releases/windows/latest/x64/SlackSetup.exe',
      size: BigInt(150000000),
      changelog: 'Bug fixes and improvements',
    },
  });

  const dockerV1 = await prisma.version.create({
    data: {
      applicationId: docker.id,
      versionNumber: '24.0.7',
      releaseDate: new Date('2023-12-01'),
      downloadUrl: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
      size: BigInt(600000000),
      changelog: 'Performance improvements',
    },
  });

  // Create installations
  await prisma.installation.create({
    data: {
      userId: testUser.id,
      applicationId: vscode.id,
      versionId: vscodeV1.id,
      status: 'installed',
      installPath: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code',
    },
  });

  await prisma.installation.create({
    data: {
      userId: testUser.id,
      applicationId: chrome.id,
      versionId: chromeV1.id,
      status: 'installed',
      installPath: 'C:\\Program Files\\Google\\Chrome\\Application',
    },
  });

  await prisma.installation.create({
    data: {
      userId: testUser.id,
      applicationId: slack.id,
      versionId: slackV1.id,
      status: 'installed',
      installPath: 'C:\\Program Files\\Slack',
    },
  });

  await prisma.installation.create({
    data: {
      userId: testUser.id,
      applicationId: docker.id,
      versionId: dockerV1.id,
      status: 'broken',
      installPath: 'C:\\Program Files\\Docker',
    },
  });

  // Create packs
  const devPack = await prisma.pack.create({
    data: {
      name: 'Developer Pack',
      description: 'Essential tools for developers',
      category: 'developer',
    },
  });

  const designerPack = await prisma.pack.create({
    data: {
      name: 'Designer Pack',
      description: 'Tools for designers',
      category: 'designer',
    },
  });

  // Link applications to packs
  await prisma.packApplication.create({
    data: {
      packId: devPack.id,
      applicationId: vscode.id,
    },
  });

  await prisma.packApplication.create({
    data: {
      packId: devPack.id,
      applicationId: git.id,
    },
  });

  await prisma.packApplication.create({
    data: {
      packId: devPack.id,
      applicationId: docker.id,
    },
  });

  await prisma.packApplication.create({
    data: {
      packId: designerPack.id,
      applicationId: figma.id,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
