// JSON Optimizer Run Parser - Main JavaScript functionality

class JSONParser {
    constructor() {
        this.currentData = null;
        this.rawData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.restoreSavedData();
    }

    setupEventListeners() {
        document.getElementById('parseBtn').addEventListener('click', () => this.parseJSON());
        document.getElementById('parseOptimizerBtn').addEventListener('click', () => this.parseOptimizerRules());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadData());
        document.getElementById('toggleRawBtn').addEventListener('click', () => this.toggleRawView());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearSavedData());

        // Auto-clean textarea on paste
        document.getElementById('jsonInput').addEventListener('paste', (e) => {
            setTimeout(() => {
                this.autoCleanInput();
                this.saveDataToStorage();
            }, 100);
        });

        // Auto-clean textarea on input (for manual typing)
        document.getElementById('jsonInput').addEventListener('input', () => {
            this.autoCleanInput();
            this.saveDataToStorage();
        });
    }

    setupThemeToggle() {
        const themeToggleBtn = document.getElementById('themeToggle');
        if (!themeToggleBtn) return;

        const savedTheme = localStorage.getItem('jsonParserTheme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        document.body.setAttribute('data-theme', initialTheme);
        this.updateThemeToggleText(initialTheme);

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('jsonParserTheme', newTheme);
            this.updateThemeToggleText(newTheme);
        });

        if (!savedTheme && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('jsonParserTheme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    document.body.setAttribute('data-theme', newTheme);
                    this.updateThemeToggleText(newTheme);
                }
            });
        }
    }

    updateThemeToggleText(theme) {
        const themeToggleBtn = document.getElementById('themeToggle');
        if (!themeToggleBtn) return;
        
        const themeIcon = themeToggleBtn.querySelector('.theme-icon');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.textContent = '☀️';
                themeToggleBtn.title = 'Switch to Light Mode';
            } else {
                themeIcon.textContent = '🌙';
                themeToggleBtn.title = 'Switch to Dark Mode';
            }
        }
    }


    autoCleanInput() {
        const textarea = document.getElementById('jsonInput');
        let text = textarea.value;
        
        // Find the first { and remove everything before it
        const firstBraceIndex = text.indexOf('{');
        if (firstBraceIndex > 0) {
            const cleanedText = text.substring(firstBraceIndex);
            textarea.value = cleanedText;
            
            // Show a brief notification that text was cleaned
            this.showTemporaryMessage('🧹 Cleaned text before JSON');
        }
    }

    parseJSON() {
        let jsonText = document.getElementById('jsonInput').value.trim();
        
        if (!jsonText) {
            this.showError('Please enter JSON data to parse');
            return;
        }

        // Clean out any text before the first {
        const firstBraceIndex = jsonText.indexOf('{');
        if (firstBraceIndex > 0) {
            jsonText = jsonText.substring(firstBraceIndex);
        }

        this.showLoading();
        this.hideError();

        try {
            const data = JSON.parse(jsonText);
            this.rawData = data;
            this.currentData = this.formatData(data);
            this.displayData(this.currentData);
        } catch (error) {
            this.showError(`Invalid JSON: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    parseOptimizerRules() {
        const jsonText = document.getElementById('jsonInput').value.trim();

        if (!jsonText) {
            this.showError('Please enter JSON data to parse');
            return;
        }

        // Clean out any text before the first {
        const firstBraceIndex = jsonText.indexOf('{');
        if (firstBraceIndex > 0) {
            jsonText = jsonText.substring(firstBraceIndex);
        }

        this.showLoading();
        this.hideError();

        try {
            const data = JSON.parse(jsonText);
            this.rawData = data;
            const optimizerDisplay = this.formatOptimizerRules(data);
            this.displayOptimizerRules(optimizerDisplay);
        } catch (error) {
            this.showError(`Invalid JSON: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    formatOptimizerRules(data) {
        // Extract context variables for hover functionality
        const ctx = this.extractContextVariables(data);

        // Extract rule changes from diff section
        const changes = this.extractRuleChanges(data);

        // Extract matched rules
        const rules = this.extractMatchedRules(data, ctx);

        // Keep last context available for UI interactions
        this._lastCtx = ctx;

        return {
            changes: changes,
            rules: rules,
            ctx: ctx
        };
    }

    extractContextVariables(data) {
        const ctx = {};

        // Look for ctx in operationData.metadata.ctx (exact path from example JSON)
        if (data && data.operationData && data.operationData.metadata && data.operationData.metadata.ctx) {
            Object.assign(ctx, data.operationData.metadata.ctx);
        }

        return ctx;
    }

    extractRuleChanges(data) {
        const changes = [];

        // Extract changes from diff section using + and - syntax
        if (data && data.diff && data.diff.dataHR) {
            const diffData = data.diff.dataHR;

            // Status change
            if (diffData['+Status'] !== undefined) {
                changes.push({
                    type: 'status',
                    label: 'Status',
                    oldValue: diffData['-Status'] || 'Unknown',
                newValue: diffData['+Status'],
                changed: true,
                percentChange: null
                });
            }

            // DailyBudget change
            if (diffData['+DailyBudget'] !== undefined) {
            const oldVal = Number(diffData['-DailyBudget'] || 0);
            const newVal = Number(diffData['+DailyBudget']);
            changes.push({
                type: 'budget',
                label: 'Daily Budget',
                oldValue: oldVal,
                newValue: newVal,
                changed: true,
                percentChange: this.calculatePercentChange(oldVal, newVal)
            });
            }

            // CPC change
            if (diffData['+CPC'] !== undefined) {
            const oldVal = Number(diffData['-CPC'] || 0);
            const newVal = Number(diffData['+CPC']);
            changes.push({
                type: 'cpc',
                label: 'CPC',
                oldValue: oldVal,
                newValue: newVal,
                changed: true,
                percentChange: this.calculatePercentChange(oldVal, newVal)
            });
            }
        }

        return changes;
    }

    extractMatchedRules(data, ctx) {
        const rules = [];

        // Look for matchedRules in operationData.metadata (correct path from example JSON)
        if (data && data.operationData && data.operationData.metadata && data.operationData.metadata.matchedRules) {
            const matchedRules = data.operationData.metadata.matchedRules;

            if (Array.isArray(matchedRules)) {
                matchedRules.forEach(rule => {
                    rules.push(this.processRule(rule, ctx));
                });
            }
        }

        return rules;
    }

    processRule(rule, ctx) {
        const rawCriteria = rule.GroupDefinition?.criteria || '';
        const rawExceptions = rule.GroupDefinition?.exceptions || '';
        const rawCondition = rule.GroupActions?.condition || '';

        const actionsList = Array.isArray(rule.GroupActions?.actions) ? rule.GroupActions.actions : [];
        const processedActions = actionsList.map(action => {
            const rawParam = action?.param || 'No parameters';

            return {
                ...action,
                processedParam: this.processVariablesInText(rawParam, ctx),
                valueParam: this.replaceVariablesWithValues(rawParam, ctx)
            };
        });

        const logicValueSummary = [
            rawCriteria ? `Criteria: ${this.replaceVariablesWithValues(rawCriteria, ctx)}` : null,
            rawExceptions ? `Exceptions: ${this.replaceVariablesWithValues(rawExceptions, ctx)}` : null,
            rawCondition ? `Condition: ${this.replaceVariablesWithValues(rawCondition, ctx)}` : null
        ].filter(Boolean).join('\n');

        const processedRule = {
            id: rule.GroupDefinition?.seqId || Math.random().toString(36).substr(2, 9),
            displayName: rule.GroupActions?.displayName || 'Unnamed Rule',
            branch: rule.GroupDefinition?.branch || 'Unknown',
            subBranch: rule.GroupDefinition?.subBranch || 'Unknown',
            criteria: rawCriteria,
            exceptions: rawExceptions,
            condition: rawCondition,
            actions: processedActions,
            actionValues: rule.ActionValue || {},
            processedCriteria: this.processVariablesInText(rawCriteria, ctx),
            processedExceptions: this.processVariablesInText(rawExceptions, ctx),
            processedCondition: this.processVariablesInText(rawCondition, ctx),
            criteriaValues: this.replaceVariablesWithValues(rawCriteria, ctx),
            exceptionsValues: this.replaceVariablesWithValues(rawExceptions, ctx),
            conditionValues: this.replaceVariablesWithValues(rawCondition, ctx),
            logicValueSummary,
            actionsValueSummary: processedActions
                .map(action => `${action.action || 'Action'}: ${action.valueParam}`)
                .join('\n'),
            GroupActions: rule.GroupActions || null,
            Limits: rule.Limits || null
        };

        return processedRule;
    }

    getActionLimits(rule, action) {
        const limits = [];

        // Check GroupActions.limits first (user's preference)
        if (rule.GroupActions && rule.GroupActions.limits) {
            const limitsText = rule.GroupActions.limits;
            // Parse limits like "MinDailyBudget = DailyBudget * 0.5 MaxDailyBudget = DailyBudget + 100"
            const limitMatches = limitsText.match(/(\w+)\s*=\s*([^=\s]+)/g);
            if (limitMatches) {
                limitMatches.forEach(match => {
                    const [key, value] = match.split(' = ');
                    limits.push({ key, value });
                });
            }
        }

        // Fallback to separate Limits object if no GroupActions.limits
        if (limits.length === 0 && rule.Limits) {
            Object.entries(rule.Limits).forEach(([key, value]) => {
                if (key.toLowerCase().includes(action.action.toLowerCase())) {
                    limits.push({ key, value });
                }
            });
        }

        return limits;
    }

    processVariablesInText(text, ctx) {
        if (!text || typeof text !== 'string') return text;
        if (!ctx || typeof ctx !== 'object') return text;

        let processedText = text;
        const keys = Object.keys(ctx).sort((a, b) => b.length - a.length);

        keys.forEach((key) => {
            if (!key) return;
            const value = ctx[key];
            if (value === undefined || value === null) return;

            // Prepare safe tooltip content and attributes
            const displayString = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const safeValueForTooltip = this.escapeTooltipContent(displayString);
            const safeKeyForTooltip = this.escapeTooltipContent(String(key));
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');

            if (!regex.test(processedText)) return;

            processedText = processedText.replace(
                regex,
                `<span class="variable-tooltip" data-variable="${safeKeyForTooltip}" data-value="${safeValueForTooltip}">
                    <span class="variable-ref">${key}</span>
                    <span class="tooltip-text">${safeValueForTooltip}</span>
                </span>`
            );
        });

        return processedText;
    }

    replaceVariablesWithValues(text, ctx) {
        if (!text || typeof text !== 'string') return text;
        if (!ctx || typeof ctx !== 'object') return text;

        const variablePattern = /(\b[A-Z][a-zA-Z0-9_]*\b)/g;

        return text.replace(variablePattern, variable => {
            if (!(variable in ctx)) {
                return variable;
            }

            const value = ctx[variable];
            if (value === null || value === undefined) {
                return 'N/A';
            }

            if (typeof value === 'object') {
                try {
                    return JSON.stringify(value);
                } catch (error) {
                    return '[Object]';
                }
            }

            return value;
        });
    }

    escapeTooltipContent(content) {
        if (content === null || content === undefined) {
            return '';
        }

        return String(content)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '&#10;');
    }

    renderValueToggleIcon(content, ctx = {}) {
        if (!content || (typeof content === 'string' && !content.trim())) {
            return '';
        }

        // Render an accessible toggle switch (no hover preview)
        return `<button type="button" class="value-toggle-switch" role="switch" aria-checked="false" tabindex="0" title="Show values" data-context="${this.escapeHtml(JSON.stringify(ctx))}" aria-label="Toggle variable names and values"></button>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Reusable DOM helpers for values toggle ---
    createRuleSnapshot(ruleCard) {
        const logicRows = ruleCard.querySelector('.logic-rows');
        const actionItems = ruleCard.querySelectorAll('.action-item');
        const limitValues = ruleCard.querySelectorAll('.limit-value');

        return {
            logic: logicRows ? Array.from(logicRows.children).map(row => ({ element: row, html: row.innerHTML })) : [],
            actions: Array.from(actionItems).map(item => ({ element: item, html: item.innerHTML })),
            limits: Array.from(limitValues).map(item => ({ element: item, html: item.innerHTML }))
        };
    }

    restoreRuleSnapshot(snapshot) {
        if (!snapshot) return;
        if (snapshot.logic) {
            snapshot.logic.forEach(({ element, html }) => { element.innerHTML = html; });
        }
        if (snapshot.actions) {
            snapshot.actions.forEach(({ element, html }) => { element.innerHTML = html; });
        }
        if (snapshot.limits) {
            snapshot.limits.forEach(({ element, html }) => { element.innerHTML = html; });
        }
    }

    applyValuesInContainer(container, ctx) {
        if (!container) return;
        const tooltips = container.querySelectorAll('.variable-tooltip');
        tooltips.forEach(span => {
            const varName = span.getAttribute('data-variable');
            if (!varName || !(varName in ctx)) return;
            const rawVal = ctx[varName];
            const displayString = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
            const safeValueForHtml = this.escapeHtml(displayString);
            const safeKeyForTooltip = this.escapeTooltipContent(String(varName));
            const safeValForTooltip = this.escapeTooltipContent(displayString);
            span.innerHTML = `<span class="variable-ref">${safeValueForHtml}</span><span class="tooltip-text">${safeKeyForTooltip}: ${safeValForTooltip}</span>`;
        });
    }

    applyValuesToRule(ruleCard, ctx) {
        // Logic values
        const logicRows = ruleCard.querySelector('.logic-rows');
        if (logicRows) {
            Array.from(logicRows.children).forEach(row => {
                const logicValue = row.querySelector('.logic-value');
                this.applyValuesInContainer(logicValue, ctx);
            });
        }
        // Actions
        const actionParams = ruleCard.querySelectorAll('.action-param');
        actionParams.forEach(param => this.applyValuesInContainer(param, ctx));
        // Limits
        const limitVals = ruleCard.querySelectorAll('.limit-value');
        limitVals.forEach(val => this.applyValuesInContainer(val, ctx));
    }

    updateTooltipsForRule(ruleCard, enabled, ctx) {
        const tooltips = ruleCard.querySelectorAll('.variable-tooltip');
        tooltips.forEach(tooltip => {
            const varName = tooltip.getAttribute('data-variable');
            if (!varName || !(varName in ctx)) return;
            const value = ctx[varName];
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const safeName = this.escapeTooltipContent(varName);
            const safeValue = this.escapeTooltipContent(displayValue);
            // When enabled (values shown), tooltip shows only the name; else, shows only the value
            const tooltipEl = tooltip.querySelector('.tooltip-text');
            tooltipEl.textContent = enabled ? safeName : safeValue;
        });
    }

    displayOptimizerRules(optimizerData) {
        const output = document.getElementById('output');

        const html = this.renderOptimizerRules(optimizerData);
        output.innerHTML = html;
    }

    renderOptimizerRules(data) {
        let html = '<div class="optimizer-rules">';

        // Render rule summary with changes (collapsible)
        html += `<div class="collapsible-section">`;
        html += `<button class="collapsible">Rule Changes Summary</button>`;
        html += `<div class="collapsible-content rule-summary">`;
        html += this.renderRuleSummary(data);
        html += `</div></div>`;

        // Render rules list (collapsible)
        html += `<div class="collapsible-section">`;
        html += `<button class="collapsible">Matched Rules (${data.rules.length})</button>`;
        html += `<div class="collapsible-content rules-list">`;
        html += this.renderRulesList(data.rules, data.ctx);
        html += `</div></div>`;

        html += '</div>';

        // Add collapsible functionality
        setTimeout(() => {
            this.setupCollapsibleSections();
        }, 100);

        return html;
    }

    renderRuleSummary(data) {
        const changes = data.changes;
        let html = '<div class="rule-summary">';
        html += '<h3 style="margin: 0 0 15px 0; font-size: 1.3em;">Rule Changes Summary</h3>';

        if (changes.length === 0) {
            html += '<p>No changes detected in this run.</p>';
        } else {
            html += '<div class="rule-changes">';

            changes.forEach(change => {
                const changeClass = change.changed ? `change-item ${change.type}-change` : 'change-item no-change';

                html += `<div class="${changeClass}">`;
                html += `<div class="change-label">${change.label}:</div>`;
                html += `<div class="change-value">`;

                if (change.changed) {
                    html += `<span class="change-old">${change.oldValue}</span>`;
                    html += `<span class="change-arrow">→</span>`;
                    html += `<span class="change-new">${change.newValue}</span>`;
                    if (typeof change.percentChange === 'number' && isFinite(change.percentChange)) {
                        const sign = change.percentChange >= 0 ? '+' : '';
                        html += `<span class="change-percent">(${sign}${change.percentChange.toFixed(1)}%)</span>`;
                    }
                } else {
                    html += `<span class="change-new">${change.newValue}</span>`;
                    html += `<span class="no-change-note">(no change)</span>`;
                }

                html += '</div>';
                html += '</div>';
            });

            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    calculatePercentChange(oldValue, newValue) {
        const oldNum = Number(oldValue);
        const newNum = Number(newValue);

        if (!isFinite(oldNum) || !isFinite(newNum)) {
            return null;
        }

        if (oldNum === 0) {
            if (newNum === 0) return 0;
            return null;
        }

        return ((newNum - oldNum) / Math.abs(oldNum)) * 100;
    }

    renderRulesList(rules, ctx = {}) {
        if (rules.length === 0) {
            return '<div class="rules-list"><p>No rules found in this JSON data.</p></div>';
        }

        let html = '<div class="rules-list">';

        rules.forEach(rule => {
            html += this.renderRule(rule, ctx);
        });

        html += '</div>';
        return html;
    }

    renderRule(rule, ctx = {}) {
        let html = '<div class="optimizer-rule">';

        // Rule header (clickable to collapse/expand)
        html += `<div class="rule-header">`;
        html += `<div class="rule-title">${rule.displayName}</div>`;
        html += `<div class="rule-subtitle">[${rule.branch} - ${rule.subBranch}]</div>`;
        html += `</div>`;

        // Rule content (collapsible)
        html += `<div class="rule-content" data-context="${this.escapeHtml(JSON.stringify(ctx))}">`;

        // Logic block: criteria + exceptions + condition in one div
        html += `<div class="rule-logic">`;
        html += `<div class="logic-card">`;
        html += `<div class="logic-title">Logic${this.renderValueToggleIcon(rule.logicValueSummary, ctx)}</div>`;
        html += `<div class="logic-rows">`;
        html += `<div class="logic-row" data-values="${this.escapeHtml(rule.criteriaValues || '')}"><span class="logic-label">Criteria</span><span class="logic-value">${rule.processedCriteria || 'None'}</span></div>`;
        html += `<div class="logic-row" data-values="${this.escapeHtml(rule.exceptionsValues || '')}"><span class="logic-label">Exceptions</span><span class="logic-value">${rule.processedExceptions || 'None'}</span></div>`;
        html += `<div class="logic-row" data-values="${this.escapeHtml(rule.conditionValues || '')}"><span class="logic-label">Condition</span><span class="logic-value">${rule.processedCondition || 'None'}</span></div>`;
        html += `</div>`;
        html += `</div>`;
        html += `</div>`;

        // Actions section (now includes limits as subitems)
        html += `<div class="rule-actions">`;
        html += `<h4>Actions${this.renderValueToggleIcon(rule.actionsValueSummary, ctx)}</h4>`;
        rule.actions.forEach(action => {
            const actionLimits = this.getActionLimits(rule, action);
            html += `<div class="action-item">`;
            html += `<span class="action-type">${action.action}:</span>`;
            html += `<span class="action-param" data-values="${this.escapeHtml(action.valueParam || '')}">${action.processedParam || 'No parameters'}</span>`;

            // Add limits as subitems under each action
            if (actionLimits.length > 0) {
                html += `<div class="action-limits">`;
                actionLimits.forEach(limit => {
                    html += `<div class="action-limit-item">`;
                    html += `<span class="limit-label">${limit.key}:</span>`;
                    const limitRaw = JSON.stringify(limit.value);
                    const limitValuesText = this.replaceVariablesWithValues(limitRaw, ctx);
                    html += `<span class="limit-value" data-values="${this.escapeHtml(limitValuesText)}">${this.processVariablesInText(limitRaw, ctx)}</span>`;
                    html += `</div>`;
                });
                html += `</div>`;
            }

            // Attach applied result if this action has a value in ActionValue
            const appliedKey = action.action;
            if (rule.actionValues && Object.prototype.hasOwnProperty.call(rule.actionValues, appliedKey)) {
                const appliedValue = rule.actionValues[appliedKey];
                html += `<div class=\"action-result\">Applied: ${appliedKey} = ${appliedValue}</div>`;
            }
            html += `</div>`;
        });
        html += `</div>`;

        // Attach applied values to related actions (if present)
        if (Object.keys(rule.actionValues).length > 0) {
            // Render again inside action loop via a lightweight lookup
        }

        html += `</div>`;
        html += `</div>`;

        return html;
    }

    setupCollapsibleSections() {
        const collapsibles = document.querySelectorAll('.collapsible');

        collapsibles.forEach((collapsible, index) => {
            // Make first two sections (Rule Changes Summary and Matched Rules) open by default
            if (index < 2) {
                collapsible.classList.add('active');
                const content = collapsible.nextElementSibling;
                if (content) {
                    content.classList.add('show');
                }
            }

            collapsible.addEventListener('click', function() {
                this.classList.toggle('active');

                const content = this.nextElementSibling;
                if (content) {
                    content.classList.toggle('show');
                }
            });
        });

        // Make individual rule cards collapsible too
        const ruleHeaders = document.querySelectorAll('.rule-header');
        ruleHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function(e) {
                if (e.target.tagName !== 'BUTTON') {
                    const ruleCard = this.parentElement;
                    const ruleContent = ruleCard.querySelector('.rule-content');
                    if (ruleContent) {
                        ruleContent.style.display = ruleContent.style.display === 'none' ? 'grid' : 'none';
                    }
                }
            });
        });

        // Set up value toggle functionality
        this.setupValueToggles();
    }

    setupValueToggles() {
        // For each rule card, wire up both preview-on-hover and persistent click toggle
        const ruleCards = document.querySelectorAll('.optimizer-rule');

        ruleCards.forEach(ruleCard => {
            const ruleContent = ruleCard.querySelector('.rule-content');
            const contextJson = ruleContent ? ruleContent.getAttribute('data-context') : null;
            let ctx = {};
            try {
                ctx = contextJson ? JSON.parse(contextJson) : (this._lastCtx || {});
            } catch (e) {
                ctx = this._lastCtx || {};
            }

            // Support both legacy icon and new switch classes; prefer switch
            const toggles = ruleCard.querySelectorAll('.value-toggle-switch, .value-toggle-icon');
            // Lazily capture originals only once per rule card
            const ensureOriginals = () => {
                if (!ruleCard.__snapshot) {
                    ruleCard.__snapshot = this.createRuleSnapshot(ruleCard);
                }
            };

            const applyValues = () => {
                this.applyValuesToRule(ruleCard, ctx);
            };

            const restoreOriginals = () => {
                this.restoreRuleSnapshot(ruleCard.__snapshot);
            };

            const setPersistentMode = (enabled) => {
                ruleCard.dataset.valuesMode = enabled ? 'on' : 'off';
                toggles.forEach(ic => {
                    ic.setAttribute('aria-checked', enabled ? 'true' : 'false');
                    ic.setAttribute('aria-pressed', enabled ? 'true' : 'false'); // legacy support
                    ic.title = enabled ? 'Show names' : 'Show values';
                });
                if (enabled) {
                    ensureOriginals();
                    applyValues();
                } else {
                    restoreOriginals();
                }
                // Update tooltips based on the new mode
                this.updateTooltipsForRule(ruleCard, enabled, ctx);
            };

            // Wire switch events (no hover behavior)
            toggles.forEach(toggle => {
                // Ensure baseline a11y attributes are present
                if (!toggle.hasAttribute('role')) toggle.setAttribute('role', 'switch');
                if (!toggle.hasAttribute('tabindex')) toggle.setAttribute('tabindex', '0');
                if (!toggle.hasAttribute('aria-checked')) toggle.setAttribute('aria-checked', 'false');

                // Persistent toggle on click
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const enabled = ruleCard.dataset.valuesMode === 'on';
                    setPersistentMode(!enabled);
                });

                // Keyboard support
                toggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle.click();
                    }
                });
            });
        });
    }

    replaceVariablesInText(text, ctx = {}) {
        if (!text || typeof text !== 'string') return text;
        if (!ctx || typeof ctx !== 'object') return text;

        let replacedText = text;
        const keys = Object.keys(ctx).sort((a, b) => b.length - a.length);

        keys.forEach((key) => {
            if (!key) return;
            const value = ctx[key];
            if (value === undefined || value === null) return;

            const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');

            if (regex.test(replacedText)) {
                replacedText = replacedText.replace(regex, displayValue);
            }
        });

        return replacedText;
    }

    formatData(data) {
        return this.formatDefault(data);
    }


    formatDefault(data) {
        return {
            type: 'json',
            content: this.syntaxHighlight(JSON.stringify(data, null, 2))
        };
    }

    syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    displayData(formattedData) {
        const output = document.getElementById('output');
        output.innerHTML = `<pre>${formattedData.content}</pre>`;
    }

    showLoading() {
        const btn = document.getElementById('parseBtn');
        btn.innerHTML = '<span class="loading"></span>Parsing...';
        btn.disabled = true;
    }

    hideLoading() {
        const btn = document.getElementById('parseBtn');
        btn.innerHTML = 'Parse JSON';
        btn.disabled = false;
    }

    showError(message) {
        this.hideLoading();
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        
        // Create a more detailed error display
        let errorHTML = `<div class="error-content">`;
        errorHTML += `<div class="error-main">${message}</div>`;
        
        // Add troubleshooting tips based on error type
        if (message.includes('Invalid JSON')) {
            errorHTML += `<div class="error-tips">
                <strong>💡 Troubleshooting Tips:</strong>
                <ul>
                    <li>Check for missing commas between JSON properties</li>
                    <li>Ensure all strings are properly quoted with double quotes</li>
                    <li>Verify all brackets and braces are properly closed</li>
                    <li>Remove any trailing commas after the last item in arrays/objects</li>
                </ul>
            </div>`;
        }
        
        errorHTML += `</div>`;
        errorMessage.innerHTML = errorHTML;
        errorSection.style.display = 'block';
    }

    hideError() {
        const errorSection = document.getElementById('errorSection');
        errorSection.style.display = 'none';
    }

    async copyToClipboard() {
        if (!this.currentData) {
            this.showError('No data to copy');
            return;
        }

        try {
            const textToCopy = this.rawData ? JSON.stringify(this.rawData, null, 2) : '';
            await navigator.clipboard.writeText(textToCopy);
            this.showTemporaryMessage('Copied to clipboard!');
        } catch (error) {
            this.showError(`Failed to copy: ${error.message}`);
        }
    }

    downloadData() {
        if (!this.rawData) {
            this.showError('No data to download');
            return;
        }

        const dataStr = JSON.stringify(this.rawData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'json-data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    toggleRawView() {
        if (!this.rawData) {
            this.showError('No data available');
            return;
        }

        const output = document.getElementById('output');
        const btn = document.getElementById('toggleRawBtn');
        
        if (btn.textContent === 'Toggle Raw JSON') {
            output.innerHTML = `<pre>${this.syntaxHighlight(JSON.stringify(this.rawData, null, 2))}</pre>`;
            btn.textContent = 'Toggle Formatted View';
        } else {
            this.displayData(this.currentData);
            btn.textContent = 'Toggle Raw JSON';
        }
    }

    showTemporaryMessage(message) {
        const output = document.getElementById('output');
        const originalContent = output.innerHTML;
        output.innerHTML = `<p class="flash-success">${message}</p>`;
        
        setTimeout(() => {
            output.innerHTML = originalContent;
        }, 2000);
    }

    // Save JSON data to localStorage
    saveDataToStorage() {
        const jsonInput = document.getElementById('jsonInput');
        const data = {
            jsonText: jsonInput.value,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('jsonParserData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save data to localStorage:', error);
        }
    }

    // Restore JSON data from localStorage
    restoreSavedData() {
        try {
            const savedData = localStorage.getItem('jsonParserData');
            if (savedData) {
                const data = JSON.parse(savedData);
                const jsonInput = document.getElementById('jsonInput');
                
                if (data.jsonText && data.jsonText.trim()) {
                    jsonInput.value = data.jsonText;
                    
                    // Show a subtle indicator that data was restored
                    this.showTemporaryMessage('📄 Restored previous JSON data');
                }
            }
        } catch (error) {
            console.warn('Failed to restore data from localStorage:', error);
        }
    }

    // Clear saved data
    clearSavedData() {
        try {
            localStorage.removeItem('jsonParserData');
            document.getElementById('jsonInput').value = '';
            this.showTemporaryMessage('🗑️ Cleared saved data');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONParser();
});