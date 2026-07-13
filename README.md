# Gmail AI Reply Agent

Gmail AI Reply Agent is a Chrome extension for reading Gmail threads, generating professional replies, creating Gmail drafts, and safely handling selected low-risk emails automatically.

The extension combines Gmail OAuth, a local Node.js backend, and the OpenAI Responses API. It is designed as a personal assistant: you remain in control of important decisions, while routine acknowledgements can be drafted or sent according to your selected safety mode.

## Main features

- Connects to Gmail through Google OAuth.
- Displays unread inbox messages.
- Refreshes the inbox and loads additional emails.
- Opens and displays complete Gmail threads.
- Generates editable professional replies.
- Supports personal tone, length, name, role, and signature settings.
- Supports a custom instruction for an individual reply.
- Detects potentially risky email topics.
- Creates threaded Gmail drafts.
- Prevents duplicate drafts for the same thread.
- Opens Gmail Drafts directly.
- Checks for new messages approximately every 30 seconds.
- Uses Gmail history synchronization for efficient background checks.
- Provides Dry Run and controlled Auto Send modes.
- Blocks automated messages, mailing lists, reply loops, and unsafe auto-sends.
- Limits automatic sending to five messages per day.
- Saves uncertain or higher-risk reply-worthy messages as drafts for review.

## Requirements

Before using the agent, make sure you have:

- Google Chrome 120 or later.
- Node.js 20 LTS or later recommended.
- npm, which is included with Node.js.
- A Gmail or Google Workspace account authorized for the extension's OAuth client.
- An OpenAI API key with available API usage.
- Internet access for Gmail and OpenAI API requests.
- The project folder downloaded to your computer.

The backend must remain running on your computer while you generate AI replies or use the Automatic Reply Agent.

## Project layout

The two important folders for users are:

- extension ? the unpacked Chrome extension.
- backend ? the local API that communicates with OpenAI.

The backend runs at:

~~~text
http://localhost:3000
~~~

## 1. Install the backend

Open PowerShell, Command Prompt, or another terminal and move into the backend folder:

~~~powershell
cd "path\to\gmail-ai-reply-agent\backend"
~~~

Install the existing dependencies:

~~~powershell
npm install
~~~

This installs Express, CORS, dotenv, and the OpenAI JavaScript SDK defined by the project.

## 2. Configure the OpenAI API key

Inside the backend folder, create a file named .env.

Add your OpenAI API key:

~~~env
OPENAI_API_KEY=your_openai_api_key_here
~~~

Optional settings:

~~~env
PORT=3000
OPENAI_MODEL=gpt-5.6-terra
OPENAI_CLASSIFIER_MODEL=gpt-5.6-luna
OPENAI_REPLY_MODEL=gpt-5.6-terra
~~~

Only OPENAI_API_KEY is required. The model variables already have defaults.

Security rules:

- Never share your API key.
- Never paste it into the Chrome popup.
- Never place it in extension/manifest.json or any frontend file.
- Do not commit the .env file to source control.
- Revoke and replace the key immediately if it is exposed.

## 3. Start the backend

From the backend folder, run:

~~~powershell
npm start
~~~

For development with automatic server restart:

~~~powershell
npm run dev
~~~

A successful start displays:

~~~text
Backend running at http://localhost:3000
~~~

You can verify the backend by opening this address in Chrome:

~~~text
http://localhost:3000/health
~~~

A successful response reports that the backend is running.

Keep this terminal window open while using AI reply features. Closing it stops manual generation and automatic classification.

## 4. Install the Chrome extension

1. Open Chrome.
2. Go to chrome://extensions.
3. Enable Developer mode in the upper-right corner.
4. Select Load unpacked.
5. Choose the gmail-ai-reply-agent/extension folder.
6. Confirm that Gmail AI Reply Agent appears in the extension list.
7. Pin the extension from Chrome's Extensions menu for easier access.

Always select the extension folder itself, not the project root or backend folder.

After changing extension files or updating the project, return to chrome://extensions and select Reload on the extension card.

## 5. Connect Gmail

1. Open the Gmail AI Reply Agent popup.
2. Select Connect Gmail.
3. Choose the Google account you want the extension to manage.
4. Review and approve the requested permissions.
5. Return to the popup and confirm the connected status.

The extension requests these Gmail permissions:

- gmail.readonly ? read inbox messages and complete threads.
- gmail.compose ? create Gmail drafts and send controlled replies.

The extension does not request gmail.modify.

If Google reports that access is blocked or the app is in testing mode, the Google account must be added as an authorized test user by the OAuth project administrator. Ordinary users cannot correct an OAuth client configuration problem from the popup.

## 6. Configure Personal Reply Settings

Before generating replies, configure how the agent should write.

Available settings include:

