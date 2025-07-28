#!/usr/bin/env node

/**
 * Enhanced Jsonderulo V2 CLI
 * Direct command-line access to advanced prompt engineering
 */

import { Command } from 'commander';
import { EnhancedJsonderuloV2 } from './core/enhancedJsonderuloV2.js';
import chalk from 'chalk';
import fs from 'fs/promises';

const program = new Command();

program
  .name('jsonderulo-v2')
  .description('Enhanced Jsonderulo V2 - Advanced prompt engineering from the command line')
  .version('2.0.0');

program
  .command('speak')
  .description('Transform natural language to structured JSON with advanced strategies')
  .argument('<prompt>', 'The prompt to process')
  .option('-s, --schema <schema>', 'JSON schema (as string or file path)')
  .option('--strategy <strategy>', 'Prompting strategy: cot, tot, consistency', 'cot')
  .option('--rounds <number>', 'Consistency rounds (for consistency strategy)', '3')
  .option('-c, --context <file>', 'Add context from file')
  .option('-o, --output <file>', 'Output to file instead of stdout')
  .action(async (prompt, options) => {
    try {
      const jsonderulo = new EnhancedJsonderuloV2({
        strategy: options.strategy === 'cot' ? 'chain-of-thought' : 
                  options.strategy === 'tot' ? 'tree-of-thoughts' : 
                  'self-consistency',
        selfConsistency: options.strategy === 'consistency',
        consistencyRounds: parseInt(options.rounds),
        enableCoT: options.strategy === 'cot',
        enableToT: options.strategy === 'tot',
        trackQuality: true
      });

      // Load schema if provided
      let schema = undefined;
      if (options.schema) {
        try {
          // Try to parse as JSON first
          schema = JSON.parse(options.schema);
        } catch {
          // If not JSON, try to load as file
          const schemaContent = await fs.readFile(options.schema, 'utf-8');
          schema = JSON.parse(schemaContent);
        }
      }

      // Add context if provided
      if (options.context) {
        const contextContent = await fs.readFile(options.context, 'utf-8');
        await jsonderulo.addContext('user-context', contextContent);
      }

      // Process the prompt
      console.log(chalk.blue('🎙️  Processing with strategy:'), options.strategy);
      
      const result = options.strategy === 'consistency' 
        ? await jsonderulo.processWithConsistency(prompt, schema)
        : await jsonderulo.speakEnhanced(prompt, schema);

      // Format output
      const output = {
        result: options.strategy === 'consistency' ? result.consensus : result.result,
        metadata: {
          strategy: options.strategy,
          quality: result.metadata?.quality,
          reasoning: result.metadata?.reasoning,
          agreement: result.agreement
        }
      };

      // Output results
      const formattedOutput = JSON.stringify(output, null, 2);
      
      if (options.output) {
        await fs.writeFile(options.output, formattedOutput);
        console.log(chalk.green(`✅ Output written to ${options.output}`));
      } else {
        console.log(chalk.green('\n✨ Result:'));
        console.log(formattedOutput);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze text with Chain of Thought reasoning')
  .argument('<text>', 'Text to analyze')
  .option('-t, --type <type>', 'Analysis type: sentiment, summary, entities', 'summary')
  .action(async (text, options) => {
    const jsonderulo = new EnhancedJsonderuloV2({
      strategy: 'chain-of-thought',
      enableCoT: true
    });

    const schemas = {
      sentiment: {
        sentiment: 'positive | negative | neutral | mixed',
        confidence: 'number',
        aspects: [{ aspect: 'string', sentiment: 'string' }]
      },
      summary: {
        summary: 'string',
        keyPoints: ['string'],
        themes: ['string']
      },
      entities: {
        people: ['string'],
        organizations: ['string'],
        locations: ['string'],
        concepts: ['string']
      }
    };

    const result = await jsonderulo.speakEnhanced(
      `Analyze this text for ${options.type}: ${text}`,
      schemas[options.type]
    );

    console.log(chalk.green(`\n${options.type.toUpperCase()} Analysis:`));
    console.log(JSON.stringify(result.result, null, 2));
    
    if (result.metadata?.reasoning) {
      console.log(chalk.blue('\nReasoning:'));
      result.metadata.reasoning.forEach((step, i) => {
        console.log(`${i + 1}. ${step}`);
      });
    }
  });

program
  .command('batch')
  .description('Process multiple prompts from a file')
  .argument('<file>', 'JSON file with prompts array')
  .option('--parallel', 'Process prompts in parallel')
  .action(async (file, options) => {
    const content = await fs.readFile(file, 'utf-8');
    const prompts = JSON.parse(content);
    
    const jsonderulo = new EnhancedJsonderuloV2({
      strategy: 'chain-of-thought',
      enableCoT: true
    });

    console.log(chalk.blue(`📋 Processing ${prompts.length} prompts...`));

    const results = options.parallel
      ? await Promise.all(prompts.map(p => jsonderulo.speakEnhanced(p.prompt, p.schema)))
      : await prompts.reduce(async (prev, p) => {
          await prev;
          return jsonderulo.speakEnhanced(p.prompt, p.schema);
        }, Promise.resolve());

    console.log(chalk.green('\n✅ Results:'));
    console.log(JSON.stringify(results, null, 2));
  });

program
  .command('stream')
  .description('Stream large JSON generation')
  .argument('<prompt>', 'Generation prompt')
  .option('-s, --schema <schema>', 'JSON schema for validation')
  .action(async (prompt, options) => {
    const jsonderulo = new EnhancedJsonderuloV2({
      streaming: true,
      streamingOptions: {
        validateChunks: true
      }
    });

    let schema = undefined;
    if (options.schema) {
      schema = JSON.parse(options.schema);
    }

    console.log(chalk.blue('🌊 Streaming JSON generation...'));

    const stream = jsonderulo.streamJSON(prompt, schema);

    stream.on('chunk', (chunk) => {
      process.stdout.write(chalk.gray(JSON.stringify(chunk) + '\n'));
    });

    stream.on('complete', (result) => {
      console.log(chalk.green('\n✅ Streaming complete'));
      console.log('Total size:', JSON.stringify(result).length, 'characters');
    });

    stream.on('error', (error) => {
      console.error(chalk.red('❌ Streaming error:'), error);
    });
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue('\n🎯 Enhanced Jsonderulo V2 Examples:\n'));
    
    console.log(chalk.yellow('1. Basic Chain of Thought:'));
    console.log('   jsonderulo-v2 speak "Analyze customer feedback" --strategy cot\n');
    
    console.log(chalk.yellow('2. Tree of Thoughts for complex problems:'));
    console.log('   jsonderulo-v2 speak "Design a scalable API" --strategy tot\n');
    
    console.log(chalk.yellow('3. Self-consistency for critical decisions:'));
    console.log('   jsonderulo-v2 speak "Classify security threat" --strategy consistency --rounds 5\n');
    
    console.log(chalk.yellow('4. With schema and context:'));
    console.log('   jsonderulo-v2 speak "Extract entities" -s schema.json -c context.txt\n');
    
    console.log(chalk.yellow('5. Quick analysis:'));
    console.log('   jsonderulo-v2 analyze "This product is amazing!" --type sentiment\n');
  });

program.parse();