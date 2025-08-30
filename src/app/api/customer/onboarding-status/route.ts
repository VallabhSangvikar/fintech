import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface OnboardingStatusResponse {
  userId: string;
  hasCompletedOnboarding: boolean;
  profileExists: boolean;
  nextStep?: string;
  profileData?: {
    incomeRange?: string;
    currentCreditScore?: number;
    riskAppetite?: string;
    primaryFinancialGoal?: string;
    profileCreatedAt?: Date;
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const customerProfilesCollection = mongodb.collection('customer_profiles');

    // Check if customer profile exists
    const profile = await customerProfilesCollection.findOne({ userId: user.userId });

    const response: OnboardingStatusResponse = {
      userId: user.userId,
      hasCompletedOnboarding: profile?.onboardingCompleted || false,
      profileExists: !!profile,
    };

    if (profile) {
      response.profileData = {
        incomeRange: profile.incomeRange,
        currentCreditScore: profile.currentCreditScore,
        riskAppetite: profile.riskAppetite,
        primaryFinancialGoal: profile.primaryFinancialGoal,
        profileCreatedAt: profile.profileCreatedAt,
      };
    } else {
      response.nextStep = 'complete_onboarding';
    }

    return NextResponse.json(
      { success: true, data: response } as APIResponse<OnboardingStatusResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get onboarding status' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