- Tone ? controls how formal, friendly, concise, or professional the reply sounds.
- Length ? chooses short, medium, or detailed replies.
- Name ? the name used when writing on your behalf.
- Role ? optional professional title or role.
- Signature ? the exact signature included at the end of generated replies.

Select Save Settings after making changes.

Recommended first-time setup:

1. Enter your real name.
2. Add your role only if it should appear in professional context.
3. Use a signature you are comfortable placing on every generated reply.
4. Start with a professional tone and medium or short length.
5. Generate several manual replies before enabling automatic sending.

The automatic reply generator requires the configured signature exactly once. This helps prevent missing or duplicated signatures.

## 7. Check and read inbox messages

Use the inbox controls in the popup:

- Check Inbox ? loads unread inbox messages.
- Refresh Inbox ? starts a fresh inbox query.
- Load More Emails ? retrieves the next available page.
- Read Email ? hides the unread list and opens the complete selected Gmail thread.
- Close ? returns from the thread view to the unread inbox list.

Only unread inbox messages are used by the automatic workflow. Messages that are no longer unread or no longer in the inbox are skipped safely.

## 8. Generate a manual AI reply

To generate a reply manually:

1. Select Check Inbox.
2. Open an email with Read Email.
3. Review the subject, sender, and complete thread.
4. Optionally enter a Custom Reply Instruction.
5. Select Generate AI Reply.
6. Wait for the generated reply to appear.
7. Read and edit the reply carefully.
8. Review any local risk warning.
9. Confirm manual review when requested.
10. Select Create Gmail Draft.
11. Open Gmail Drafts to make final changes or send from Gmail.

The generated reply remains editable. Always verify names, dates, amounts, availability, promises, links, and factual claims before sending.

Examples of useful custom instructions:

- Keep the reply under four sentences.
- Ask for the missing project deadline.
- Reply in Urdu.
- Confirm receipt only; do not promise a completion date.
- Politely decline without providing a detailed reason.

Custom instructions should not be used to bypass safety warnings or invent facts.

## 9. Email risk detection

The popup can flag messages involving sensitive or consequential topics, including:

- Payments, invoices, refunds, or banking.
- Contracts or legal matters.
- Passwords, OTPs, credentials, or security.
- Meetings, schedules, or availability.
- Deadlines and commitments.
- Complaints or cancellation requests.
- Salary, employment, or job offers.
- Personal or sensitive information.
- Attachments requiring review.

A risk warning does not necessarily mean the email is malicious. It means the reply deserves human review before a draft is created or sent.

The agent must never be treated as a replacement for legal, financial, security, or business approval.

## 10. Automatic Reply Agent

The Automatic Reply Agent checks for recent Gmail changes approximately every 30 seconds while Chrome allows the extension's background worker to run.

Chrome alarms are approximate. A sleeping computer, suspended Chrome session, lost network connection, expired authentication, or stopped backend can delay a check.

### Enable or disable

Use the Enabled checkbox in the Automatic Reply Agent card.

When disabled:

- Background checks do not classify or reply to messages.
- Manual inbox and manual reply features continue to work.

### Check New Emails Now

Select Check New Emails Now to start an immediate automation run.

The popup displays:

- Check interval.
- Last automatic check.
- Last result summary.
- Current status.

If the backend is offline, the popup displays an error and the message remains eligible for a later retry.

## 11. Dry Run mode

Dry Run is the recommended starting mode.

In Dry Run:

- The agent detects new unread messages.
- Automated, bulk, spam, and no-reply messages are ignored.
- Reply-worthy messages can be classified and given a professional reply.
- Generated replies are saved as Gmail drafts.
- Nothing is automatically sent.

Use Dry Run for several days before considering Auto Send. Review created drafts to confirm that your tone, signature, and instructions are correct.

## 12. Auto Send mode

Auto Send allows only a narrow group of clearly understood, low-risk messages to be sent automatically.

Potentially allowed categories are:

- Acknowledgement.
- Thank-you, when a response is socially useful.
- Received-message confirmation.
- Simple confirmation based on facts already present in the thread.

Auto-send requires all safety conditions to pass, including:

- Automatic Reply Agent is enabled.
- Mode is Auto Send.
- The classifier recommends auto-send.
- The email is low risk.
- Classification confidence is at least 0.97.
- No human decision is required.
- No important information is missing.
- No attachment is present.
- No blocked topic or automated header is detected.
- The sender is not the connected user.
- The recipient is safe and verifiable.
- No existing draft or processed record exists.
- The daily send limit has not been reached.
- The generated reply passes deterministic quality checks.

The AI model cannot send a message by itself. JavaScript safety rules make the final decision.

## 13. Messages that are not auto-sent

The following normally become a draft or require manual review:

