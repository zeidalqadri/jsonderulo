#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Jsonderulo, JsonDeruloOptions } from './core/jsonderulo.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();
const jsonderulo = new Jsonderulo();

program
  .name('jsonderulo')
  .description(
    'The finest JSON speaker on earth - transforms prompts into JSON-structured casks for perfect LLM compliance'
  )
  .version('1.0.0');

program
  .command('speak')
  .description('Transform a prompt into JSON-structured format')
  .argument('<prompt>', 'The prompt to transform')
  .option('-s, --schema <description>', 'Schema description in natural language')
  .option('-m, --mode <mode>', 'Output mode (strict, explanatory, streaming, validated)', 'strict')
  .option('-t, --temperature <number>', 'Temperature for generation', parseFloat)
  .option('-e, --examples', 'Include examples in the prompt')
  .option('-o, --output <file>', 'Output to file instead of stdout')
  .action(async (prompt, options) => {
    try {
      const jsOptions: JsonDeruloOptions = {
        mode: options.mode,
        temperature: options.temperature,
        includeExamples: options.examples,
      };

      const result = jsonderulo.speak(prompt, options.schema, jsOptions);

      const output = {
        prompt: result.prompt,
        schema: result.schema,
        systemPrompt: result.systemPrompt,
      };

      const outputJson = JSON.stringify(output, null, 2);

      if (options.output) {
        await fs.writeFile(options.output, outputJson);
        console.log(chalk.green(`✅ Output written to ${options.output}`));
      } else {
        console.log(chalk.cyan('🎵 Jsonderulo speaks:\n'));
        console.log(outputJson);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('template')
  .description('Use a predefined template')
  .argument('<name>', 'Template name')
  .option('-v, --vars <json>', 'Variables as JSON string')
  .option('-f, --vars-file <file>', 'Variables from JSON file')
  .option('-o, --output <file>', 'Output to file')
  .action(async (name, options) => {
    try {
      let variables = {};

      if (options.varsFile) {
        const content = await fs.readFile(options.varsFile, 'utf-8');
        variables = JSON.parse(content);
      } else if (options.vars) {
        variables = JSON.parse(options.vars);
      }

      const result = jsonderulo.useTemplate(name, variables);

      const outputJson = JSON.stringify(result, null, 2);

      if (options.output) {
        await fs.writeFile(options.output, outputJson);
        console.log(chalk.green(`✅ Output written to ${options.output}`));
      } else {
        console.log(chalk.cyan('🎵 Template applied:\n'));
        console.log(outputJson);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate JSON against a schema')
  .argument('<json-file>', 'JSON file to validate')
  .argument('<schema-file>', 'Schema file')
  .option('-r, --repair', 'Attempt to repair invalid JSON')
  .action(async (jsonFile, schemaFile, options) => {
    try {
      const jsonContent = await fs.readFile(jsonFile, 'utf-8');
      const schemaContent = await fs.readFile(schemaFile, 'utf-8');
      const schema = JSON.parse(schemaContent);

      let jsonToValidate = jsonContent;

      if (options.repair) {
        const repaired = jsonderulo.repair(jsonContent);
        if (repaired) {
          jsonToValidate = repaired;
          console.log(chalk.yellow('🔧 JSON repaired'));
        }
      }

      const result = jsonderulo.validate(jsonToValidate, schema);

      if (result.valid) {
        console.log(chalk.green('✅ JSON is valid!'));
      } else {
        console.log(chalk.red('❌ Validation failed:'));
        result.errors?.forEach(error => {
          console.log(chalk.red(`  - ${error.path}: ${error.message}`));
        });

        if (result.suggestions && result.suggestions.length > 0) {
          console.log(chalk.yellow('\n💡 Suggestions:'));
          result.suggestions.forEach(suggestion => {
            console.log(chalk.yellow(`  - ${suggestion}`));
          });
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('list-templates')
  .description('List available templates')
  .action(() => {
    const templates = jsonderulo.getAvailableTemplates();
    console.log(chalk.cyan('📋 Available templates:\n'));
    templates.forEach(template => {
      console.log(`  - ${chalk.green(template)}`);
    });
  });

program
  .command('schema')
  .description('Generate JSON schema from natural language description')
  .argument('<description>', 'Natural language description of the schema')
  .option('-o, --output <file>', 'Output to file')
  .action(async (description, options) => {
    try {
      const { SchemaGenerator } = await import('./core/schemaGenerator.js');
      const schemaGenerator = new SchemaGenerator();
      const schema = schemaGenerator.generateFromDescription(description);

      const outputJson = JSON.stringify(schema, null, 2);

      if (options.output) {
        await fs.writeFile(options.output, outputJson);
        console.log(chalk.green(`✅ Schema written to ${options.output}`));
      } else {
        console.log(chalk.cyan('📋 Generated schema:\n'));
        console.log(outputJson);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .description('Start interactive mode')
  .action(async () => {
    console.log(
      chalk.cyan(`
🎵 Welcome to Jsonderulo Interactive Mode! 🎵
The finest JSON speaker on earth at your service.

Commands:
  speak <prompt>     - Transform a prompt
  template <name>    - Use a template
  schema <desc>      - Generate schema
  help              - Show help
  exit              - Exit
`)
    );

    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('jsonderulo> '),
    });

    readline.prompt();

    readline.on('line', async (line: string) => {
      const [command, ...args] = line.trim().split(' ');

      switch (command) {
        case 'speak':
          if (args.length > 0) {
            const result = jsonderulo.speak(args.join(' '));
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(chalk.red('Please provide a prompt'));
          }
          break;

        case 'template':
          console.log('Available templates:', jsonderulo.getAvailableTemplates().join(', '));
          break;

        case 'schema':
          if (args.length > 0) {
            const { SchemaGenerator } = await import('./core/schemaGenerator.js');
            const schemaGenerator = new SchemaGenerator();
            const schema = schemaGenerator.generateFromDescription(args.join(' '));
            console.log(JSON.stringify(schema, null, 2));
          } else {
            console.log(chalk.red('Please provide a description'));
          }
          break;

        case 'help':
          console.log(
            chalk.cyan(`
Commands:
  speak <prompt>     - Transform a prompt
  template <name>    - Use a template  
  schema <desc>      - Generate schema
  help              - Show help
  exit              - Exit
`)
          );
          break;

        case 'exit':
          readline.close();
          process.exit(0);
          break;

        default:
          console.log(chalk.red(`Unknown command: ${command}`));
      }

      readline.prompt();
    });
  });

program.parse();
