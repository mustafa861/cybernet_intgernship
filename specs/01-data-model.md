# Data Model Spec

Status: Draft

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| email | TEXT, unique | |
| password_hash | TEXT | |
| business_name | TEXT | |
| created_at | TIMESTAMPTZ | default now() |

### `categories`
Chart-of-accounts style classification with hierarchical parent-child relationship, scoped per user/business.

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK -> users.id | |
| parent_id | UUID, FK -> categories.id, nullable | self-referential FK for hierarchy; null = top-level account |
| name | TEXT | e.g. "Cash", "Bank", "Accounts Receivable" |
| type | ENUM('expense','income','asset','liability','equity') | |
| created_at | TIMESTAMPTZ | default now() |

Hierarchy examples by type:
- **Assets**: Cash, Bank, Accounts Receivable, Inventory, Fixed Assets
- **Liabilities**: Accounts Payable, Loans Payable, Credit Cards
- **Equity**: Owner's Equity, Retained Earnings, Drawings
- **Income**: Sales Revenue, Service Revenue, Interest Income
- **Expenses**: Rent Expense, Utilities, Salaries, Office Supplies

### `entries`
The core ledger table. Every expense, income, or manual journal line is a row here.

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK -> users.id | |
| category_id | UUID, FK -> categories.id | |
| entry_type | ENUM('expense','income') | |
| amount_minor | BIGINT | stored in smallest currency unit |
| currency | TEXT | default "PKR" (or project's chosen currency) |
| entry_date | DATE | the date the transaction occurred |
| description | TEXT, nullable | |
| source | ENUM('manual','ai_agent') | how the entry was created |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now(), updated on edit |

### `audit_flags`
Populated by the monthly-audit feature (see `05-feature-monthly-audit.md`).

| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| entry_id | UUID, FK -> entries.id | the flagged entry |
| month | DATE | first day of the audited month |
| reason | TEXT | e.g. "Duplicate amount and date found" |
| severity | ENUM('low','medium','high') | |
| created_at | TIMESTAMPTZ | default now() |

## Relationships

- One `user` has many `categories` and many `entries`.
- One `category` has many `entries`.
- One `category` has an optional `parent` category (self-referential FK).
- One `category` has zero or more `children` categories (self-referential FK).
- One `entry` has zero or more `audit_flags`.

## Indexes

- `entries(user_id, entry_date)` — used heavily by report generation and audit queries.
- `entries(user_id, category_id)` — used by category-breakdown queries.

## Open questions (resolve before implementation)

- Multi-currency support: out of scope for v1; single currency per business.
- Multi-user businesses (more than one login per business): out of scope for v1.
