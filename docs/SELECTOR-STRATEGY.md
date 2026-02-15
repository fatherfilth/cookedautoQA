# Selector Strategy

## Priority Order

When writing locators in page objects, follow this priority:

| Priority | Method | When to Use | Example |
|----------|--------|-------------|---------|
| 1 | `getByRole()` | Buttons, links, headings, form fields with accessible names | `page.getByRole('button', { name: 'Submit' })` |
| 2 | `getByLabel()` | Form inputs with associated labels | `page.getByLabel('Email address')` |
| 3 | `getByText()` | Static visible text content | `page.getByText('Welcome back')` |
| 4 | `getByTestId()` | Dynamic content, complex components, or when roles are unavailable | `page.getByTestId('game-grid')` |
| 5 | CSS/XPath | **Last resort only** — iframe src patterns, complex DOM queries | `page.locator('iframe[src*="game"]')` |

## Rules

1. **NEVER use CSS class selectors** (`.btn-primary`, `.game-card`). Classes change with design updates.
2. **ALWAYS try role-based first.** If it works, stop. Don't add data-testid "just in case."
3. **Use `.or()` for fallback chains.** Prefer role-based primary with data-testid fallback:
   ```typescript
   page.getByRole('button', { name: /submit/i }).or(page.getByTestId('submit-btn'))
   ```
4. **No `networkidle` waits.** Use `waitFor({ state: 'visible' })` or `waitForResponse()`.
5. **No `waitForTimeout()` arbitrary sleeps.** Trust Playwright's auto-waiting on Locator actions.

## When data-testid Doesn't Exist

cooked.com may not have `data-testid` attributes on all elements. Strategy:

1. First try role-based / label-based selectors (they work without data-testid)
2. If no semantic selector works, use text-based with regex for flexibility
3. Document elements that NEED data-testid in a TODO list for the frontend team
4. Use `.or()` chains so tests work NOW with semantic selectors and will auto-switch when data-testid is added

## Pattern: Locator Definition in Page Objects

```typescript
// GOOD: Role-based primary, testid fallback
readonly submitButton = page.getByRole('button', { name: /submit/i })
  .or(page.getByTestId('form-submit'));

// GOOD: Label-based for form fields
readonly emailInput = page.getByLabel('Email address');

// BAD: CSS class selector
readonly submitButton = page.locator('.btn-submit');

// BAD: Deep DOM path
readonly submitButton = page.locator('form > div:nth-child(3) > button');
```

## Wait Patterns

```typescript
// GOOD: Wait for specific element
await element.waitFor({ state: 'visible' });

// GOOD: Wait for API response
await page.waitForResponse(resp => resp.url().includes('/api/games'));

// GOOD: Web-first assertion (auto-retries)
await expect(element).toBeVisible();

// BAD: Network idle (hangs in SPAs)
await page.goto('/', { waitUntil: 'networkidle' });

// BAD: Arbitrary sleep
await page.waitForTimeout(3000);
```
