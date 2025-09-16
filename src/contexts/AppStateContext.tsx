'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { User, FinancialGoal, Document, Organization, TeamMembership } from '@/types/database';

// State interface
interface AppState {
  user: User | null;
  organization: Organization | null;
  teamMembership: TeamMembership | null;
  goals: FinancialGoal[];
  documents: Document[];
  teamMembers: any[];
  aiSessions: any[];
  investmentTips: any[];
  isLoading: boolean;
  errors: Record<string, string>;
}

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_TEAM_MEMBERSHIP'; payload: TeamMembership | null }
  | { type: 'SET_GOALS'; payload: FinancialGoal[] }
  | { type: 'ADD_GOAL'; payload: FinancialGoal }
  | { type: 'UPDATE_GOAL'; payload: { id: number; goal: Partial<FinancialGoal> } }
  | { type: 'DELETE_GOAL'; payload: number }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SET_TEAM_MEMBERS'; payload: any[] }
  | { type: 'SET_AI_SESSIONS'; payload: any[] }
  | { type: 'SET_INVESTMENT_TIPS'; payload: any[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { key: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  user: null,
  organization: null,
  teamMembership: null,
  goals: [],
  documents: [],
  teamMembers: [],
  aiSessions: [],
  investmentTips: [],
  isLoading: false,
  errors: {},
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ORGANIZATION':
      return { ...state, organization: action.payload };
    case 'SET_TEAM_MEMBERSHIP':
      return { ...state, teamMembership: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? { ...goal, ...action.payload.goal } : goal
        ),
      };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(goal => goal.id !== action.payload) };
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'DELETE_DOCUMENT':
      return { ...state, documents: state.documents.filter(doc => doc.id !== action.payload) };
    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload };
    case 'SET_AI_SESSIONS':
      return { ...state, aiSessions: action.payload };
    case 'SET_INVESTMENT_TIPS':
      return { ...state, investmentTips: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload.key]: action.payload.message } };
    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return { ...state, errors: newErrors };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to use app state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

// Custom hooks for specific data
export function useGoals() {
  const { state, dispatch } = useAppState();
  
  const setGoals = useCallback((goals: FinancialGoal[]) => {
    dispatch({ type: 'SET_GOALS', payload: goals });
  }, [dispatch]);

  const addGoal = useCallback((goal: FinancialGoal) => {
    dispatch({ type: 'ADD_GOAL', payload: goal });
  }, [dispatch]);

  const updateGoal = useCallback((id: number, updates: Partial<FinancialGoal>) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { id, goal: updates } });
  }, [dispatch]);

  const deleteGoal = useCallback((id: number) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
  }, [dispatch]);

  return {
    goals: state.goals,
    setGoals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}

export function useDocuments() {
  const { state, dispatch } = useAppState();

  const setDocuments = useCallback((documents: Document[]) => {
    dispatch({ type: 'SET_DOCUMENTS', payload: documents });
  }, [dispatch]);

  const addDocument = useCallback((document: Document) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: document });
  }, [dispatch]);

  const deleteDocument = useCallback((id: string) => {
    dispatch({ type: 'DELETE_DOCUMENT', payload: id });
  }, [dispatch]);

  return {
    documents: state.documents,
    setDocuments,
    addDocument,
    deleteDocument,
  };
}

export function useTeam() {
  const { state, dispatch } = useAppState();

  const setTeamMembers = useCallback((members: any[]) => {
    dispatch({ type: 'SET_TEAM_MEMBERS', payload: members });
  }, [dispatch]);

  return {
    teamMembers: state.teamMembers,
    setTeamMembers,
  };
}

export function useAI() {
  const { state, dispatch } = useAppState();

  const setSessions = useCallback((sessions: any[]) => {
    dispatch({ type: 'SET_AI_SESSIONS', payload: sessions });
  }, [dispatch]);

  const setInvestmentTips = useCallback((tips: any[]) => {
    dispatch({ type: 'SET_INVESTMENT_TIPS', payload: tips });
  }, [dispatch]);

  return {
    aiSessions: state.aiSessions,
    investmentTips: state.investmentTips,
    setSessions,
    setInvestmentTips,
  };
}

export function useError() {
  const { state, dispatch } = useAppState();

  const setError = useCallback((key: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { key, message } });
  }, [dispatch]);

  const clearError = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: key });
  }, [dispatch]);

  return {
    errors: state.errors,
    setError,
    clearError,
  };
}
