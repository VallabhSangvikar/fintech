import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

// Credit Health Types
interface CreditScore {
  score: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  lastUpdated: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface CreditFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  description: string;
  recommendation?: string;
}

interface CreditAccount {
  id: number;
  type: 'credit_card' | 'auto_loan' | 'personal_loan' | 'mortgage' | 'student_loan' | 'home_equity';
  name: string;
  institutionName?: string;
  balance: number;
  limit?: number;
  utilization?: number;
  status: 'active' | 'closed' | 'delinquent' | 'charged_off';
  paymentHistory: number;
  interestRate?: number;
  minimumPayment?: number;
}

interface CreditRecommendation {
  id: number;
  type: 'pay_down_debt' | 'increase_limit' | 'dispute_error' | 'diversify_credit' | 'payment_reminder';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  potentialImpact: number;
  estimatedTimeline?: string;
  status: 'active' | 'completed' | 'dismissed';
}

interface CreditHealthData {
  creditScore: CreditScore;
  creditFactors: CreditFactor[];
  creditAccounts: CreditAccount[];
  recommendations: CreditRecommendation[];
  scoreHistory: Array<{
    score: number;
    date: string;
  }>;
  alerts: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    isRead: boolean;
    createdAt: string;
  }>;
}

// Helper function to calculate credit score rating
function getScoreRating(score: number): 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent' {
  if (score >= 800) return 'Excellent';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

