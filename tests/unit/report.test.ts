/**
 * Markdown Report Tests
 * Comprehensive tests for report generation functionality
 */

import { describe, it, expect } from 'vitest';
import {
    generateMarkdownReport,
    createReportData,
    generateHtmlReport,
} from '../../src/cli/report.js';

describe('Markdown Report Generation', () => {
    // ============================================================================
    // createReportData Tests
    // ============================================================================
    describe('createReportData', () => {
        it('creates report data with correct structure', () => {
            const results = [
                { module: 'secrets', status: 'passed' as const, issues: [] },
            ];
            const data = createReportData('my-repo', results);

            expect(data.repoName).toBe('my-repo');
            expect(data.scanDate).toBeInstanceOf(Date);
            expect(data.sections).toHaveLength(1);
        });

        it('calculates summary correctly', () => {
            const results = [
                {
                    module: 'secrets',
                    status: 'failed' as const,
                    issues: [
                        { severity: 'error' as const, message: 'Error 1' },
                        { severity: 'error' as const, message: 'Error 2' },
                        { severity: 'warning' as const, message: 'Warning 1' },
                    ]
                },
                {
                    module: 'licenses',
                    status: 'warning' as const,
                    issues: [
                        { severity: 'info' as const, message: 'Info 1' },
                    ]
                },
            ];
            const data = createReportData('repo', results);

            expect(data.summary.totalIssues).toBe(4);
            expect(data.summary.errors).toBe(2);
            expect(data.summary.warnings).toBe(1);
            expect(data.summary.info).toBe(1);
        });

        it('handles empty results', () => {
            const data = createReportData('repo', []);

            expect(data.sections).toHaveLength(0);
            expect(data.summary.totalIssues).toBe(0);
        });

        it('handles all status types', () => {
            const results = [
                { module: 'a', status: 'passed' as const, issues: [] },
                { module: 'b', status: 'warning' as const, issues: [] },
                { module: 'c', status: 'failed' as const, issues: [] },
            ];
            const data = createReportData('repo', results);

            expect(data.sections[0].status).toBe('passed');
            expect(data.sections[1].status).toBe('warning');
            expect(data.sections[2].status).toBe('failed');
        });

        it('preserves issue details', () => {
            const results = [
                {
                    module: 'm',
                    status: 'warning' as const,
                    issues: [
                        { severity: 'warning' as const, message: 'msg', details: 'extra' },
                    ]
                },
            ];
            const data = createReportData('repo', results);

            expect(data.sections[0].items[0].message).toBe('msg');
            expect(data.sections[0].items[0].details).toBe('extra');
        });
    });

    // ============================================================================
    // generateMarkdownReport Tests
    // ============================================================================
    describe('generateMarkdownReport', () => {
        it('generates valid markdown with header', () => {
            const data = createReportData('test-repo', []);
            const md = generateMarkdownReport(data);

            expect(md).toContain('# 🧹 RepoHygiene Report');
            expect(md).toContain('**Repository:** test-repo');
        });

        it('includes scan date', () => {
            const data = createReportData('repo', []);
            const md = generateMarkdownReport(data);

            expect(md).toContain('**Scan Date:**');
        });

        it('includes summary table', () => {
            const data = createReportData('repo', [
                { module: 'm', status: 'failed' as const, issues: [{ severity: 'error' as const, message: 'e' }] },
            ]);
            const md = generateMarkdownReport(data);

            expect(md).toContain('## 📊 Summary');
            expect(md).toContain('| Total Issues |');
            expect(md).toContain('| 🔴 Errors |');
        });

        it('includes quick status table', () => {
            const results = [
                { module: 'secrets', status: 'passed' as const, issues: [] },
                { module: 'licenses', status: 'warning' as const, issues: [] },
            ];
            const data = createReportData('repo', results);
            const md = generateMarkdownReport(data);

            expect(md).toContain('## 🔍 Quick Status');
            expect(md).toContain('| secrets | ✅ passed |');
            expect(md).toContain('| licenses | ⚠️ warning |');
        });

        it('includes section details', () => {
            const results = [
                {
                    module: 'branches',
                    status: 'warning' as const,
                    issues: [
                        { severity: 'warning' as const, message: 'Stale branch detected' },
                    ]
                },
            ];
            const data = createReportData('repo', results);
            const md = generateMarkdownReport(data);

            expect(md).toContain('## ⚠️ branches');
            expect(md).toContain('🟡 Stale branch detected');
        });

        it('shows "No issues found" for empty sections', () => {
            const results = [
                { module: 'secrets', status: 'passed' as const, issues: [] },
            ];
            const data = createReportData('repo', results);
            const md = generateMarkdownReport(data);

            expect(md).toContain('No issues found. ✨');
        });

        it('includes footer with link', () => {
            const data = createReportData('repo', []);
            const md = generateMarkdownReport(data);

            expect(md).toContain('---');
            expect(md).toContain('Generated by [RepoHygiene]');
        });

        it('uses correct emojis for severities', () => {
            const results = [
                {
                    module: 'mixed',
                    status: 'failed' as const,
                    issues: [
                        { severity: 'error' as const, message: 'Error msg' },
                        { severity: 'warning' as const, message: 'Warning msg' },
                        { severity: 'info' as const, message: 'Info msg' },
                    ]
                },
            ];
            const data = createReportData('repo', results);
            const md = generateMarkdownReport(data);

            expect(md).toContain('🔴 Error msg');
            expect(md).toContain('🟡 Warning msg');
            expect(md).toContain('🔵 Info msg');
        });

        it('includes issue details when provided', () => {
            const results = [
                {
                    module: 'm',
                    status: 'warning' as const,
                    issues: [
                        { severity: 'warning' as const, message: 'Main msg', details: 'Additional context' },
                    ]
                },
            ];
            const data = createReportData('repo', results);
            const md = generateMarkdownReport(data);

            expect(md).toContain('Additional context');
        });
    });

    // ============================================================================
    // generateHtmlReport Tests
    // ============================================================================
    describe('generateHtmlReport', () => {
        it('generates valid HTML document', () => {
            const md = '# Test Report';
            const html = generateHtmlReport(md);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html>');
            expect(html).toContain('</html>');
        });

        it('includes title', () => {
            const html = generateHtmlReport('# Test');

            expect(html).toContain('<title>RepoHygiene Report</title>');
        });

        it('includes styles', () => {
            const html = generateHtmlReport('# Test');

            expect(html).toContain('<style>');
            expect(html).toContain('font-family');
        });

        it('converts markdown headers to HTML', () => {
            const md = '# Header 1\n## Header 2\n### Header 3';
            const html = generateHtmlReport(md);

            expect(html).toContain('<h1>Header 1</h1>');
            expect(html).toContain('<h2>Header 2</h2>');
            expect(html).toContain('<h3>Header 3</h3>');
        });

        it('converts bold text', () => {
            const md = 'This is **bold** text';
            const html = generateHtmlReport(md);

            expect(html).toContain('<strong>bold</strong>');
        });

        it('converts italic text', () => {
            const md = 'This is *italic* text';
            const html = generateHtmlReport(md);

            expect(html).toContain('<em>italic</em>');
        });

        it('converts links', () => {
            const md = '[Click here](https://example.com)';
            const html = generateHtmlReport(md);

            expect(html).toContain('<a href="https://example.com">Click here</a>');
        });

        it('converts list items', () => {
            const md = '- Item 1\n- Item 2';
            const html = generateHtmlReport(md);

            expect(html).toContain('<li>Item 1</li>');
            expect(html).toContain('<li>Item 2</li>');
        });

        it('converts horizontal rules', () => {
            const md = '---';
            const html = generateHtmlReport(md);

            expect(html).toContain('<hr>');
        });
    });
});
