# ObjectQL Examples

This directory contains example projects and demonstrations for ObjectQL.

## Examples

### 1. Project Management (`project-management/`)

A complete project management application demonstrating:
- Object definitions with fields, relationships, and validations
- Custom actions and lifecycle hooks
- Data modeling best practices

**Run:**
```bash
cd project-management
npm install
npm run build
npm start
```

### 2. Metadata Protection Demo (`metadata-protection-demo.ts`)

A demonstration of ObjectQL's metadata protection feature, similar to Salesforce's approach to protecting system objects and fields.

**Features demonstrated:**
- Protecting system fields from modification
- Validation of metadata changes
- Better-auth integration protection

**Run:**
```bash
npx ts-node metadata-protection-demo.ts
```

**What you'll see:**
- System objects (like `user`) cannot be modified or deleted
- System fields (like `createdAt`, `updatedAt`) are protected
- Custom objects and fields can be freely modified
- Packages containing system objects cannot be unregistered
- Clear error messages when attempting to modify protected metadata

**Use Cases:**
- Protecting authentication system integrity
- Preventing accidental modification of core system objects
- Maintaining audit trail fields
- Enforcing schema stability for critical infrastructure

## Learn More

- [ObjectQL Documentation](../docs/)
- [Metadata Specification](../docs/spec/metadata-format.md)
- [Metadata Protection Guide](../docs/spec/metadata-format.md#9-metadata-protection)
