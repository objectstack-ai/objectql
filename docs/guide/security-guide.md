# Security Model (Modern RBAC)

* **Philosophy:** Additive Permissions (Union Strategy).
* **Mechanism:** Predicate Pushdown (Injects filters into AST before execution).

## 1. Directory Structure

The security configuration files (`.role.yml` and `.policy.yml`) can be placed **anywhere** in your module's source path. The system scans for them recursively.

**Recommended Structure (Simplified)**:

```text
/project-root
├── /src
│   ├── projects.object.yml
│   ├── tasks.object.yml
│   │
│   └── /security           # Optional grouping
│       ├── sales_rep.role.yml
│       └── contract_manage.policy.yml
```

> **Note:** You can also place them alongside your objects if preferred, or completely flat.

## 2. Policy Definition (`.policy.yml`)

A **Policy** is a reusable collection of permission statements without being tied to a specific user identity. 

To facilitate storage in database JSONB columns and efficient querying, the structure uses a **Map** keyed by object name.

**File:** `/src/security/contract_manage.policy.yml`

```yaml
name: contract_manage
description: Standard contract management rules

# Map structure: Key is the Object Name
permissions:
  contracts:
    actions: [read, create, update] # No delete permission
    
    # Row Level Security (RLS)
    # Automatically injected into the Query AST as an 'AND' condition
    filters: 
      - ['owner', '=', '$user.id']

    # Field Level Security (FLS)
    # Whitelist approach (only these fields are returned)
    fields: ['*'] 
```

## 3. Role Definition (`.role.yml`)

A **Role** defines an identity and assigns permissions. It can compose permissions by referencing **Managed Policies** or defining **Online Permissions**.

**File:** `/src/security/sales_rep.role.yml`

```yaml
name: sales_rep
label: Sales Representative
description: Access to own data and public catalogues

# 1. Managed Policies (References)
# Reuses definitions from /security/policies/*.policy.yml
policies:
  - contract_manage      # References contract_manage.policy.yml
  - base_read_only       # References base_read_only.policy.yml

# 2. Inline Permissions (Specific)
# Valid specifically for this role, not shared
permissions:
  leads:
    actions: [read, create]
    filters:
      - ['status', '=', 'new']
```

## 4. Resolution Logic

When a user with the role `sales_rep` executes a query:
1.  The system loads all referenced **Managed Policies**.
2.  The system loads all **Inline Permissions**.
3.  All permissions are **merged (Union)**.
    *   If *any* policy allows access to an object, access is granted.
    *   If multiple policies define RLS filters for the same object, they are typically combined with `OR`.
