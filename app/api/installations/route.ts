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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };
    if (status) {
      where.status = status;
    }

    // Fetch installations with application details
    const installations = await prisma.installation.findMany({
      where,
      include: {
        application: true,
        version: true,
      },
      skip,
      take: limit,
      orderBy: { installedAt: 'desc' },
    });

    const total = await prisma.installation.count({ where });

    return NextResponse.json({
      success: true,
      data: installations.map((inst: any) => ({
        id: inst.id,
        applicationId: inst.applicationId,
        applicationName: inst.application.name,
        version: inst.version.versionNumber,
        status: inst.status,
        installPath: inst.installPath,
        installedAt: inst.installedAt,
        updatedAt: inst.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/installations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch installations' },
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
    const { applicationId, versionId, installPath } = body;

    // Validate input
    if (!applicationId || !versionId) {
      return NextResponse.json(
        { success: false, error: 'Application ID and version ID are required' },
        { status: 400 }
      );
    }

    // Check if application and version exist
    const version = await prisma.version.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Check if already installed
    const existing = await prisma.installation.findUnique({
      where: {
        userId_applicationId: {
          userId: session.user.id,
          applicationId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Application already installed' },
        { status: 409 }
      );
    }

    // Create installation
    const installation = await prisma.installation.create({
      data: {
        userId: session.user.id,
        applicationId,
        versionId,
        installPath,
        status: 'installed',
      },
      include: {
        application: true,
        version: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Installation created successfully',
        data: installation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/installations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create installation' },
      { status: 500 }
    );
  }
}
