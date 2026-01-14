import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

interface NewOptions {
    type: string;
    name: string;
    dir?: string;
}

const METADATA_TYPES = [
    'object',
    'view',
    'form',
    'page',
    'action',
    'hook',
    'permission',
    'validation',
    'workflow',
    'report',
    'menu',
    'data'
];

const TEMPLATES: Record<string, any> = {
    object: {
        label: '{{label}}',
        fields: {
            name: {
                type: 'text',
                label: 'Name',
                required: true
            }
        }
    },
    view: {
        label: '{{label}} View',
        object: '{{objectName}}',
        columns: [
            { field: 'name', label: 'Name' }
        ]
    },
    form: {
        label: '{{label}} Form',
        object: '{{objectName}}',
        layout: {
            sections: [
                {
                    label: 'Basic Information',
                    fields: ['name']
                }
            ]
        }
    },
    page: {
        label: '{{label}} Page',
        type: 'standard',
        components: [
            {
                type: 'title',
                text: '{{label}}'
            }
        ]
    },
    action: {
        label: '{{label}} Action',
        object: '{{objectName}}',
        type: 'record',
        handler: 'action_{{name}}'
    },
    hook: {
        label: '{{label}} Hook',
        object: '{{objectName}}',
        triggers: ['before_insert', 'after_insert']
    },
    permission: {
        label: '{{label}} Permissions',
        object: '{{objectName}}',
        profiles: {
            admin: {
                allow_read: true,
                allow_create: true,
                allow_edit: true,
                allow_delete: true
            },
            user: {
                allow_read: true,
                allow_create: false,
                allow_edit: false,
                allow_delete: false
            }
        }
    },
    validation: {
        label: '{{label}} Validation',
        object: '{{objectName}}',
        rules: [
            {
                name: 'required_name',
                type: 'field',
                field: 'name',
                rule: 'required',
                message: 'Name is required'
            }
        ]
    },
    workflow: {
        label: '{{label}} Workflow',
        object: '{{objectName}}',
        trigger: 'on_create',
        actions: [
            {
                type: 'field_update',
                field: 'status',
                value: 'draft'
            }
        ]
    },
    report: {
        label: '{{label}} Report',
        type: 'tabular',
        object: '{{objectName}}',
        columns: [
            { field: 'name', label: 'Name' }
        ]
    },
    menu: {
        label: '{{label}} Menu',
        items: [
            {
                label: 'Home',
                page: 'home',
                icon: 'home'
            }
        ]
    },
    data: {
        label: '{{label}} Data',
        object: '{{objectName}}',
        records: []
    }
};

export async function newMetadata(options: NewOptions) {
    const { type, name, dir = '.' } = options;

    // Validate type
    if (!METADATA_TYPES.includes(type)) {
        console.error(chalk.red(`❌ Unknown metadata type: ${type}`));
        console.log(chalk.gray(`Available types: ${METADATA_TYPES.join(', ')}`));
        process.exit(1);
    }

    // Validate name
    if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
        console.error(chalk.red('❌ Invalid name. Must be lowercase with underscores (e.g., my_object)'));
        process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), dir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const filename = `${name}.${type}.yml`;
    const filePath = path.join(targetDir, filename);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        console.error(chalk.red(`❌ File already exists: ${filePath}`));
        process.exit(1);
    }

    // Get template and replace placeholders
    let template = TEMPLATES[type];
    const label = nameToLabel(name);
    const objectName = type === 'object' ? name : extractObjectName(name);

    template = JSON.parse(
        JSON.stringify(template)
            .replace(/\{\{label\}\}/g, label)
            .replace(/\{\{name\}\}/g, name)
            .replace(/\{\{objectName\}\}/g, objectName)
    );

    // Write YAML file
    const yamlContent = yaml.dump(template, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
    });

    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    console.log(chalk.green(`✅ Created ${filename}`));
    console.log(chalk.gray(`   Path: ${filePath}`));

    // If it's an action or hook, also create the TypeScript implementation file
    if (type === 'action' || type === 'hook') {
        await createTsImplementation(type, name, targetDir);
    }
}

async function createTsImplementation(type: 'action' | 'hook', name: string, dir: string) {
    const filename = `${name}.${type}.ts`;
    const filePath = path.join(dir, filename);

    if (fs.existsSync(filePath)) {
        console.log(chalk.yellow(`⚠ TypeScript file already exists: ${filename}`));
        return;
    }

    let template = '';

    if (type === 'action') {
        template = `import { ActionContext } from '@objectql/types';

export async function action_${name}(context: ActionContext) {
    const { record, user } = context;
    
    // TODO: Implement action logic
    console.log('Action ${name} triggered for record:', record._id);
    
    return {
        success: true,
        message: 'Action completed successfully'
    };
}
`;
    } else if (type === 'hook') {
        template = `import { HookContext } from '@objectql/types';

export async function beforeInsert(context: HookContext) {
    const { doc } = context;
    
    // TODO: Implement before insert logic
    console.log('Before insert hook for ${name}');
    
    // Modify doc as needed
    return doc;
}

export async function afterInsert(context: HookContext) {
    const { doc } = context;
    
    // TODO: Implement after insert logic
    console.log('After insert hook for ${name}');
}
`;
    }

    fs.writeFileSync(filePath, template, 'utf-8');
    console.log(chalk.green(`✅ Created ${filename}`));
    console.log(chalk.gray(`   Path: ${filePath}`));
}

function nameToLabel(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function extractObjectName(name: string): string {
    // Try to extract object name from name like "project_status" -> "project"
    // This is a heuristic and might not always be correct
    const parts = name.split('_');
    return parts[0];
}
