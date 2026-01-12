# AI-Powered Application Generation - Tutorial

This tutorial will guide you through using ObjectQL's AI-powered features to generate and validate enterprise applications.

## Prerequisites

1. Install ObjectQL CLI globally:
```bash
npm install -g @objectql/cli
```

2. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)

3. Set your API key as an environment variable:
```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

## Tutorial 1: Generate a Simple Task Management System

### Step 1: Generate the Application

Use the AI generator to create a task management system:

```bash
objectql ai generate \
  -d "A task management system with projects and tasks. Projects should have a name, description, status (planning, active, completed), and owner. Tasks belong to projects and have a title, description, priority (low, medium, high), status (todo, in_progress, done), and assignee." \
  -t complete \
  -o ./my-task-app
```

### Step 2: Review Generated Files

The AI will generate several metadata files:

```bash
cd my-task-app
ls -la

# Expected output:
# project.object.yml
# task.object.yml
# project.validation.yml (optional)
# task.validation.yml (optional)
```

### Step 3: Validate the Generated Metadata

Validate the generated files to ensure they follow ObjectQL standards:

```bash
objectql ai validate .
```

The validator will check for:
- YAML syntax errors
- ObjectQL specification compliance
- Business logic consistency
- Data modeling best practices
- Potential security issues

### Step 4: Test the Application

Start a development server to test your application:

```bash
objectql serve --dir .
```

Visit `http://localhost:3000` to interact with your application through the API.

## Tutorial 2: Generate an Enterprise CRM System

### Step 1: Generate with Detailed Requirements

For more complex applications, provide detailed requirements:

```bash
objectql ai generate \
  -d "A comprehensive CRM system with the following modules:

1. Account Management: Companies with name, industry, revenue, employee count, and status
2. Contact Management: People working at accounts with name, email, phone, position, and role
3. Lead Management: Potential customers with source, qualification status, and score
4. Opportunity Management: Sales opportunities with amount, stage, probability, close date
5. Activity Tracking: Meetings, calls, emails associated with accounts/contacts

Include proper relationships:
- Contacts belong to accounts
- Opportunities belong to accounts
- Activities link to accounts, contacts, or opportunities
- Include validation rules for data quality
- Add status transitions for leads and opportunities" \
  -t complete \
  -o ./crm-system
```

### Step 2: Review and Customize

```bash
cd crm-system
ls -la

# Review generated files:
# - account.object.yml
# - contact.object.yml
# - lead.object.yml
# - opportunity.object.yml
# - activity.object.yml
# - Various .validation.yml files
```

Edit any file to customize fields, validation rules, or relationships.

### Step 3: Validate

```bash
objectql ai validate .
```

Address any warnings or errors identified by the AI validator.

### Step 4: Generate TypeScript Types

Generate TypeScript interfaces for type-safe development:

```bash
objectql generate -s . -o ./types
```

## Tutorial 3: Using the AI Chat Assistant

### Interactive Help

Get help with ObjectQL concepts:

```bash
objectql ai chat
```

Example conversation:

```
You: How do I create a many-to-many relationship?