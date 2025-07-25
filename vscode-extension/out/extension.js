"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class JsonderuloExtension {
    constructor(context) {
        this.context = context;
        this.config = this.loadConfiguration();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(json) Jsonderulo";
        this.statusBarItem.command = "jsonderulo.showCostAnalytics";
        this.statusBarItem.show();
        this.registerCommands();
        this.setupEventListeners();
    }
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('jsonderulo');
        return {
            defaultProvider: config.get('defaultProvider', 'openai'),
            defaultModel: config.get('defaultModel', 'gpt-4o-mini'),
            costOptimization: config.get('costOptimization', true),
            showCostWarnings: config.get('showCostWarnings', true),
            autoValidate: config.get('autoValidate', false),
            apiEndpoint: config.get('apiEndpoint', 'https://api.jsonderulo.dev'),
        };
    }
    registerCommands() {
        // Generate Schema from Description
        const generateSchemaCommand = vscode.commands.registerCommand('jsonderulo.generateSchema', async () => {
            const description = await vscode.window.showInputBox({
                prompt: 'Describe the JSON structure you want to create',
                placeHolder: 'e.g., User profile with name, email, age (optional), and subscription type',
            });
            if (!description)
                return;
            try {
                const schema = await this.generateSchema(description);
                const doc = await vscode.workspace.openTextDocument({
                    content: JSON.stringify(schema, null, 2),
                    language: 'json',
                });
                await vscode.window.showTextDocument(doc);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Schema generation failed: ${error}`);
            }
        });
        // Create LLM Prompt
        const createPromptCommand = vscode.commands.registerCommand('jsonderulo.createPrompt', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const request = await vscode.window.showInputBox({
                prompt: 'What task do you want to create a prompt for?',
                placeHolder: 'e.g., Analyze customer sentiment from review text',
            });
            if (!request)
                return;
            try {
                const result = await this.createPrompt(request, editor.document.getText());
                await this.showPromptResult(result);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Prompt creation failed: ${error}`);
            }
        });
        // Validate JSON
        const validateJsonCommand = vscode.commands.registerCommand('jsonderulo.validateJson', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const schemaUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'JSON Schema': ['json'] },
                openLabel: 'Select Schema File',
            });
            if (!schemaUri || schemaUri.length === 0)
                return;
            try {
                const schemaDoc = await vscode.workspace.openTextDocument(schemaUri[0]);
                const result = await this.validateJson(editor.document.getText(), schemaDoc.getText());
                await this.showValidationResult(result);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Validation failed: ${error}`);
            }
        });
        // Repair JSON
        const repairJsonCommand = vscode.commands.registerCommand('jsonderulo.repairJson', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            try {
                const repairedJson = await this.repairJson(editor.document.getText());
                if (repairedJson) {
                    await editor.edit(editBuilder => {
                        const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                        editBuilder.replace(fullRange, repairedJson);
                    });
                    vscode.window.showInformationMessage('JSON repaired successfully!');
                }
                else {
                    vscode.window.showWarningMessage('Unable to repair JSON automatically');
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`JSON repair failed: ${error}`);
            }
        });
        // Show Cost Analytics
        const showCostAnalyticsCommand = vscode.commands.registerCommand('jsonderulo.showCostAnalytics', async () => {
            await this.showCostAnalytics();
        });
        // Configure Providers
        const configureProvidersCommand = vscode.commands.registerCommand('jsonderulo.configureProviders', async () => {
            await this.configureProviders();
        });
        // Use Template
        const useTemplateCommand = vscode.commands.registerCommand('jsonderulo.useTemplate', async () => {
            const templates = ['basic_json', 'extraction', 'classification', 'analysis'];
            const selectedTemplate = await vscode.window.showQuickPick(templates, {
                placeHolder: 'Select a template to use',
            });
            if (!selectedTemplate)
                return;
            await this.useTemplate(selectedTemplate);
        });
        this.context.subscriptions.push(generateSchemaCommand, createPromptCommand, validateJsonCommand, repairJsonCommand, showCostAnalyticsCommand, configureProvidersCommand, useTemplateCommand);
    }
    setupEventListeners() {
        // Auto-validate on save if enabled
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (this.config.autoValidate && document.languageId === 'json') {
                // Auto-validation logic would go here
            }
        });
        // Update configuration when settings change
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('jsonderulo')) {
                this.config = this.loadConfiguration();
            }
        });
    }
    async generateSchema(description) {
        const response = await axios_1.default.post(`${this.config.apiEndpoint}/schema/generate`, {
            description,
            provider: this.config.defaultProvider,
            model: this.config.defaultModel,
        });
        if (this.config.showCostWarnings && response.data.costMetrics?.totalCost > 0.01) {
            vscode.window.showWarningMessage(`High cost operation: $${response.data.costMetrics.totalCost.toFixed(4)}`);
        }
        return response.data.schema;
    }
    async createPrompt(request, schema) {
        const response = await axios_1.default.post(`${this.config.apiEndpoint}/prompt/create`, {
            request,
            schema,
            provider: this.config.defaultProvider,
            model: this.config.defaultModel,
            costOptimization: this.config.costOptimization,
        });
        return response.data;
    }
    async validateJson(json, schema) {
        const response = await axios_1.default.post(`${this.config.apiEndpoint}/validate`, {
            json,
            schema,
        });
        return response.data;
    }
    async repairJson(json) {
        const response = await axios_1.default.post(`${this.config.apiEndpoint}/repair`, {
            json,
        });
        return response.data.repairedJson;
    }
    async showPromptResult(result) {
        const panel = vscode.window.createWebviewPanel('jsonderuloPrompt', 'Jsonderulo Prompt Result', vscode.ViewColumn.Two, {
            enableScripts: true,
        });
        panel.webview.html = this.getPromptResultHtml(result);
    }
    async showValidationResult(result) {
        if (result.valid) {
            vscode.window.showInformationMessage('✅ JSON is valid!');
        }
        else {
            const errors = result.errors?.map(e => `${e.path}: ${e.message}`).join('\\n') || '';
            const suggestions = result.suggestions?.join('\\n') || '';
            vscode.window.showErrorMessage(`❌ JSON validation failed:\\n${errors}${suggestions ? '\\n\\nSuggestions:\\n' + suggestions : ''}`);
        }
    }
    async showCostAnalytics() {
        if (this.costPanel) {
            this.costPanel.reveal(vscode.ViewColumn.Two);
        }
        else {
            this.costPanel = vscode.window.createWebviewPanel('jsonderuloCost', 'Jsonderulo Cost Analytics', vscode.ViewColumn.Two, {
                enableScripts: true,
            });
            this.costPanel.onDidDispose(() => {
                this.costPanel = undefined;
            });
            // Load cost data from API
            try {
                const response = await axios_1.default.get(`${this.config.apiEndpoint}/analytics/cost`);
                this.costPanel.webview.html = this.getCostAnalyticsHtml(response.data);
            }
            catch (error) {
                this.costPanel.webview.html = this.getErrorHtml('Failed to load cost analytics');
            }
        }
    }
    async configureProviders() {
        const providerItems = [
            { label: 'OpenAI', description: 'Configure OpenAI API settings' },
            { label: 'Anthropic', description: 'Configure Anthropic Claude settings' },
        ];
        const selection = await vscode.window.showQuickPick(providerItems, {
            placeHolder: 'Select provider to configure',
        });
        if (!selection)
            return;
        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter ${selection.label} API key`,
            password: true,
        });
        if (apiKey) {
            // Store API key securely in VS Code's secret storage
            await this.context.secrets.store(`jsonderulo.${selection.label.toLowerCase()}.apiKey`, apiKey);
            vscode.window.showInformationMessage(`${selection.label} API key saved successfully`);
        }
    }
    async useTemplate(templateName) {
        const variables = {};
        // Get template-specific variables
        switch (templateName) {
            case 'extraction':
                variables.text = await vscode.window.showInputBox({
                    prompt: 'Enter text to extract data from',
                    multiline: true,
                }) || '';
                break;
            case 'classification':
                variables.input = await vscode.window.showInputBox({
                    prompt: 'Enter item to classify',
                }) || '';
                variables.examples = await vscode.window.showInputBox({
                    prompt: 'Enter classification examples (optional)',
                }) || '';
                break;
            case 'analysis':
                variables.content = await vscode.window.showInputBox({
                    prompt: 'Enter content to analyze',
                    multiline: true,
                }) || '';
                variables.focus_areas = await vscode.window.showInputBox({
                    prompt: 'Enter focus areas (optional)',
                }) || '';
                break;
        }
        try {
            const response = await axios_1.default.post(`${this.config.apiEndpoint}/template/use`, {
                templateName,
                variables,
            });
            await this.showPromptResult(response.data);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Template usage failed: ${error}`);
        }
    }
    getPromptResultHtml(result) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #007acc; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
          .cost { color: #d73a49; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="section">
          <div class="label">Generated Prompt:</div>
          <pre>${result.prompt}</pre>
        </div>
        
        <div class="section">
          <div class="label">JSON Schema:</div>
          <pre>${JSON.stringify(result.schema, null, 2)}</pre>
        </div>
        
        ${result.costMetrics ? `
          <div class="section">
            <div class="label">Cost Information:</div>
            <div class="cost">Total Cost: $${result.costMetrics.totalCost.toFixed(6)}</div>
            <div>Provider: ${result.costMetrics.provider}</div>
            <div>Model: ${result.costMetrics.model}</div>
            <div>Tokens: ${result.costMetrics.inputTokens} in, ${result.costMetrics.outputTokens} out</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
    }
    getCostAnalyticsHtml(analytics) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .metric { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
          .cost-high { color: #d73a49; }
          .cost-medium { color: #f66a0a; }
          .cost-low { color: #28a745; }
          .suggestion { background: #fff3cd; padding: 8px; border-radius: 4px; margin: 5px 0; }
        </style>
      </head>
      <body>
        <h2>Cost Analytics Dashboard</h2>
        
        <div class="metric">
          <strong>Total Cost (24h):</strong> 
          <span class="${analytics.totalCost > 1 ? 'cost-high' : analytics.totalCost > 0.1 ? 'cost-medium' : 'cost-low'}">
            $${analytics.totalCost.toFixed(4)}
          </span>
        </div>
        
        <div class="metric">
          <strong>Average Cost per Request:</strong> $${analytics.averageCostPerRequest.toFixed(6)}
        </div>
        
        <h3>Cost by Provider</h3>
        ${Object.entries(analytics.costByProvider).map(([provider, cost]) => `
          <div class="metric">${provider}: $${cost.toFixed(4)}</div>
        `).join('')}
        
        <h3>Optimization Suggestions</h3>
        ${analytics.suggestions.map((suggestion) => `
          <div class="suggestion">${suggestion}</div>
        `).join('')}
      </body>
      </html>
    `;
    }
    getErrorHtml(message) {
        return `
      <!DOCTYPE html>
      <html>
      <body>
        <h2>Error</h2>
        <p>${message}</p>
      </body>
      </html>
    `;
    }
    dispose() {
        this.statusBarItem.dispose();
        if (this.costPanel) {
            this.costPanel.dispose();
        }
    }
}
function activate(context) {
    const extension = new JsonderuloExtension(context);
    context.subscriptions.push(extension);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map