- Meeting requests.
- Availability questions.
- Project questions requiring a personal decision.
- Deadlines or new commitments.
- Payments, invoices, refunds, or cancellations.
- Contracts or legal emails.
- Security or credential-related messages.
- Complaints.
- Job offers, salary discussions, or sensitive personal messages.
- Emails with attachments.
- Unclear messages.
- Replies containing unsupported promises or dates.
- Generated replies that fail quality validation.

Spam, newsletters, marketing mail, automated notifications, mailing lists, delivery failures, and no-reply senders normally receive no reply.

## 14. Daily automatic-send limit

The extension permits no more than five automatic sends per day.

When the limit is reached:

- No additional email is auto-sent.
- A reply-worthy message can be saved as a Gmail draft.
- Draft creation does not count toward the send limit.

The limit is intentionally strict and is not configurable from the popup.

## 15. Duplicate and reply-loop prevention

The extension uses several protections:

- Every processed incoming Gmail message ID is recorded locally.
- Existing Gmail drafts are checked by thread.
- A second draft is not created for the same thread when one already exists.
- Automatically generated replies include a private loop-prevention header.
- Messages containing that header are ignored.
- Self-sent messages are skipped.
- Automated sender and mailing-list headers are checked before AI classification.
- Only the latest 500 processed metadata records are retained.

If an operation fails temporarily, the message is not permanently marked as processed and can be retried.

## 16. How new messages are detected

The extension uses Gmail history synchronization rather than repeatedly scanning the entire mailbox.

On initial synchronization:

1. It obtains the current Gmail history ID.
2. It performs one bounded query for recent unread inbox messages.
3. It stores synchronization metadata locally.

On later checks:

1. It requests newly added inbox messages from Gmail history.
2. It processes only unique candidates.
3. It skips previously processed or ineligible messages.
4. It updates the history ID after a successful run.

A bounded reconciliation of recent unread messages runs at most once every 15 minutes. If Gmail reports that an old history ID has expired, the extension performs this reconciliation and stores a fresh history ID.

The reconciliation query is limited to recent unread inbox mail from approximately the last day; it does not scan the complete mailbox.

## 17. Privacy and data handling

Email processing requires sending relevant thread content from Chrome to the local backend and then to OpenAI for classification or reply generation.

The extension is designed so that:

- Gmail access tokens are managed through Chrome Identity.
- Gmail tokens are not stored in extension local storage.
- OpenAI API keys stay in the backend .env file.
- Raw email bodies and complete generated replies are not saved in automation history.
- Automation history contains only outcome metadata and timing information.
- Email bodies are not written to application logs.
- Automatic OpenAI requests use store: false.
- Thread content is limited before automatic AI requests to reduce unnecessary data transfer.

Saved local information can include reply settings, automation settings, Gmail draft references, processed message IDs, categories, risk levels, timestamps, and run summaries.

Your use of Gmail and OpenAI remains subject to their respective privacy policies, account settings, and API terms. Do not process confidential email unless your organization's policies permit it.

## 18. Security recommendations

- Use Dry Run first.
- Keep the backend accessible only on your trusted computer.
- Do not expose port 3000 publicly.
- Do not forward the local backend through a public tunnel.
- Protect the operating-system account that contains the .env file.
- Review Gmail account access regularly.
- Revoke the extension's Google access if the computer is lost.
- Rotate the OpenAI key if unauthorized usage appears.
- Monitor OpenAI API usage and billing limits.
- Keep Chrome and Node.js updated.
- Review drafts before sending high-impact replies.
- Never use automatic replies for legal acceptance, payments, credentials, or emergencies.

## 19. Troubleshooting

### The popup says it cannot reach localhost:3000

Check that:

1. A terminal is open in the backend folder.
2. npm install completed successfully.
3. npm start is still running.
4. The backend reports http://localhost:3000.
5. http://localhost:3000/health opens successfully.
6. A firewall or security tool is not blocking Node.js.

Restart the backend after changing .env.

### OPENAI_API_KEY is missing

Confirm that:

- The file is named exactly .env.
- It is inside gmail-ai-reply-agent/backend.
- The key is written as OPENAI_API_KEY= followed by the key.
- There are no unnecessary quotes or spaces.
- The backend was restarted after creating the file.

### OpenAI returns rate-limit or quota errors

Check your OpenAI API account, billing, project limits, and key permissions. Temporary failures remain retryable, but the backend must have working API access before generation can succeed.

### Gmail does not connect

Try these steps:

1. Confirm you are using Chrome 120 or later.
2. Reload the extension at chrome://extensions.
3. Open the popup and connect again.
4. Sign in to the intended Google account.
5. Confirm the OAuth consent screen.
6. Ask the OAuth administrator to add your account as a test user if the app is restricted.

### Check Inbox shows no messages

