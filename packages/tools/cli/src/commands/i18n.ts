import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as yaml from 'js-yaml';
import glob from 'fast-glob';

interface I18nExtractOptions {
    source?: string;
    output?: string;
    lang?: string;
}

interface I18nInitOptions {
    lang: string;
    baseDir?: string;
}

interface I18nValidateOptions {
    lang: string;
    baseDir?: string;
    baseLang?: string;
}

/**
 * Extract translatable strings from metadata files and create i18n files
 */
export async function i18nExtract(options: I18nExtractOptions) {
    const sourceDir = path.resolve(process.cwd(), options.source || '.');
    const outputDir = path.resolve(process.cwd(), options.output || './src/i18n');
    const lang = options.lang || 'en';

    console.log(chalk.blue('🌐 Extracting translatable strings...'));
    console.log(chalk.gray(`Source: ${sourceDir}`));
    console.log(chalk.gray(`Output: ${outputDir}/${lang}\n`));

    try {
        // Find all metadata files
        const files = await glob('**/*.{object,view,form,page,action,permission,validation,workflow,report,menu}.yml', {
            cwd: sourceDir,
            ignore: ['node_modules/**', 'dist/**', 'i18n/**']
        });

        console.log(chalk.gray(`Found ${files.length} metadata files`));

        const translations: Record<string, any> = {};

        for (const file of files) {
            const filePath = path.join(sourceDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = yaml.load(content) as any;

            if (!data) continue;

            // Extract object name from filename
            const objectName = path.basename(file).split('.')[0];

            // Extract translatable fields
            const objectTranslations: any = {};

            if (data.label) {
                objectTranslations.label = data.label;
            }

            if (data.description) {
                objectTranslations.description = data.description;
            }

            // Extract field labels
            if (data.fields) {
                objectTranslations.fields = {};
                for (const [fieldName, fieldConfig] of Object.entries(data.fields) as any) {
                    const fieldTrans: any = {};
                    
                    if (fieldConfig.label) {
                        fieldTrans.label = fieldConfig.label;
                    }
                    
                    if (fieldConfig.description) {
                        fieldTrans.description = fieldConfig.description;
                    }
                    
                    if (fieldConfig.help_text) {
                        fieldTrans.help_text = fieldConfig.help_text;
                    }

                    // Extract select options
                    if (fieldConfig.options && Array.isArray(fieldConfig.options)) {
                        fieldTrans.options = {};
                        for (const option of fieldConfig.options) {
                            if (option.value && option.label) {
                                fieldTrans.options[option.value] = option.label;
                            }
                        }
                    }

                    if (Object.keys(fieldTrans).length > 0) {
                        objectTranslations.fields[fieldName] = fieldTrans;
                    }
                }
            }

            // Extract action labels
            if (data.actions) {
                objectTranslations.actions = {};
                for (const [actionName, actionConfig] of Object.entries(data.actions) as any) {
                    const actionTrans: any = {};
                    if (actionConfig.label) {
                        actionTrans.label = actionConfig.label;
                    }
                    if (actionConfig.confirm_text) {
                        actionTrans.confirm_text = actionConfig.confirm_text;
                    }
                    if (Object.keys(actionTrans).length > 0) {
                        objectTranslations.actions[actionName] = actionTrans;
                    }
                }
            }

            // Extract validation messages
            if (data.validation?.rules) {
                objectTranslations.validation = {};
                for (const rule of data.validation.rules) {
                    if (rule.name && rule.message) {
                        objectTranslations.validation[rule.name] = rule.message;
                    }
                }
            }

            if (Object.keys(objectTranslations).length > 0) {
                translations[objectName] = objectTranslations;
            }
        }

        // Write translation files
        const langDir = path.join(outputDir, lang);
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }

        // Write one file per object
        for (const [objectName, objectTranslations] of Object.entries(translations)) {
            const outputFile = path.join(langDir, `${objectName}.json`);
            fs.writeFileSync(outputFile, JSON.stringify(objectTranslations, null, 4), 'utf-8');
            console.log(chalk.green(`✓ ${objectName}.json`));
        }

        console.log(chalk.green(`\n✅ Extracted translations to ${langDir}`));
        console.log(chalk.gray(`Total: ${Object.keys(translations).length} files`));

    } catch (error: any) {
        console.error(chalk.red(`❌ Failed to extract translations: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Initialize i18n structure for a new language
 */
export async function i18nInit(options: I18nInitOptions) {
    const baseDir = path.resolve(process.cwd(), options.baseDir || './src/i18n');
    const { lang } = options;

    console.log(chalk.blue(`🌐 Initializing i18n for language: ${lang}`));

    // Validate language code
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        console.error(chalk.red('❌ Invalid language code. Use format: en, zh-CN, etc.'));
        process.exit(1);
    }

    const langDir = path.join(baseDir, lang);

    if (fs.existsSync(langDir)) {
        console.error(chalk.red(`❌ Language directory already exists: ${langDir}`));
        process.exit(1);
    }

    try {
        fs.mkdirSync(langDir, { recursive: true });

        // Create a sample translation file
        const sampleTranslation = {
            _meta: {
                language: lang,
                created: new Date().toISOString()
            }
        };

        const sampleFile = path.join(langDir, 'common.json');
        fs.writeFileSync(sampleFile, JSON.stringify(sampleTranslation, null, 4), 'utf-8');

        console.log(chalk.green(`✅ Initialized i18n for ${lang}`));
        console.log(chalk.gray(`Directory: ${langDir}`));
        console.log(chalk.gray(`\nNext steps:`));
        console.log(chalk.gray(`  1. Run: objectql i18n extract --lang ${lang}`));
        console.log(chalk.gray(`  2. Translate the JSON files in ${langDir}`));

    } catch (error: any) {
        console.error(chalk.red(`❌ Failed to initialize i18n: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Validate translation completeness
 */
export async function i18nValidate(options: I18nValidateOptions) {
    const baseDir = path.resolve(process.cwd(), options.baseDir || './src/i18n');
    const { lang, baseLang = 'en' } = options;

    console.log(chalk.blue(`🌐 Validating translations for ${lang} against ${baseLang}...\n`));

    const baseLangDir = path.join(baseDir, baseLang);
    const targetLangDir = path.join(baseDir, lang);

    if (!fs.existsSync(baseLangDir)) {
        console.error(chalk.red(`❌ Base language directory not found: ${baseLangDir}`));
        process.exit(1);
    }

    if (!fs.existsSync(targetLangDir)) {
        console.error(chalk.red(`❌ Target language directory not found: ${targetLangDir}`));
        process.exit(1);
    }

    try {
        const baseFiles = fs.readdirSync(baseLangDir).filter(f => f.endsWith('.json'));
        const targetFiles = fs.readdirSync(targetLangDir).filter(f => f.endsWith('.json'));

        let totalMissing = 0;
        let totalFiles = 0;

        for (const file of baseFiles) {
            totalFiles++;
            const basePath = path.join(baseLangDir, file);
            const targetPath = path.join(targetLangDir, file);

            if (!fs.existsSync(targetPath)) {
                console.log(chalk.red(`✗ ${file} - Missing file`));
                totalMissing++;
                continue;
            }

            const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
            const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

            const missing = findMissingKeys(baseData, targetData);

            if (missing.length > 0) {
                console.log(chalk.yellow(`⚠ ${file} - ${missing.length} missing keys:`));
                for (const key of missing) {
                    console.log(chalk.gray(`    - ${key}`));
                }
                totalMissing += missing.length;
            } else {
                console.log(chalk.green(`✓ ${file} - Complete`));
            }
        }

        // Check for extra files in target
        const extraFiles = targetFiles.filter(f => !baseFiles.includes(f));
        if (extraFiles.length > 0) {
            console.log(chalk.yellow(`\n⚠ Extra files in ${lang}:`));
            for (const file of extraFiles) {
                console.log(chalk.gray(`  - ${file}`));
            }
        }

        console.log(chalk.blue(`\n📊 Summary:`));
        console.log(chalk.gray(`Total files: ${totalFiles}`));
        console.log(totalMissing > 0 
            ? chalk.yellow(`Missing translations: ${totalMissing}`) 
            : chalk.green('All translations complete ✓')
        );

    } catch (error: any) {
        console.error(chalk.red(`❌ Failed to validate translations: ${error.message}`));
        process.exit(1);
    }
}

function findMissingKeys(base: any, target: any, prefix = ''): string[] {
    const missing: string[] = [];

    for (const key in base) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (!(key in target)) {
            missing.push(fullKey);
            continue;
        }

        if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
            if (typeof target[key] === 'object' && target[key] !== null) {
                missing.push(...findMissingKeys(base[key], target[key], fullKey));
            } else {
                missing.push(fullKey);
            }
        }
    }

    return missing;
}
