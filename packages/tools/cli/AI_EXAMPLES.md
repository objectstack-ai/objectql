# ObjectQL AI Command - Examples

This document provides comprehensive examples of using ObjectQL's AI-powered features.

## Quick Reference

```bash
# Interactive mode (default, most common)
objectql ai [output-dir]

# One-shot generation
objectql ai generate -d "description" [-o output] [-t type]

# Validation
objectql ai validate <path> [--fix] [-v]

# Chat assistant
objectql ai chat [-p "prompt"]
```

---

## Example 1: Interactive Mode (Recommended)

### Command
```bash
# Simply type this to start!
objectql ai

# Or specify output directory
objectql ai ./my-app
```

### What Happens
1. AI greets you and asks what you want to build
2. You describe your application in natural language
3. AI generates files incrementally based on your conversation
4. You can request changes, additions, or improvements
5. Files are created in real-time
6. Type "done" to finish and save, "exit" to quit

### Example Conversation
```
AI: What would you like to build today?
You: A blog system with posts, comments, and categories

AI: Great! I'll create a blog system. Let me start with the core entities...
[Generates post.object.yml, comment.object.yml, category.object.yml]

AI: I've created the basic objects. Would you like me to add forms and views?
You: Yes, and also add tags for posts

AI: Adding forms, views, and a tag system...
[Generates additional files]
```

---

## Example 2: One-Shot Generation

### Command
```bash
objectql ai generate \
  -d "A blogging platform with posts, comments, categories, and tags. Posts have title, content, author, published status, and publish date. Comments belong to posts. Posts can have multiple categories and tags." \
  -t complete \
  -o ./blog-system
```

### Expected Output
The AI will generate:
- `post.object.yml` - Blog post entity
- `comment.object.yml` - Comment entity  
- `category.object.yml` - Category entity
- `tag.object.yml` - Tag entity
- `post.validation.yml` - Validation rules for posts
- `publish_post.action.ts` - TypeScript action implementation
- `post.hook.ts` - Lifecycle hooks
- `post.test.ts` - Jest tests

### Sample Generated File: post.object.yml
```yaml
label: Post
fields:
  title:
    type: text
    required: true
    validation:
      min_length: 3
      max_length: 200
  content:
    type: textarea
    required: true
  author:
    type: lookup
    reference_to: users
    required: true
  published:
    type: boolean
    default: false
  publish_date:
    type: datetime
  categories:
    type: lookup
    reference_to: category
    multiple: true
  tags:
    type: lookup
    reference_to: tag
    multiple: true
```

---

## Example 3: Validate Existing Metadata

### Command
```bash
objectql ai validate ./my-app -v
```

### Sample Output (without AI - fallback)
```
Found 4 metadata file(s)

📄 customer.object.yml
  ✓ 5 field(s) defined
📄 order.object.yml
  ✓ 8 field(s) defined
📄 order.validation.yml
  ✓ 3 validation rule(s) found
📄 product.object.yml
  ✓ 6 field(s) defined

============================================================
✓ Basic validation passed
```

## Example 3: Generate E-Commerce System

### Command
```bash
objectql ai generate \
  -d "An e-commerce platform with products, categories, shopping cart, orders, and customers. Include inventory tracking, pricing tiers, and order status workflow." \
  -t complete \
  -o ./ecommerce
```

## Example 4: Validate with Verbose Output

```bash
objectql ai validate ./src --verbose
```

This provides detailed information about each validation check performed.
