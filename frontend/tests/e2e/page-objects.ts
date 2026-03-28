/* Page Objects for E2E tests */

import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    // Use label or placeholder selectors since data-testid is not available
    await this.page.getByPlaceholder(/email/i).fill(email);
    await this.page.getByPlaceholder(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in|login/i }).click();
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}

export class DocumentsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/documents');
  }

  async uploadDocument(filePath: string) {
    // Find the file input (hidden) and trigger click on the drop zone
    const fileInput = this.page.locator('input[type="file"][accept=".pdf"]');
    await fileInput.setInputFiles(filePath);
  }

  async expectDocumentVisible(filename: string) {
    // Wait for document to appear in the list by filename
    await expect(
      this.page.getByText(filename).first()
    ).toBeVisible();
  }

  async getDocumentStatus(filename: string) {
    // Find the status text next to the filename
    const documentRow = this.page.getByText(filename).locator('..');
    const statusElement = documentRow.locator('text=/completed|processing|pending|failed/i');
    return await statusElement.textContent();
  }

  async waitForDocumentStatus(filename: string, status: string, timeout = 60000) {
    // Poll for status changes
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const currentStatus = await this.getDocumentStatus(filename);
        if (currentStatus?.toLowerCase().includes(status.toLowerCase())) {
          return;
        }
        await this.page.waitForTimeout(1000);
      } catch (error) {
        await this.page.waitForTimeout(1000);
      }
    }
    
    throw new Error(`Document status "${status}" not reached within ${timeout}ms`);
  }

  async deleteDocument(filename: string) {
    // Find the delete button for this document
    const documentRow = this.page.getByText(filename).locator('..');
    const deleteButton = documentRow.locator('button').filter({ hasText: '' }); // Delete button is icon-only
    await deleteButton.click();
    
    // Confirm deletion if prompted
    try {
      await this.page.waitForSelector('text=/are you sure/i', { timeout: 2000 });
      await this.page.getByRole('button', { name: /delete|confirm/i }).click();
    } catch (error) {
      // No confirmation dialog, proceed
    }
  }

  async expectDocumentNotVisible(filename: string) {
    await expect(this.page.getByText(filename)).not.toBeVisible();
  }
}

export class ChatPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/chat');
  }

  async selectDocument(filename: string) {
    // Click on document in the picker
    const documentButton = this.page.getByText(filename).locator('..');
    await documentButton.click();
  }

  async sendQuestion(question: string) {
    // Type in chat input and send
    await this.page.getByPlaceholder(/ask a question|type your message/i).fill(question);
    await this.page.getByRole('button', { name: /send/i }).click();
  }

  async expectStreamingResponse() {
    // Wait for assistant message to appear
    await expect(
      this.page.locator('text').filter({ hasText: /.+/ }).last()
    ).toBeVisible();
  }

  async waitForStreamingComplete(timeout = 30000) {
    // Wait for streaming to stop - check if isProcessing is done
    // Since we don't have data-testid, we'll wait a reasonable time
    await this.page.waitForTimeout(5000);
  }

  async getLastAssistantMessage() {
    // Get all text messages and find the last assistant message
    const messages = await this.page.locator('.space-y-4 > div').all();
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const text = await message.textContent();
      if (text && text.trim() && !text.includes('Start a conversation')) {
        return text.trim();
      }
    }
    
    return '';
  }

  async expectConnectionStatus(expectedStatus: 'Connected' | 'Disconnected') {
    await expect(
      this.page.getByText(expectedStatus)
    ).toBeVisible();
  }
}
