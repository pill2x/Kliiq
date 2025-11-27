import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (category) {
      where.category = category;
    }

    // Fetch applications with their latest version
    const applications = await prisma.application.findMany({
      where,
      include: {
        versions: {
          orderBy: { releaseDate: 'desc' },
          take: 1,
        },
      },
      skip,
      take: limit,
    });

    const total = await prisma.application.count({ where });

    return NextResponse.json({
      success: true,
      data: applications.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        developer: app.developer,
        website: app.website,
        downloadUrl: app.downloadUrl,
        latestVersion: app.versions[0]?.versionNumber || 'N/A',
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, developer, website, downloadUrl } = body;

    // Validate input
    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Check if application already exists
    const existing = await prisma.application.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Application with this name already exists' },
        { status: 409 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        name,
        description,
        category,
        developer,
        website,
        downloadUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application created successfully',
        data: application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
