import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@kliiq.com' },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
      });
    }

    // Create test user
    await prisma.user.create({
      data: {
        email: 'test@kliiq.com',
        password: '$2a$10$qGZTv3YRVPRtQTWlcUGSMedCcapqJvfIFXY4BzYw9xjijP06sUUYi',
        name: 'Test User',
      },
    });

    // Create sample applications
    const apps = [
      {
        name: 'VS Code',
        description: 'Code editor developed by Microsoft',
        category: 'developer',
        developer: 'Microsoft',
        website: 'https://code.visualstudio.com',
        downloadUrl: 'https://code.visualstudio.com/download',
      },
      {
        name: 'Google Chrome',
        description: 'Fast and secure web browser',
        category: 'browser',
        developer: 'Google',
        website: 'https://google.com/chrome',
        downloadUrl: 'https://google.com/chrome/download',
      },
      {
        name: 'Slack',
        description: 'Team collaboration platform',
        category: 'productivity',
        developer: 'Slack Technologies',
        website: 'https://slack.com',
        downloadUrl: 'https://slack.com/download',
      },
      {
        name: 'Docker Desktop',
        description: 'Containerization platform',
        category: 'developer',
        developer: 'Docker',
        website: 'https://docker.com',
        downloadUrl: 'https://docker.com/products/docker-desktop',
      },
    ];

    for (const app of apps) {
      await prisma.application.create({
        data: {
          ...app,
          versions: {
            create: {
              versionNumber: '1.0.0',
              releaseDate: new Date(),
              downloadUrl: app.downloadUrl,
            },
          },
        },
      });
    }

    // Create sample installations
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@kliiq.com' },
    });

    const applications = await prisma.application.findMany();

    for (let i = 0; i < Math.min(2, applications.length); i++) {
      await prisma.installation.create({
        data: {
          userId: testUser!.id,
          applicationId: applications[i].id,
          status: i === 0 ? 'installed' : 'broken',
          installPath: `C:\\Program Files\\${applications[i].name}`,
          versionId: applications[i].versions[0]?.id || '',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
