export interface User {
  user_id: string;
  email: string;
  business_name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  children: Category[];
}

export interface Entry {
  id: string;
  user_id: string;
  category_id: string;
  entry_type: "expense" | "income";
  amount_minor: number;
  currency: string;
  entry_date: string;
  description: string | null;
  source: "manual" | "ai_agent";
  created_at: string;
  updated_at: string;
}

export interface EntryCreate {
  entry_type: "expense" | "income";
  category_id: string;
  amount: number;
  entry_date: string;
  description?: string | null;
  source?: "manual" | "ai_agent";
}

export interface TrialBalanceItem {
  category: string;
  type: string;
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface ProfitLossResponse {
  period: { start_date: string; end_date: string };
  income: CategoryTotal[];
  expenses: CategoryTotal[];
  total_income: number;
  total_expenses: number;
  net_profit: number;
}

export interface BalanceSheetResponse {
  as_of: string;
  assets: CategoryTotal[];
  liabilities: CategoryTotal[];
  equity: CategoryTotal[];
  total_assets: number;
  total_liabilities_and_equity: number;
}

export interface AuditFlag {
  entry_id: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface MonthlyAuditResponse {
  month: string;
  flags: AuditFlag[];
  entries_reviewed: number;
}

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageResponse[];
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  actions_taken: { tool: string; input: Record<string, unknown>; result_summary: string }[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field_errors: Record<string, string> | null;
  };
}
