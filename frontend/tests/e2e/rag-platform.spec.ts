/* E2E tests for SmartDocs RAG Platform */

import { test, expect } from '@playwright/test';
import { LoginPage, DocumentsPage, ChatPage } from './page-objects';
import path from 'path';

test.describe('SmartDocs RAG Platform E2E Tests', () => {
  let loginPage: LoginPage;
  let documentsPage: DocumentsPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    documentsPage = new DocumentsPage(page);
    chatPage = new ChatPage(page);
  });

  test('Document upload flow - upload → processing → completed', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to documents page
    await documentsPage.goto();

    // Upload a document
    const samplePdf = path.join(__dirname, '..', '..', '..', 'backend', 'tests', 'fixtures', 'sample.pdf');
    await documentsPage.uploadDocument(samplePdf);

    // Verify document appears in list
    await documentsPage.expectDocumentVisible('sample.pdf');

    // Monitor processing status
    // Status should transition from pending → processing → completed
    try {
      await documentsPage.waitForDocumentStatus('sample.pdf', 'completed', 60000);
      console.log('Document processing completed successfully');
    } catch (error) {
      console.log('Document processing timed out, checking final status...');
      const finalStatus = await documentsPage.getDocumentStatus('sample.pdf');
      console.log('Final status:', finalStatus);
      throw error;
    }

    // Verify final status is completed
    const finalStatus = await documentsPage.getDocumentStatus('sample.pdf');
    expect(finalStatus?.toLowerCase()).toContain('completed');
  });

  test('Chat with document - ask question and receive streaming response', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to chat page
    await chatPage.goto();

    // Wait for connection
    await chatPage.expectConnectionStatus('Connected');

    // Check if document is available (assuming document exists from previous test)
    // Skip if no documents are available
    const documentsList = await page.locator('text=No documents uploaded yet').all();
    if (documentsList.length > 0) {
      console.log('No documents available, skipping chat test');
      return;
    }

    // Select a document
    await chatPage.selectDocument('sample.pdf');

    // Send a question
    await chatPage.sendQuestion('What is in this document?');

    // Verify streaming response starts
    await chatPage.expectStreamingResponse();

    // Wait for streaming to complete
    await chatPage.waitForStreamingComplete();

    // Verify response was generated
    const response = await chatPage.getLastAssistantMessage();
    expect(response?.length).toBeGreaterThan(0);
    console.log('Assistant response:', response);
  });

  test('Document status updates during ingestion', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to documents page
    await documentsPage.goto();

    // Upload document
    const samplePdf = path.join(__dirname, '..', '..', '..', 'backend', 'tests', 'fixtures', 'sample.pdf');
    await documentsPage.uploadDocument(samplePdf);

    // Poll for status updates
    const startTime = Date.now();
    const maxWaitTime = 60000; // 60 seconds
    const pollInterval = 1000; // 1 second
    
    let previousStatus = '';
    let statusChanges = 0;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const currentStatus = await documentsPage.getDocumentStatus('sample.pdf');
        
        if (currentStatus && currentStatus !== previousStatus) {
          console.log(`Status changed: ${previousStatus} → ${currentStatus}`);
          previousStatus = currentStatus;
          statusChanges++;
        }

        if (currentStatus?.toLowerCase().includes('completed')) {
          break;
        }

        await page.waitForTimeout(pollInterval);
      } catch (error) {
        await page.waitForTimeout(pollInterval);
      }
    }

    // Verify status changed at least once
    expect(statusChanges).toBeGreaterThan(0);
  });

  test('Document deletion removes from list', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to documents page
    await documentsPage.goto();

    // Upload document first
    const samplePdf = path.join(__dirname, '..', '..', '..', 'backend', 'tests', 'fixtures', 'sample.pdf');
    await documentsPage.uploadDocument(samplePdf);
    await documentsPage.expectDocumentVisible('sample.pdf');

    // Wait for processing to complete (or at least for document to be ready)
    try {
      await documentsPage.waitForDocumentStatus('sample.pdf', 'completed', 30000);
    } catch (error) {
      console.log('Document processing not complete, proceeding with deletion anyway');
    }

    // Delete document
    await documentsPage.deleteDocument('sample.pdf');

    // Verify document is removed from list
    await documentsPage.expectDocumentNotVisible('sample.pdf');
  });

  test('WebSocket connection status indicator', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to chat page
    await chatPage.goto();

    // Verify connection status is shown
    await chatPage.expectConnectionStatus('Connected');
  });

  test('Upload validation - reject non-PDF files', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to documents page
    await documentsPage.goto();

    // Try to upload a non-PDF file (create a temporary text file)
    const tempTextFile = path.join(__dirname, 'temp-test.txt');
    
    try {
      // Create a temporary text file
      const fs = await import('fs');
      fs.writeFileSync(tempTextFile, 'This is a text file');

      // Try to upload it - should fail or show alert
      const fileInput = page.locator('input[type="file"][accept=".pdf"]');
      await fileInput.setInputFiles(tempTextFile);

      // Check for alert or error message
      // The upload should be rejected
      await page.waitForTimeout(2000);
      
      // Verify document was not added (no text document in list)
      const documentsList = await page.getByText('temp-test.txt').all();
      expect(documentsList.length).toBe(0);

    } finally {
      // Clean up temp file
      try {
        const fs = await import('fs');
        fs.unlinkSync(tempTextFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('Document picker shows document status', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to documents page
    await documentsPage.goto();

    // Upload a document
    const samplePdf = path.join(__dirname, '..', '..', '..', 'backend', 'tests', 'fixtures', 'sample.pdf');
    await documentsPage.uploadDocument(samplePdf);
    await documentsPage.expectDocumentVisible('sample.pdf');

    // Verify status is displayed
    const status = await documentsPage.getDocumentStatus('sample.pdf');
    expect(status).toBeTruthy();
    console.log('Document status:', status);
  });

  test('Multiple messages in conversation', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('test@example.com', 'testpassword123');
    await loginPage.expectLoggedIn();

    // Navigate to chat page
    await chatPage.goto();

    // Check if documents are available
    const documentsList = await page.locator('text=No documents uploaded yet').all();
    if (documentsList.length > 0) {
      console.log('No documents available, skipping multi-message test');
      return;
    }

    // Select document
    await chatPage.selectDocument('sample.pdf');

    // Send first question
    await chatPage.sendQuestion('What is this about?');
    await chatPage.waitForStreamingComplete();

    // Send second question
    await chatPage.sendQuestion('Tell me more');
    await chatPage.waitForStreamingComplete();

    // Verify conversation has multiple messages
    const chatContainer = page.locator('.space-y-4');
    const messages = await chatContainer.locator('> div').count();
    
    expect(messages).toBeGreaterThanOrEqual(2);
  });
});
