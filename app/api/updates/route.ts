import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Find all installations for the user and check for updates
    const installations = await prisma.installation.findMany({
      where: { userId: session.user.id },
      include: {
        application: {
          include: {
            versions: {
              orderBy: { releaseDate: 'desc' },
            },
          },
        },
        version: true,
      },
    });

    // Find available updates
    const updates = installations
      .filter((inst: any) => inst.application.versions.length > 1)
      .map((inst: any) => ({
        id: `update_${inst.id}`,
        installationId: inst.id,
        applicationName: inst.application.name,
        currentVersion: inst.version.versionNumber,
        availableVersion: inst.application.versions[0].versionNumber,
        fromVersionId: inst.versionId,
        toVersionId: inst.application.versions[0].id,
      }))
      .slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: updates,
      pagination: {
        page,
        limit,
        total: updates.length,
      },
    });
  } catch (error) {
    console.error('GET /api/updates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromVersionId, toVersionId } = body;

    // Validate input
    if (!fromVersionId || !toVersionId) {
      return NextResponse.json(
        { success: false, error: 'Version IDs are required' },
        { status: 400 }
      );
    }

    // Create update record
    const update = await prisma.update.create({
      data: {
        userId: session.user.id,
        fromVersionId,
        toVersionId,
        status: 'completed',
      },
      include: {
        fromVersion: {
          include: { application: true },
        },
        toVersion: true,
      },
    });

    // Update installation to use new version
    const installation = await prisma.installation.findFirst({
      where: {
        userId: session.user.id,
        versionId: fromVersionId,
      },
    });

    if (installation) {
      await prisma.installation.update({
        where: { id: installation.id },
        data: { versionId: toVersionId },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Update completed successfully',
        data: update,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/updates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create update' },
      { status: 500 }
    );
  }
}