// Helper function to calculate utilization rate
function calculateUtilization(balance: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((balance / limit) * 100 * 100) / 100; // Round to 2 decimal places
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Initialize credit profile if it doesn't exist
    await initializeCreditProfile(user.userId);

    // Fetch credit profile
    const [creditRows] = await mysqlPool.execute(
      'SELECT * FROM credit_profiles WHERE user_id = ?',
      [user.userId]
    ) as any;

    if (creditRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Credit profile not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const creditProfile = creditRows[0];

    // Fetch credit accounts
    const [accountRows] = await mysqlPool.execute(
      'SELECT * FROM credit_accounts WHERE user_id = ? AND account_status != "closed" ORDER BY current_balance DESC',
      [user.userId]
    ) as any;

    // Fetch credit factors
    const [factorRows] = await mysqlPool.execute(
      'SELECT * FROM credit_factors WHERE user_id = ? AND is_active = TRUE ORDER BY impact_score DESC',
      [user.userId]
    ) as any;

    // Fetch recommendations
    const [recommendationRows] = await mysqlPool.execute(
      'SELECT * FROM credit_recommendations WHERE user_id = ? AND status = "active" ORDER BY priority DESC, potential_impact DESC LIMIT 5',
      [user.userId]
    ) as any;

    // Fetch score history (last 12 months)
    const [historyRows] = await mysqlPool.execute(
      'SELECT score, score_date as date FROM credit_score_history WHERE user_id = ? AND score_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH) ORDER BY score_date ASC',
      [user.userId]
    ) as any;

    // Fetch recent alerts
    const [alertRows] = await mysqlPool.execute(
      'SELECT * FROM credit_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [user.userId]
    ) as any;

    // Process accounts and calculate utilization
    const creditAccounts: CreditAccount[] = accountRows.map((account: any) => ({
      id: account.id,
      type: account.account_type,
      name: account.account_name,
      institutionName: account.institution_name,
      balance: parseFloat(account.current_balance),
      limit: account.credit_limit ? parseFloat(account.credit_limit) : undefined,
      utilization: account.credit_limit ? calculateUtilization(
        parseFloat(account.current_balance), 
        parseFloat(account.credit_limit)
      ) : undefined,
      status: account.account_status,
      paymentHistory: parseFloat(account.payment_history_score),
      interestRate: account.interest_rate ? parseFloat(account.interest_rate) : undefined,
      minimumPayment: account.minimum_payment ? parseFloat(account.minimum_payment) : undefined,
    }));

    // Process credit factors
    const creditFactors: CreditFactor[] = factorRows.map((factor: any) => ({
      name: factor.factor_name,
      impact: factor.impact_type,
      impactScore: factor.impact_score,
      description: factor.description,
      recommendation: factor.recommendation,
    }));

    // Process recommendations
    const recommendations: CreditRecommendation[] = recommendationRows.map((rec: any) => ({
      id: rec.id,
      type: rec.recommendation_type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      potentialImpact: rec.potential_impact,
      estimatedTimeline: rec.estimated_timeline,
      status: rec.status,
    }));

    // Build credit score object
    const creditScore: CreditScore = {
      score: creditProfile.current_score,
      rating: creditProfile.score_rating,
      lastUpdated: creditProfile.last_updated.toISOString().split('T')[0],
      change: creditProfile.score_change_30d,
      trend: creditProfile.score_trend,
    };

    // Process score history
    const scoreHistory = historyRows.map((row: any) => ({
      score: row.score,
      date: row.date.toISOString().split('T')[0],
    }));

    // Process alerts
    const alerts = alertRows.map((alert: any) => ({
      id: alert.id,
      type: alert.alert_type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      isRead: alert.is_read,
      createdAt: alert.created_at.toISOString(),
    }));

    const creditHealthData: CreditHealthData = {
      creditScore,
      creditFactors,
      creditAccounts,
      recommendations,
      scoreHistory,
      alerts,
    };

    return NextResponse.json(
      { 
        success: true, 
        data: creditHealthData,
        meta: {
          totalAccounts: creditAccounts.length,
          totalRecommendations: recommendations.length,
          unreadAlerts: alerts.filter((alert:any) => !alert.isRead).length,
        }
      } as APIResponse<CreditHealthData>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Credit health API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit health data' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// Initialize credit profile with sample data if it doesn't exist
async function initializeCreditProfile(userId: string) {
  try {
    // Check if profile exists
    const [existingRows] = await mysqlPool.execute(
      'SELECT id FROM credit_profiles WHERE user_id = ?',
      [userId]
    ) as any;

    if (existingRows.length > 0) {
      return; // Profile already exists
    }

    // Generate realistic credit data based on user's financial profile
    const [goalRows] = await mysqlPool.execute(
      'SELECT COUNT(*) as goal_count, AVG(target_amount) as avg_goal FROM financial_goals WHERE user_id = ?',
      [userId]
    ) as any;

    const [investmentRows] = await mysqlPool.execute(
      'SELECT COUNT(*) as investment_count FROM investment_products WHERE user_id = ?',
      [userId]
    ) as any;

    const hasFinancialActivity = goalRows[0]?.goal_count > 0 || investmentRows[0]?.investment_count > 0;
    
    // Generate score based on financial activity
    let baseScore = hasFinancialActivity ? 720 : 650;
    baseScore += Math.floor(Math.random() * 80) - 40; // Add some randomness (-40 to +40)
    baseScore = Math.max(300, Math.min(850, baseScore)); // Clamp between 300-850

    const scoreRating = getScoreRating(baseScore);
    const scoreChange = Math.floor(Math.random() * 30) - 15; // -15 to +15
    const trend = scoreChange > 5 ? 'up' : scoreChange < -5 ? 'down' : 'stable';

    // Create credit profile
    await mysqlPool.execute(
      'INSERT INTO credit_profiles (user_id, current_score, score_rating, score_change_30d, score_change_90d, score_trend) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, baseScore, scoreRating, scoreChange, scoreChange * 2, trend]
    );

    // Create sample credit accounts
    const sampleAccounts = [
      {
        type: 'credit_card',
        name: 'Chase Sapphire Reserve',
        institution: 'Chase',
        balance: Math.floor(Math.random() * 3000) + 500,
        limit: 10000,
        rate: 18.99,
        history: 98 + Math.random() * 2
      },
      {
        type: 'credit_card', 
        name: 'Bank of America Cash Rewards',
        institution: 'Bank of America',
        balance: Math.floor(Math.random() * 1500) + 200,
        limit: 5000,
        rate: 22.99,
        history: 95 + Math.random() * 5
      }
    ];

    if (hasFinancialActivity) {
      sampleAccounts.push({
        type: 'auto_loan',
        name: 'Auto Loan - Honda Civic',
        institution: 'Honda Financial',
        balance: Math.floor(Math.random() * 20000) + 10000,
        limit: 0,
        rate: 4.5,
        history: 100
      });
    }

    for (const account of sampleAccounts) {
      await mysqlPool.execute(
        'INSERT INTO credit_accounts (user_id, account_type, account_name, institution_name, current_balance, credit_limit, interest_rate, payment_history_score, utilization_rate, opened_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          account.type,
          account.name,
          account.institution,
          account.balance,
          account.limit || null,
          account.rate,
          account.history,
          account.limit ? (account.balance / account.limit * 100) : 0,
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
        ]
      );
    }

    // Create credit factors
    const factors = [
      {
        name: 'Payment History',
        impact: 'positive',
        score: 25,
        description: 'You have made most payments on time',
        recommendation: 'Continue making all payments on time to maintain good credit'
      },
      {
        name: 'Credit Utilization',
        impact: baseScore > 700 ? 'positive' : 'negative',
        score: baseScore > 700 ? 15 : -10,
        description: `Your credit utilization is ${Math.floor(Math.random() * 30 + 10)}%`,
        recommendation: 'Keep credit utilization below 30% for optimal score'
      },
      {
        name: 'Length of Credit History',
        impact: hasFinancialActivity ? 'positive' : 'neutral',
        score: hasFinancialActivity ? 10 : 0,
        description: `Average account age is ${Math.floor(Math.random() * 5 + 2)} years`,
        recommendation: 'Keep older accounts open to maintain credit history length'
      }
    ];

    for (const factor of factors) {
      await mysqlPool.execute(
        'INSERT INTO credit_factors (user_id, factor_name, impact_type, impact_score, description, recommendation) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, factor.name, factor.impact, factor.score, factor.description, factor.recommendation]
      );
    }

    // Create sample recommendations
    const recommendations = [
      {
        type: 'pay_down_debt',
        title: 'Pay Down Credit Card Balances',
        description: 'Reducing your credit card balances can improve your utilization ratio and boost your credit score.',
        priority: 'high',
        impact: 25,
        timeline: '3-6 months'
      }
    ];

    if (baseScore < 700) {
      recommendations.push({
        type: 'payment_reminder',
        title: 'Set Up Payment Reminders',
        description: 'Ensure you never miss a payment by setting up automatic reminders or autopay.',
        priority: 'critical',
        impact: 50,
        timeline: '1-3 months'
      });
    }

    for (const rec of recommendations) {
      await mysqlPool.execute(
        'INSERT INTO credit_recommendations (user_id, recommendation_type, title, description, priority, potential_impact, estimated_timeline) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, rec.type, rec.title, rec.description, rec.priority, rec.impact, rec.timeline]
      );
    }

  } catch (error) {
    console.error('Error initializing credit profile:', error);
  }
}