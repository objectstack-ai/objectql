# AI-Optimized Metadata Migration Guide

**Version:** 2.0  
**Last Updated:** January 2026

## Purpose

This guide provides step-by-step instructions for migrating existing ObjectQL metadata (v1) to the AI-optimized format (v2), ensuring backward compatibility while gaining AI benefits.

## Migration Strategy

### Philosophy: Incremental, Non-Breaking

The migration follows these principles:

1. **Backward Compatible**: v1 and v2 formats coexist
2. **Incremental**: Migrate one object/feature at a time
3. **Testable**: Validate each migration step
4. **Reversible**: Can roll back if needed

## Migration Phases

```
Phase 1: Foundation (Week 1)
├── Install v2 tools
├── Add metadata version tracking
└── Enable dual-format support

Phase 2: Add AI Context (Week 2-3)
├── Add ai_context blocks to existing objects
├── No structural changes
└── Backward compatible

Phase 3: Enhance Schemas (Week 4-6)
├── Convert lookup → relationship
├── Add intent to validations
├── Enrich workflows with business context
└── Test with AI coding assistants

Phase 4: Full Migration (Week 7-8)
├── Migrate all objects to v2
├── Update documentation
├── Train team on v2 patterns
└── Deprecation plan for v1
```

## Phase 1: Foundation Setup

### Step 1.1: Install Migration Tools

> **Note**: These packages represent the planned v2.0 implementation. For current installations, use existing @objectql packages.

```bash
# Install latest ObjectQL with v2 support (when available)
pnpm add @objectql/core@latest
pnpm add @objectql/cli@latest

# Install migration helper (planned for v2.0 release)
pnpm add -D @objectql/migrate
```

### Step 1.2: Add Version Tracking

Create a metadata version tracker:

```typescript
// scripts/add-version-tracking.ts
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import yaml from 'js-yaml';

async function addVersionTracking() {
  const files = await glob('src/**/*.{object,validation,workflow,form}.yml');
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const data = yaml.load(content);
    
    // Add version if not exists
    if (!data.metadata_version) {
      const enhanced = {
        metadata_version: '1.0',  // Mark as v1
        ...data
      };
      
      await writeFile(file, yaml.dump(enhanced, { indent: 2 }));
      console.log(`✓ Versioned: ${file}`);
    }
  }
}

addVersionTracking();
```

Run it:
```bash
npx tsx scripts/add-version-tracking.ts
```

### Step 1.3: Configure Dual-Format Support

Update your ObjectQL config:

```typescript
// src/app.ts
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({
  metadata: {
    // Enable both v1 and v2 formats
    support_versions: ['1.0', '2.0'],
    
    // Auto-upgrade v1 → v2 at runtime (non-destructive)
    auto_upgrade: true,
    
    // Log when v1 metadata is used (for tracking migration progress)
    warn_on_v1: true,
  },
  
  datasources: {
    default: new KnexDriver({ /* ... */ })
  }
});
```

## Phase 2: Add AI Context (Non-Breaking)

### Step 2.1: Object-Level Context

Start by adding AI context to objects without changing structure:

**Before:**
```yaml
# projects.object.yml
name: project
label: Project
fields:
  name:
    type: text
    required: true
```

**After (v1 + ai_context):**
```yaml
# projects.object.yml
metadata_version: "1.0"  # Still v1, just enhanced
name: project
label: Project

# NEW: Add AI context block
ai_context:
  intent: "Manage projects with timeline, budget, and team tracking"
  domain: project_management
  entity_type: core_business_entity

fields:
  name:
    type: text
    required: true
    
    # NEW: Add field-level AI context
    ai_context:
      intent: "Human-readable project identifier"
      example_values:
        - "Website Redesign 2026"
        - "Q1 Marketing Campaign"
```

This is **backward compatible** - existing code still works, but AI tools get extra context.

### Step 2.2: Migration Script for AI Context

```typescript
// scripts/add-ai-context.ts
import Anthropic from '@anthropic-ai/sdk';
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import yaml from 'js-yaml';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateAIContext(objectDef: any) {
  const prompt = `
Given this ObjectQL object definition:

\`\`\`yaml
${yaml.dump(objectDef)}
\`\`\`

Generate appropriate ai_context blocks that explain:
1. The business intent of this object
2. The business domain it belongs to
3. Example values for each field
4. Common queries users might run

Return only a YAML snippet with the ai_context additions.
`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  // Safely access response content with validation
  if (!message.content || message.content.length === 0) {
    console.error('No content in AI response');
    return null;
  }

  const responseText = message.content[0]?.text;
  if (!responseText) {
    console.error('Invalid response format from AI');
    return null;
  }
  
  // Extract YAML from response
  const yamlMatch = responseText.match(/```yaml\n([\s\S]*?)\n```/);
  if (yamlMatch) {
    return yaml.load(yamlMatch[1]);
  }
  
  return null;
}

