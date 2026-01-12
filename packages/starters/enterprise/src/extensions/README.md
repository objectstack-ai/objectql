# Extensions Directory

This directory contains object **extensions** - modifications and additions to objects defined elsewhere (either in the `core/` layer or external plugins).

## How Extensions Work

Extensions use ObjectQL's **Schema Merging** feature. When you define an object with the same `name` as an existing object, ObjectQL merges the definitions together.

## Example: Extending the User Object

The `user.extension.object.yml` file extends the core `user` object with company-specific customizations:

1. **Adding fields** - Links to employee record, office location
2. **Overriding properties** - Making email required and unique
3. **Business logic** - Two-factor authentication flag

## When to Use Extensions

✅ **Good Use Cases:**
- Adding company-specific fields to standard objects
- Customizing field properties (making fields required, adding validation)
- Regional variations (GDPR compliance fields for EU)
- Customer-specific customizations in SaaS products

❌ **Avoid Extensions For:**
- Core business logic (put in the original object definition)
- Frequently changing fields (causes merge complexity)
- Breaking changes (removing required fields)

## File Naming Convention

```
[object_name].extension.object.yml
```

Examples:
- `user.extension.object.yml` - Extends the `user` object
- `organization.extension.object.yml` - Extends the `organization` object

## Loading Order

ObjectQL loads objects in this order:
1. External plugins
2. Core layer (`core/objects/`)
3. Module layers (`modules/*/objects/`)
4. Extensions (`extensions/`)

Later definitions override earlier ones for conflicting properties, and merge for nested structures like fields.

## Testing Extensions

Always test that your extensions:
1. Don't break existing functionality
2. Merge correctly with the base definition
3. Have appropriate indexes for new fields
4. Include i18n translations for new labels
