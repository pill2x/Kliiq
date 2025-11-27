import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get user's installed applications
    const userInstallations = await prisma.installation.findMany({
      where: { userId: session.user.id },
      include: { application: true },
    });

    const installedAppIds = userInstallations.map((i: any) => i.applicationId);

    // Find complementary applications (simple recommendation algorithm)
    const recommendations = await prisma.recommendation.findMany({
      where: { userId: session.user.id },
      include: { application: true },
      orderBy: { score: 'desc' },
      take: limit,
    });

    // If no stored recommendations, generate suggestions based on categories
    if (recommendations.length === 0) {
      const userCategories = await prisma.application.findMany({
        where: { id: { in: installedAppIds } },
        select: { category: true },
        distinct: ['category'],
      });

      const suggestedApps = await prisma.application.findMany({
        where: {
          category: { in: userCategories.map((c: any) => c.category) },
          id: { notIn: installedAppIds },
        },
        take: limit,
      });

      const recommendedData = suggestedApps.map((app: any, index: number) => ({
        id: app.id,
        applicationName: app.name,
        description: app.description,
        score: 0.8 - index * 0.1,
        reason: `Recommended based on your ${app.category} tools`,
      }));

      return NextResponse.json({
        success: true,
        data: recommendedData,
        isGenerated: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: recommendations.map((rec: any) => ({
        id: rec.id,
        applicationName: rec.application.name,
        description: rec.application.description,
        score: rec.score,
        reason: rec.reason,
      })),
      isGenerated: false,
    });
  } catch (error) {
    console.error('GET /api/recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
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
    const { applicationId, score, reason } = body;

    // Validate input
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Check if recommendation already exists
    const existing = await prisma.recommendation.findUnique({
      where: {
        userId_applicationId: {
          userId: session.user.id,
          applicationId,
        },
      },
    });

    if (existing) {
      // Update existing recommendation
      const updated = await prisma.recommendation.update({
        where: { id: existing.id },
        data: {
          score: score || 0.8,
          reason,
        },
        include: { application: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Recommendation updated',
        data: updated,
      });
    }

    // Create new recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        userId: session.user.id,
        applicationId,
        score: score || 0.8,
        reason,
      },
      include: { application: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Recommendation created',
        data: recommendation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}