async function enrichObjectsWithAI() {
  const files = await glob('src/objects/*.object.yml');
  
  for (const file of files) {
    console.log(`Processing: ${file}`);
    
    const content = await readFile(file, 'utf-8');
    const data = yaml.load(content);
    
    if (!data.ai_context) {
      const aiContext = await generateAIContext(data);
      
      if (aiContext) {
        const enhanced = {
          ...data,
          ai_context: aiContext.ai_context,
          fields: {
            ...data.fields,
            // Merge field-level AI context
            ...Object.keys(data.fields).reduce((acc, fieldName) => {
              acc[fieldName] = {
                ...data.fields[fieldName],
                ai_context: aiContext.fields?.[fieldName]?.ai_context || {}
              };
              return acc;
            }, {})
          }
        };
        
        await writeFile(file, yaml.dump(enhanced, { indent: 2 }));
        console.log(`✓ Enhanced: ${file}`);
      }
    }
  }
}

enrichObjectsWithAI();
```

Run it:
```bash
# ⚠️ SECURITY WARNING: API Key Management
# 
# NEVER commit API keys to version control or expose them in logs
# The examples below show the key in plain text for demonstration only
# 
# Production best practices:
# 1. Use .env file (add to .gitignore)
# 2. Use secret management systems (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
# 3. Rotate keys regularly
# 4. Use environment-specific keys (dev/staging/prod)
# 5. Enable audit logging for key usage
# 6. Never log the key value in CI/CD pipelines

# Option 1: Using .env file (recommended for development)
# Create .env file with: ANTHROPIC_API_KEY=your_key_here
# Then run:
npx tsx scripts/add-ai-context.ts

# Option 2: Direct environment variable (one-time use, secure terminal only)
export ANTHROPIC_API_KEY=your_key  # ⚠️ Will be visible in shell history
npx tsx scripts/add-ai-context.ts
```

## Phase 3: Structural Migration to v2

### Step 3.1: Migrate Object Definitions

Convert v1 objects to v2 format:

**Migration Pattern:**
```yaml
# OLD v1 format
metadata_version: "1.0"
name: project
fields:
  owner:
    type: lookup
    reference_to: users

# NEW v2 format
metadata_version: "2.0"
metadata_type: object

definition:
  name: project
  
  data_model:
    fields:
      owner:
        type: relationship  # Changed from 'lookup'
        
        ai_context:
          intent: "The person responsible for project success"
          semantic_type: ownership
        
        relationship:
          target_object: users
          cardinality: many_to_one
          cascade_delete: prevent
          display_field: full_name
```

**Automated Conversion Script:**

```typescript
// scripts/migrate-to-v2.ts
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import yaml from 'js-yaml';

interface V1Object {
  metadata_version?: string;
  name: string;
  fields: Record<string, any>;
  [key: string]: any;
}

interface V2Object {
  $schema: string;
  metadata_version: string;
  metadata_type: string;
  definition: {
    name: string;
    data_model: {
      fields: Record<string, any>;
    };
    [key: string]: any;
  };
}

function convertFieldType(v1Field: any) {
  const v2Field: any = { ...v1Field };
  
  // Convert 'lookup' to 'relationship'
  if (v1Field.type === 'lookup') {
    v2Field.type = 'relationship';
    
    v2Field.relationship = {
      target_object: v1Field.reference_to,
      cardinality: v1Field.multiple ? 'one_to_many' : 'many_to_one',
      cascade_delete: v1Field.cascade_delete || 'prevent',
    };
    
    delete v2Field.reference_to;
    delete v2Field.multiple;
  }
  
  // Convert 'master_detail' to 'relationship' with ownership
  if (v1Field.type === 'master_detail') {
    v2Field.type = 'relationship';
    
    v2Field.ai_context = {
      ...v2Field.ai_context,
      semantic_type: 'ownership',
    };
    
    v2Field.relationship = {
      target_object: v1Field.reference_to,
      cardinality: 'many_to_one',
      cascade_delete: 'cascade',  // Master-detail always cascades
      is_master_detail: true,
    };
    
    delete v2Field.reference_to;
  }
  
  return v2Field;
}

function migrateObjectToV2(v1Obj: V1Object): V2Object {
  // Convert fields
  const v2Fields: Record<string, any> = {};
  for (const [fieldName, fieldDef] of Object.entries(v1Obj.fields)) {
    v2Fields[fieldName] = convertFieldType(fieldDef);
  }
  
  return {
    $schema: 'https://objectql.org/schema/v2/object.json',
    metadata_version: '2.0',
    metadata_type: 'object',
    
    definition: {
      name: v1Obj.name,
      label: v1Obj.label,
      
      ai_context: v1Obj.ai_context || {},
      
      data_model: {
        fields: v2Fields,
        indexes: v1Obj.indexes || {},
      },
      
      // Preserve other sections
      behavior: v1Obj.behavior || {},
      security: v1Obj.permissions || {},
    },
  };
}