Confirm that:

- Gmail is connected.
- The inbox contains unread messages.
- The messages are in the Inbox label.
- You selected Refresh Inbox.
- The Google account in Chrome matches the connected account.

### Read Email or thread loading fails

Reload the extension, reconnect Gmail, and try the message again. If the message was moved, deleted, or access was revoked, Gmail may no longer return the thread.

### Generate AI Reply fails

Confirm that:

- The backend is running.
- The OpenAI key is valid.
- Your OpenAI account has available quota.
- Personal Reply Settings contain a valid signature.
- The selected email thread contains at least one message.

Review the backend terminal for a non-sensitive error message.

### No automatic messages are being sent

This can be expected. Verify that:

- Automatic Reply Agent is enabled.
- Auto Send, not Dry Run, is selected.
- The backend remains running.
- The email is unread and in the inbox.
- The sender is not automated.
- The message is one of the narrow low-risk categories.
- Confidence reached 0.97.
- No attachment, missing decision, blocked topic, or existing draft was found.
- The daily limit of five has not been reached.

Most business decisions should become drafts rather than automatic sends.

### Duplicate draft was not created

This is intentional when a Gmail draft already exists for that thread. Open Gmail Drafts and edit the existing draft.

### Last check is delayed

Chrome alarms are approximate. Chrome may suspend background work when the browser or computer sleeps. Use Check New Emails Now after reopening Chrome.

### Extension changes do not appear

1. Open chrome://extensions.
2. Select Reload on Gmail AI Reply Agent.
3. Close and reopen the popup.
4. If needed, refresh any open Gmail tab.

### View background-worker errors

For advanced troubleshooting:

1. Open chrome://extensions.
2. Find Gmail AI Reply Agent.
3. Select the service-worker inspection link.
4. Review errors without sharing tokens, API keys, or email content.

## 20. Update the agent

When you receive a newer project version:

1. Stop the backend with Ctrl+C.
2. Replace or update the project files.
3. Open the backend folder.
4. Run npm install to synchronize existing dependencies.
5. Run npm start.
6. Open chrome://extensions.
7. Reload Gmail AI Reply Agent.
8. Reopen the popup and confirm Gmail connection and settings.
9. Test one manual reply.
10. Test Dry Run before enabling Auto Send again.

## 21. Stop or remove the agent

To stop AI processing temporarily:

- Disable Automatic Reply Agent in the popup, or
- Stop the backend with Ctrl+C.

To remove the extension:

1. Open chrome://extensions.
2. Find Gmail AI Reply Agent.
3. Select Remove.
4. Revoke its Google account access if you no longer intend to use it.
5. Delete the local project folder and .env file when appropriate.
6. Revoke the OpenAI API key if it will no longer be used.

Removing the extension clears its local Chrome extension storage.

## Frequently asked questions

### Does the extension send every email automatically?

No. Auto Send is limited to a small allowlist of low-risk messages and requires every deterministic safety condition to pass.

### Can I use only manual reply generation?

Yes. Leave Automatic Reply Agent disabled and use Check Inbox, Read Email, Generate AI Reply, and Create Gmail Draft manually.

### Can I use automation without automatic sending?

Yes. Enable the agent and select Dry Run. Reply-worthy messages are saved as drafts.

### Does the backend need to stay open?

Yes. AI classification and generation depend on the local backend at localhost:3000.

### Can it answer meeting or availability requests automatically?

No, unless an exact decision is already explicitly verified and all safety rules pass. The current conservative workflow normally creates a draft or manual-review status.

### Will it send passwords or OTPs?

No safe workflow should send or repeat credentials automatically. Security-related messages are treated as high risk.

### Why was a thank-you email ignored?

A reply is not always socially useful. The classifier avoids endless thank-you reply loops.

### Why did a simple email become a draft?

A draft is used whenever confidence, context, category, recipient verification, safety rules, or reply validation does not support automatic sending.

### Where are drafts saved?

Drafts are created in the connected Gmail account and are available under Gmail Drafts.

### Does it work when Chrome is closed?

Background timing is not guaranteed when Chrome is closed or the computer is sleeping. Run Chrome and keep the local backend available for reliable checks.

### Is the 30-second check exact?

No. Chrome schedules extension alarms approximately. It can run later depending on browser and system conditions.

## Recommended safe first run

1. Start the backend.
2. Load and pin the extension.
3. Connect Gmail.
4. Save your name, tone, length, and signature.
5. Check Inbox.
6. Read one email.
7. Generate and edit a manual reply.
8. Create a Gmail draft and review it in Gmail.
9. Enable Automatic Reply Agent in Dry Run.
10. Review automatic drafts for several days.
11. Enable Auto Send only if you understand and accept the safety boundaries.

## License

See LICENSE for the project's license terms.

