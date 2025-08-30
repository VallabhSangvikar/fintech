import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface CustomerOnboardingRequest {
  incomeRange: string;
  currentCreditScore: number;
  riskAppetite: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  primaryFinancialGoal: 'HOME_PURCHASE' | 'RETIREMENT' | 'EDUCATION' | 'WEALTH_BUILDING';
}

interface CustomerOnboardingResponse {
  profileId: string;
  onboardingCompleted: boolean;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Ensure this is a customer (no organization)
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const body: CustomerOnboardingRequest = await request.json();
    const { incomeRange, currentCreditScore, riskAppetite, primaryFinancialGoal } = body;

    // Validation
    if (!incomeRange || !currentCreditScore || !riskAppetite || !primaryFinancialGoal) {
      return NextResponse.json(
        { success: false, error: 'All onboarding fields are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate credit score range
    if (currentCreditScore < 300 || currentCreditScore > 850) {
      return NextResponse.json(
        { success: false, error: 'Credit score must be between 300 and 850' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const customerProfilesCollection = mongodb.collection('customer_profiles');

    // Check if profile already exists
    const existingProfile = await customerProfilesCollection.findOne({ userId: user.userId });
    
    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Customer profile already exists. Use PUT to update.' } as APIResponse<null>,
        { status: 409 }
      );
    }

    // Create customer profile
    const customerProfile = {
      userId: user.userId,
      incomeRange,
      currentCreditScore,
      riskAppetite,
      primaryFinancialGoal,
      onboardingCompleted: true,
      profileCreatedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    const result = await customerProfilesCollection.insertOne(customerProfile);

    const response: CustomerOnboardingResponse = {
      profileId: result.insertedId.toString(),
      onboardingCompleted: true,
      message: 'Customer onboarding completed successfully',
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<CustomerOnboardingResponse>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Customer onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Retrieve customer profile
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

    const profile = await customerProfilesCollection.findOne({ userId: user.userId });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Remove MongoDB-specific fields and format response
    const { _id, ...profileData } = profile;
    const response = {
      profileId: _id.toString(),
      ...profileData,
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get customer profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer profile' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// PUT - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body: Partial<CustomerOnboardingRequest> = await request.json();

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const customerProfilesCollection = mongodb.collection('customer_profiles');

    // Validate credit score if provided
    if (body.currentCreditScore && (body.currentCreditScore < 300 || body.currentCreditScore > 850)) {
      return NextResponse.json(
        { success: false, error: 'Credit score must be between 300 and 850' } as APIResponse<null>,
        { status: 400 }
      );
    }

    const updateData = {
      ...body,
      lastUpdatedAt: new Date(),
    };

    const result = await customerProfilesCollection.updateOne(
      { userId: user.userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer profile not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Customer profile updated successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update customer profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer profile' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