async function migrateAllObjects() {
  const files = await glob('src/objects/*.object.yml');
  
  for (const file of files) {
    console.log(`Migrating: ${file}`);
    
    const content = await readFile(file, 'utf-8');
    const v1Data = yaml.load(content) as V1Object;
    
    if (v1Data.metadata_version === '1.0' || !v1Data.metadata_version) {
      const v2Data = migrateObjectToV2(v1Data);
      
      // Backup original
      await writeFile(`${file}.v1.bak`, content);
      
      // Write v2 version
      await writeFile(file, yaml.dump(v2Data, { indent: 2, lineWidth: -1 }));
      
      console.log(`✓ Migrated: ${file}`);
    } else {
      console.log(`⊘ Skipped: ${file} (already v2)`);
    }
  }
}

migrateAllObjects();
```

### Step 3.2: Migrate Validation Rules

**Before (v1):**
```yaml
# projects.validation.yml
name: project_validation
object: projects

rules:
  - name: valid_dates
    type: custom
    validator: |
      function(record) {
        return record.end_date > record.start_date;
      }
```

**After (v2):**
```yaml
# projects.validation.yml
metadata_version: "2.0"
metadata_type: validation

definition:
  object: projects
  
  validation_rules:
    date_consistency:
      intent: "Ensure timeline makes logical sense"
      type: cross_field
      
      ai_context:
        business_rule: "Projects cannot end before they start"
        error_impact: high
      
      constraints:
        - rule: "end_date >= start_date"
          error_message: "End date must be after start date"
          error_code: "INVALID_DATE_RANGE"
```

### Step 3.3: Migrate Workflows

**Conversion Script:**
```typescript
function migrateWorkflowToV2(v1Workflow: any) {
  return {
    $schema: 'https://objectql.org/schema/v2/workflow.json',
    metadata_version: '2.0',
    metadata_type: 'workflow',
    
    definition: {
      name: v1Workflow.name,
      
      ai_context: {
        intent: `Workflow for ${v1Workflow.name}`,
        // AI can enhance this
        business_process: 'Add business process description',
      },
      
      trigger: v1Workflow.trigger,
      
      steps: v1Workflow.steps.map((step: any) => ({
        ...step,
        ai_context: {
          intent: `Step: ${step.label || step.name}`,
          // Add decision criteria, SLA, etc.
        },
      })),
    },
  };
}
```

## Phase 4: Testing and Validation

### Step 4.1: Validate Migrated Metadata

```typescript
// scripts/validate-v2.ts
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ajv = new Ajv();

// Load JSON schemas with error handling
// Note: Using dynamic imports for better type safety in modern TypeScript
let objectSchema, validationSchema, workflowSchema;

async function loadSchemas() {
  try {
    const schemaPath = resolve(__dirname, '../schemas/v2');
    
    if (!existsSync(schemaPath)) {
      console.warn('⚠️  v2 JSON schemas not found. Skipping schema validation.');
      console.warn('    These will be available in the v2.0 release.');
      return false;
    }
    
    // Modern ES module imports for better type safety
    objectSchema = await import('../schemas/v2/object.json');
    validationSchema = await import('../schemas/v2/validation.json');
    workflowSchema = await import('../schemas/v2/workflow.json');
    
    return true;
  } catch (error) {
    console.warn('⚠️  Could not load v2 schemas:', error.message);
    console.warn('    Schema validation will be skipped.');
    return false;
  }
}

async function validateMetadata() {
  const files = await glob('src/**/*.{object,validation,workflow}.yml');
  
  // Load schemas asynchronously with proper error handling
  const schemasLoaded = await loadSchemas();
  
  if (!schemasLoaded) {
    console.warn('\n⚠️  Skipping validation - schemas not available\n');
    return;
  }
  
  const errors: string[] = [];
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const data = yaml.load(content);
    
    if (data.metadata_version === '2.0') {
      let schema;
      
      switch (data.metadata_type) {
        case 'object':
          schema = objectSchema;
          break;
        case 'validation':
          schema = validationSchema;
          break;
        case 'workflow':
          schema = workflowSchema;
          break;
      }
      
      if (schema) {
        const validate = ajv.compile(schema);
        const valid = validate(data);
        
        if (!valid) {
          errors.push(`${file}: ${JSON.stringify(validate.errors, null, 2)}`);
        } else {
          console.log(`✓ Valid: ${file}`);
        }
      }
    }
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Validation Errors:\n');
    errors.forEach(err => console.error(err));
    process.exit(1);
  } else {
    console.log('\n✅ All metadata valid!');
  }
}

