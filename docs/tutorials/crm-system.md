# Building a Micro-CRMSystem

> **Prerequisites**: Completed [Build Your First App](./task-manager.md).

In this tutorial, we will explore **Relationships**, **Validation**, and **Hooks** by building a minimal CRM (Customer Relationship Management) system.

## 1. Define the Objects

We need two objects: `account` (Companies) and `contact` (People).

Create `account.object.yml`:
```yaml
name: account
label: Account
fields:
  name:
    type: text
    required: true
    searchable: true
  industry:
    type: select
    options:
      - technology
      - finance
      - retail
  annual_revenue:
    type: currency
  owner:
    type: lookup
    reference_to: users
```

Create `contact.object.yml`:
```yaml
name: contact
label: Contact
fields:
  first_name:
    type: text
    required: true
  last_name:
    type: text
    required: true
  email:
    type: text
    required: true
  account:
    type: lookup
    reference_to: account # <--- Relationship
    required: true
```

## 2. Add Validation

We want to ensure that `annual_revenue` is never negative.

In `account.object.yml`, add a validation rule:

```yaml
validation_rules:
  positive_revenue:
    expression: "annual_revenue >= 0"
    message: "Annual revenue cannot be negative"
```

> **Note**: ObjectQL supports expression-based validation directly in the metadata.

## 3. Implement Business Logic (Hooks)

We want to automatically set the `full_name` of a contact whenever it is created or updated.

Create or update your server entry point (e.g., `index.ts`):

```typescript
// ... app initialization ...

// Register a trigger
app.on('beforeCreate', 'contact', async ({ data }) => {
    if (data) {
        data.full_name = `${data.first_name} ${data.last_name}`;
    }
});

app.on('beforeUpdate', 'contact', async ({ data }) => {
    if (data && (data.first_name || data.last_name)) {
         // Note: In a real app, you might need to fetch the existing first/last name 
         // if only one is being updated, but for simplicity:
         data.full_name = `${data.first_name} ${data.last_name}`;
    }
});
```

Don't forget to add the `full_name` field to `contact.object.yml`:
```yaml
  full_name:
    type: text
    readonly: true # Prevent manual edits via API
```

## 4. Query with Relationships

Now start your server and try querying contacts with their account details included.

**Request:**
```bash
curl -G http://localhost:3000/api/data/contact \
  --data-urlencode 'filters=[["email", "contains", "@example.com"]]' \
  --data-urlencode 'expand=["account"]'
```

**ObjectQL automatically resolves the lookup:**

```json
{
  "value": [
    {
      "_id": "contact_123",
      "first_name": "Alice",
      "full_name": "Alice Smith",
      "account": {
        "_id": "acc_456",
        "name": "Tech Corp",
        "industry": "technology"
      }
    }
  ]
}
```

## Summary

You have just built a relational data system with business logic in minutes.
- **Relationships**: Defined via `reference_to`.
- **Validation**: Declarative rules in YAML.
- **Logic**: TypeScript hooks for dynamic behavior.
