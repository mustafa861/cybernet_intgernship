const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        error: { code: "UNKNOWN", message: res.statusText, field_errors: null },
      }));
      throw err;
    }
    return res.json();
  }

  // Auth
  register(email: string, password: string, business_name: string) {
    return this.request<{ user_id: string; email: string; business_name: string }>(
      "POST",
      "/auth/register",
      { email, password, business_name }
    );
  }

  login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string; email: string; business_name: string }>(
      "POST",
      "/auth/login",
      { email, password }
    );
  }

  // Categories
  listCategories() {
    return this.request<Category[]>(
      "GET",
      "/categories"
    );
  }

  createCategory(name: string, type: string, parent_id?: string) {
    return this.request<Category>(
      "POST",
      "/categories",
      { name, type, parent_id }
    );
  }

  // Entries
  createEntry(data: {
    entry_type: string;
    category_id: string;
    amount: number;
    entry_date: string;
    description?: string | null;
    source?: string;
  }) {
    return this.request<EntryResponse>("POST", "/entries", data);
  }

  listEntries(params?: {
    start_date?: string;
    end_date?: string;
    category_id?: string;
    entry_type?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    if (params?.category_id) qs.set("category_id", params.category_id);
    if (params?.entry_type) qs.set("entry_type", params.entry_type);
    const q = qs.toString();
    return this.request<EntryResponse[]>("GET", `/entries${q ? `?${q}` : ""}`);
  }

  updateEntry(id: string, data: Partial<EntryCreate>) {
    return this.request<EntryResponse>("PATCH", `/entries/${id}`, data);
  }

  deleteEntry(id: string) {
    return this.request<{ deleted: boolean }>("DELETE", `/entries/${id}`);
  }

  // Reports
  trialBalance(as_of?: string) {
    const qs = as_of ? `?as_of=${as_of}` : "";
    return this.request<{ category: string; type: string; total: number }[]>(
      "GET",
      `/reports/trial-balance${qs}`
    );
  }

  profitLoss(start_date: string, end_date: string) {
    return this.request<ProfitLossResponse>(
      "GET",
      `/reports/profit-and-loss?start_date=${start_date}&end_date=${end_date}`
    );
  }

  balanceSheet(as_of: string) {
    return this.request<BalanceSheetResponse>(
      "GET",
      `/reports/balance-sheet?as_of=${as_of}`
    );
  }

  monthlyAudit(month: string) {
    return this.request<MonthlyAuditResponse>("POST", "/reports/monthly-audit", {
      month,
    });
  }

  // Chat
  chat(message: string, conversation_id?: string | null) {
    return this.request<ChatResponse>("POST", "/chat", {
      message,
      conversation_id,
    });
  }

  chatStream(
    message: string,
    conversation_id: string | null,
    onToken: (token: string) => void,
    onMeta: (convId: string) => void,
    onDone: () => void,
  ): AbortController {
    const ctrl = new AbortController();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    let lastEvent = "";
    fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, conversation_id }),
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.ok) return onDone();
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            lastEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (lastEvent === "meta") {
              onMeta(data.conversation_id);
            } else if (lastEvent === "token") {
              onToken(data);
            } else if (lastEvent === "done") {
              onDone();
            }
          }
        }
      }
    }).catch(() => onDone());
    return ctrl;
  }

  listConversations() {
    return this.request<ConversationSummary[]>("GET", "/conversations");
  }

  getConversation(id: string) {
    return this.request<ConversationDetail>("GET", `/conversations/${id}`);
  }

  deleteConversation(id: string) {
    return this.request<never>("DELETE", `/conversations/${id}`);
  }
}

export const api = new ApiClient();

type EntryResponse = import("../types").Entry;
type Category = import("../types").Category;
type ProfitLossResponse = import("../types").ProfitLossResponse;
type BalanceSheetResponse = import("../types").BalanceSheetResponse;
type MonthlyAuditResponse = import("../types").MonthlyAuditResponse;
type ChatResponse = import("../types").ChatResponse;
type ChatMessageResponse = import("../types").ChatMessageResponse;
type ConversationSummary = import("../types").ConversationSummary;
type ConversationDetail = import("../types").ConversationDetail;
type EntryCreate = import("../types").EntryCreate;