validateMetadata();
```

### Step 4.2: Test with AI Coding Assistants

Create test prompts to verify AI understanding:

```typescript
// tests/ai-understanding.test.ts
import { ObjectQL } from '@objectql/core';
import { test } from '@jest/globals';

test('AI can understand project object intent', async () => {
  const app = new ObjectQL({ /* ... */ });
  
  const projectMeta = await app.getObjectMetadata('project');
  
  // Verify AI context exists
  expect(projectMeta.ai_context).toBeDefined();
  expect(projectMeta.ai_context.intent).toContain('project');
  
  // Verify field contexts
  const ownerField = projectMeta.definition.data_model.fields.owner;
  expect(ownerField.ai_context.semantic_type).toBe('ownership');
});

test('AI can generate correct query from intent', async () => {
  // Test that AI-generated queries work correctly
  const query = {
    intent: "Find my overdue projects",
    object: "projects",
    // ... AI-generated query structure
  };
  
  // Validate query executes correctly
  const results = await app.find(query);
  expect(results).toBeDefined();
});
```

## Phase 5: Update Documentation

### Step 5.1: Auto-Generate from Metadata

```typescript
// scripts/generate-docs.ts
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import yaml from 'js-yaml';

async function generateObjectDocs() {
  const files = await glob('src/objects/*.object.yml');
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const obj = yaml.load(content);
    
    if (obj.metadata_version === '2.0') {
      const md = generateMarkdownDoc(obj);
      const docPath = file.replace('/objects/', '/docs/').replace('.object.yml', '.md');
      
      await writeFile(docPath, md);
      console.log(`✓ Generated docs: ${docPath}`);
    }
  }
}

function generateMarkdownDoc(obj: any): string {
  const def = obj.definition;
  
  return `
# ${def.label || def.name}

## Purpose

${def.ai_context?.intent || 'No description available'}

**Domain:** ${def.ai_context?.domain || 'Unknown'}

## Fields

${Object.entries(def.data_model.fields).map(([name, field]: [string, any]) => `
### ${name}

- **Type:** ${field.type}
- **Required:** ${field.required ? 'Yes' : 'No'}
- **Intent:** ${field.ai_context?.intent || 'N/A'}

${field.ai_context?.example_values ? `
**Example Values:**
${field.ai_context.example_values.map((v: string) => `- ${v}`).join('\n')}
` : ''}
`).join('\n')}

## Common Queries

${def.ai_context?.common_queries?.map((q: string) => `- ${q}`).join('\n') || 'None specified'}
`;
}

generateObjectDocs();
```

## Migration Checklist

Use this checklist to track migration progress:

```markdown
### Phase 1: Foundation
- [ ] Install v2 tools
- [ ] Add version tracking to all files
- [ ] Configure dual-format support
- [ ] Test backward compatibility

### Phase 2: AI Context
- [ ] Add object-level ai_context (10 objects)
- [ ] Add field-level ai_context
- [ ] Add example values
- [ ] Test with AI coding assistant

### Phase 3: Structural Migration
- [ ] Convert lookup → relationship
- [ ] Migrate validation rules
- [ ] Migrate workflows
- [ ] Update forms
- [ ] Run validation tests

### Phase 4: Testing
- [ ] Validate all v2 metadata with JSON Schema
- [ ] Test AI query generation
- [ ] Test AI form generation
- [ ] Test AI documentation generation

### Phase 5: Documentation
- [ ] Auto-generate object docs
- [ ] Update developer guide
- [ ] Create migration announcement
- [ ] Train team on v2 patterns

### Phase 6: Rollout
- [ ] Deploy to staging
- [ ] Monitor AI assistant performance
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Deploy to production
- [ ] Deprecate v1 (6 months notice)
```

## Rollback Plan

If issues arise:

```bash
# Restore v1 backups
find src -name "*.v1.bak" -exec bash -c 'mv "$1" "${1%.v1.bak}"' _ {} \;

# Revert to v1-only support
# In src/app.ts:
metadata: {
  support_versions: ['1.0'],
  auto_upgrade: false,
}
```

## Best Practices

1. **Migrate incrementally**: One object per day, test thoroughly
2. **Use AI to help**: Claude/GPT can generate ai_context blocks
3. **Validate continuously**: Run schema validation after each change
4. **Document decisions**: Keep migration log
5. **Train team**: Ensure everyone understands v2 patterns

## Support

- **Questions:** Open GitHub discussion
- **Issues:** File bug report
- **Consulting:** Email support@objectql.org

---

**Next:** [AI Metadata Comparison Guide](./ai-metadata-comparison.md)
