const AUTO_REPLY_ALARM =
    "gmail-ai-auto-reply-check";

const AUTO_REPLY_INTERVAL_MINUTES =
    0.5;

const FULL_RECONCILIATION_INTERVAL_MS =
    15 * 60 * 1000;

const HISTORY_PAGE_LIMIT = 10;
const PROCESSING_CONCURRENCY = 2;
const MAX_PROCESSED_RECORDS = 500;

const DAILY_AUTO_SEND_LIMIT =
    5;

const SAFE_AUTO_SEND_CATEGORIES =
    new Set([
        "acknowledgement",
        "thank_you",
        "received_message",
        "simple_confirmation"
    ]);

const BLOCKED_KEYWORDS = [
    "payment",
    "invoice",
    "bank",
    "iban",
    "swift",
    "contract",
    "agreement",
    "legal",
    "password",
    "otp",
    "security code",
    "refund",
    "cancel",
    "salary",
    "job offer",
    "deadline",
    "available",
    "availability",
    "meeting",
    "urgent",
    "attachment",
    "commit",
    "promise"
];

let autoReplyCheckRunning = false;

chrome.runtime.onInstalled.addListener(
    (details) => {
        console.log(
            "Gmail AI Reply Agent installed:",
            details.reason
        );

        ensureAutoReplyAlarm().catch(
            (error) => {
                console.error(
                    "Auto-reply alarm setup error:",
                    error
                );
            }
        );
    }
);
chrome.runtime.onStartup.addListener(
    () => {
        ensureAutoReplyAlarm().catch(
            (error) => {
                console.error(
                    "Auto-reply alarm startup error:",
                    error
                );
            }
        );
    }
);

ensureAutoReplyAlarm().catch(
    (error) => {
        console.error(
            "Auto-reply alarm initialization error:",
            error
        );
    }
);

chrome.alarms.onAlarm.addListener(
    async (alarm) => {
        if (
            alarm.name !==
            AUTO_REPLY_ALARM
        ) {
            return;
        }

        try {
            await runAutomaticReplyCheck();
        } catch (error) {
            console.error(
                "Automatic email check error:",
                error
            );
        }
    }
);

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (
            message?.type !==
            "RUN_AUTO_REPLY_CHECK"
        ) {
            return;
        }

        runAutomaticReplyCheck()
            .then((result) => {
                sendResponse({
                    success: true,
                    ...result
                });
            })
            .catch((error) => {
                sendResponse({
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Automatic check failed."
                });
            });

        return true;
    }
);

async function ensureAutoReplyAlarm() {
    const existing =
        await chrome.alarms.get(
            AUTO_REPLY_ALARM
        );

    const periodMatches =
        existing &&
        Math.abs(
            Number(existing.periodInMinutes) -
            AUTO_REPLY_INTERVAL_MINUTES
        ) < 0.001;

    if (!periodMatches) {
        if (existing) {
            await chrome.alarms.clear(
                AUTO_REPLY_ALARM
            );
        }
        await chrome.alarms.create(
            AUTO_REPLY_ALARM,
            {
                delayInMinutes:
                    AUTO_REPLY_INTERVAL_MINUTES,
                periodInMinutes:
                    AUTO_REPLY_INTERVAL_MINUTES
            }
        );
    }
}

function getStoredObject(value) {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return {};
    }

    return value;
}

function getAccessTokenValue(authResult) {
    if (typeof authResult === "string") {
        return authResult;
    }

    return authResult?.token;
}

async function getGmailAccessToken() {
    const authResult =
        await chrome.identity.getAuthToken({
            interactive: false
        });

    const accessToken =
        getAccessTokenValue(authResult);

    if (!accessToken) {
        throw new Error(
            "Gmail access token is unavailable."
        );
    }

    return accessToken;
}

async function gmailRequest(
    accessToken,
    url,
    options = {}
) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization:
                "Bearer " + accessToken
        }
    });

    const data =
        await response.json().catch(
            () => null
        );

    if (!response.ok) {
        const gmailError = new Error(
            data?.error?.message ||
            "Gmail request failed."
        );
        gmailError.status = response.status;
        throw gmailError;
    }

    return data || {};
}

async function listUnreadInboxMessages(
    accessToken
) {
    const parameters =
        new URLSearchParams();

    parameters.set(
        "q",
        "is:unread in:inbox -from:me newer_than:1d"
    );

    parameters.set(
        "maxResults",
        "25"
    );

    const data =
        await gmailRequest(
            accessToken,
            "https://gmail.googleapis.com/" +
            "gmail/v1/users/me/messages?" +
            parameters.toString()
        );

    return Array.isArray(data.messages)
        ? data.messages
        : [];
}

async function fetchGmailProfile(
    accessToken
) {
    return gmailRequest(
        accessToken,
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/profile"
    );
}

async function listAddedHistoryMessages(
    accessToken,
    startHistoryId
) {
    const messageIds = new Set();
    let pageToken = null;
    let newestHistoryId =
        String(startHistoryId);
    let pagesRead = 0;

    do {
        const parameters =
            new URLSearchParams();

        parameters.set(
            "startHistoryId",
            String(startHistoryId)
        );
        parameters.set(
            "historyTypes",
            "messageAdded"
        );
        parameters.set(
            "labelId",
            "INBOX"
        );
        parameters.set(
            "maxResults",
            "100"
        );

        if (pageToken) {
            parameters.set(
                "pageToken",
                pageToken
            );
        }

        const data =
            await gmailRequest(
                accessToken,
                "https://gmail.googleapis.com/" +
                "gmail/v1/users/me/history?" +
                parameters.toString()
            );

        for (const history of data.history || []) {
            for (
                const addedMessage of
                history.messagesAdded || []
            ) {
                if (addedMessage.message?.id) {
                    messageIds.add(
                        addedMessage.message.id
                    );
                }
            }
        }

        newestHistoryId =
            String(
                data.historyId ||
                newestHistoryId
            );
        pageToken =
            data.nextPageToken || null;
        pagesRead += 1;
    } while (
        pageToken &&
        pagesRead < HISTORY_PAGE_LIMIT
    );

    if (pageToken) {
        const error = new Error(
            "Gmail history pagination exceeded the safety limit."
        );
        error.transient = true;
        throw error;
    }

    return {
        messageIds: [...messageIds],
        newestHistoryId
    };
}

async function fetchFullMessage(
    accessToken,
    messageId
) {
    return gmailRequest(
        accessToken,
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/messages/" +
        encodeURIComponent(messageId) +
        "?format=full"
    );
}

async function fetchCompleteThread(
    accessToken,
    threadId
) {
    return gmailRequest(
        accessToken,
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/threads/" +
        encodeURIComponent(threadId) +
        "?format=full"
    );
}

function getEmailHeader(
    headers,
    headerName
) {
    const safeHeaders =
        Array.isArray(headers)
            ? headers
            : [];

    const header =
        safeHeaders.find(
            (item) =>
                String(item?.name || "")
                    .toLowerCase() ===
                headerName.toLowerCase()
        );

    return header?.value || "";
}

function decodeBase64Url(value) {
    if (!value) {
        return "";
    }

    try {
        const normalized =
            value
                .replace(/-/g, "+")
                .replace(/_/g, "/");

        const padding =
            "=".repeat(
                (
                    4 -
                    normalized.length % 4
                ) % 4
            );

        const binary =
            atob(normalized + padding);

        const bytes =
            Uint8Array.from(
                binary,
                (character) =>
                    character.charCodeAt(0)
            );

        return new TextDecoder(
            "utf-8"
        ).decode(bytes);
    } catch {
        return "";
    }
}

function collectMessageParts(
    payload,
    mimeType,
    results
) {
    if (!payload) {
        return;
    }

    if (
        payload.mimeType === mimeType &&
        payload.body?.data &&
        !payload.filename
    ) {
        results.push(
            decodeBase64Url(
                payload.body.data
            )
        );
    }

    for (
        const part of payload.parts || []
    ) {
        collectMessageParts(
            part,
            mimeType,
            results
        );
    }
}

function htmlToPlainText(value) {
    return String(value || "")
        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function extractMessageBody(payload) {
    const plainTextParts = [];

    collectMessageParts(
        payload,
        "text/plain",
        plainTextParts
    );

    if (plainTextParts.length > 0) {
        return plainTextParts
            .filter(Boolean)
            .join("\n")
            .trim();
    }

    const htmlParts = [];

    collectMessageParts(
        payload,
        "text/html",
        htmlParts
    );

    if (htmlParts.length > 0) {
        return htmlToPlainText(
            htmlParts.join("\n")
        );
    }

    if (payload?.body?.data) {
        const body =
            decodeBase64Url(
                payload.body.data
            );

        return payload.mimeType ===
            "text/html"
            ? htmlToPlainText(body)
            : body.trim();
    }

    return "";
}

function payloadHasAttachment(payload) {
    if (!payload) {
        return false;
    }

    if (
        String(payload.filename || "")
            .trim() ||
        payload.body?.attachmentId
    ) {
        return true;
    }

    return (payload.parts || []).some(
        (part) =>
            payloadHasAttachment(part)
    );
}

function createBackendThreadMessages(thread) {
    const messages =
        Array.isArray(thread?.messages)
            ? thread.messages
            : [];

    return messages.map((message) => {
        const headers =
            message.payload?.headers || [];

        return {
            subject:
                getEmailHeader(
                    headers,
                    "Subject"
                ) || "No subject",
            from:
                getEmailHeader(
                    headers,
                    "From"
                ) || "Unknown sender",
            to:
                getEmailHeader(
                    headers,
                    "To"
                ) || "Unknown recipient",
            date:
                getEmailHeader(
                    headers,
                    "Date"
                ) || "Unknown date",
            body:
                extractMessageBody(
                    message.payload
                ) || "No email body"
        };
    });
}

function isAutomatedSender(sender) {
    const senderText =
        String(sender || "")
            .toLowerCase();

    return (
        senderText.includes("no-reply") ||
        senderText.includes("noreply") ||
        senderText.includes(
            "do-not-reply"
        ) ||
        senderText.includes(
            "do_not_reply"
        ) ||
        senderText.includes(
            "mailer-daemon"
        ) ||
        senderText.includes(
            "donotreply"
        ) ||
        senderText.includes(
            "notifications@"
        )
    );
}

function getAutomatedMessageReason({
    headers,
    sender,
    ownEmail
}) {
    const replyTo =
        getEmailHeader(headers, "Reply-To");
    const autoSubmitted =
        getEmailHeader(
            headers,
            "Auto-Submitted"
        ).toLowerCase();
    const precedence =
        getEmailHeader(
            headers,
            "Precedence"
        ).toLowerCase();
    const returnPath =
        getEmailHeader(
            headers,
            "Return-Path"
        ).toLowerCase();

    if (
        ownEmail &&
        extractEmailAddress(sender)
            .toLowerCase() ===
            String(ownEmail).toLowerCase()
    ) {
        return "self_sent";
    }

    if (
        isAutomatedSender(sender) ||
        isAutomatedSender(replyTo) ||
        returnPath.includes(
            "mailer-daemon"
        )
    ) {
        return "automated_sender";
    }

    if (
        autoSubmitted &&
        autoSubmitted !== "no"
    ) {
        return "auto_submitted";
    }

    if (
        ["bulk", "list", "junk"].includes(
            precedence
        ) ||
        getEmailHeader(headers, "List-Id") ||
        getEmailHeader(
            headers,
            "List-Unsubscribe"
        ) ||
        getEmailHeader(
            headers,
            "X-Auto-Response-Suppress"
        ) ||
        getEmailHeader(headers, "X-Autoreply") ||
        getEmailHeader(headers, "X-Autorespond") ||
        getEmailHeader(
            headers,
            "X-Gmail-AI-Reply-Agent"
        )
    ) {
        return "automated_headers";
    }

    return "";
}

function passesAutoReplySafetyGate({
    decision,
    sender,
    searchableText,
    hasAttachment,
    autoReplySettings,
    blockedHeader,
    existingDraft,
    alreadyProcessed,
    dailyLimitReached
}) {
    const confidence =
        Number(decision?.confidence);
    const missingInformation =
        Array.isArray(
            decision?.missingInformation
        )
            ? decision.missingInformation
            : ["Unvalidated classification"];

    if (
        !autoReplySettings?.enabled ||
        autoReplySettings.mode !==
            "auto_send" ||
        decision?.shouldReply !== true ||
        decision?.shouldAutoSend !== true ||
        decision?.actionRecommendation !==
            "auto_send" ||
        decision?.riskLevel !== "low" ||
        decision?.requiresHumanDecision !==
            false ||
        decision?.isAutomated !== false ||
        decision?.isBulk !== false ||
        decision?.isSpam !== false ||
        !Number.isFinite(confidence) ||
        confidence < 0.97 ||
        confidence > 1 ||
        !SAFE_AUTO_SEND_CATEGORIES.has(
            decision?.category
        ) ||
        missingInformation.length > 0 ||
        hasAttachment ||
        blockedHeader ||
        existingDraft ||
        alreadyProcessed ||
        dailyLimitReached ||
        isAutomatedSender(sender)
    ) {
        return false;
    }

    const normalizedText =
        String(searchableText || "")
            .toLowerCase();

    if (
        BLOCKED_KEYWORDS.some(
            (keyword) =>
                normalizedText.includes(
                    keyword
                )
        )
    ) {
        return false;
    }

    if (
        decision.category ===
            "simple_confirmation" &&
        /\b(?:will|promise|commit|available|availability|meeting|deadline)\b/i
            .test(normalizedText)
    ) {
        return false;
    }

    return true;
}

async function requestAutoReplyDecision({
    subject,
    sender,
    messages,
    settings
}) {
    const response = await fetch(
        "http://localhost:3000/" +
        "api/auto-reply-decision",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                subject,
                sender,
                messages,
                settings
            })
        }
    );

    const data =
        await response.json().catch(
            () => null
        );

    if (
        !response.ok ||
        !data?.success ||
        !data?.decision
    ) {
        const error = new Error(
            data?.error ||
            "The auto-reply backend is unavailable."
        );
        error.transient =
            response.status === 429 ||
            response.status >= 500 ||
            response.status === 0;
        throw error;
    }

    return data.decision;
}

async function requestProfessionalAutoReply({
    subject,
    sender,
    messages,
    settings,
    classification
}) {
    const response = await fetch(
        "http://localhost:3000/" +
        "api/generate-auto-reply",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                subject,
                sender,
                messages,
                settings,
                classification
            })
        }
    );

    const data =
        await response.json().catch(
            () => null
        );

    if (
        !response.ok ||
        !data?.success ||
        typeof data.reply !== "string" ||
        data.validation?.valid !== true
    ) {
        const error = new Error(
            data?.error ||
            "The generated reply did not pass validation."
        );
        error.transient =
            response.status === 429 ||
            response.status >= 500;
        throw error;
    }

    return data.reply.trim();
}

function extractEmailAddress(value) {
    if (!value) {
        return "";
    }

    const match =
        value.match(/<([^>]+)>/);

    return match
        ? match[1].trim()
        : value.trim();
}

function sanitizeEmailHeader(value) {
    return String(value || "")
        .replace(/[\r\n]+/g, " ")
        .trim();
}

function encodeBase64Url(value) {
    const bytes =
        new TextEncoder().encode(value);

    let binary = "";

    for (const byte of bytes) {
        binary +=
            String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createReplyRawMessage({
    recipient,
    subject,
    messageId,
    references,
    reply
}) {
    const combinedReferences = [
        references,
        messageId
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    const headers = [
        "To: " +
            sanitizeEmailHeader(
                recipient
            ),
        "Subject: " +
            sanitizeEmailHeader(
                subject || "Email reply"
            ),
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "X-Gmail-AI-Reply-Agent: true"
    ];

    if (messageId) {
        headers.push(
            "In-Reply-To: " +
            sanitizeEmailHeader(
                messageId
            )
        );
    }

    if (combinedReferences) {
        headers.push(
            "References: " +
            sanitizeEmailHeader(
                combinedReferences
            )
        );
    }

    return encodeBase64Url(
        headers.join("\r\n") +
        "\r\n\r\n" +
        reply.trim()
    );
}

async function fetchExistingDraftsByThread(
    accessToken
) {
    const draftsByThread =
        new Map();

    let pageToken = null;

    do {
        const parameters =
            new URLSearchParams();

        parameters.set(
            "maxResults",
            "100"
        );

        if (pageToken) {
            parameters.set(
                "pageToken",
                pageToken
            );
        }

        const data =
            await gmailRequest(
                accessToken,
                "https://gmail.googleapis.com/" +
                "gmail/v1/users/me/drafts?" +
                parameters.toString()
            );

        for (
            const draft of
            data.drafts || []
        ) {
            const threadId =
                draft.message?.threadId;

            if (threadId) {
                draftsByThread.set(
                    threadId,
                    draft.id
                );
            }
        }

        pageToken =
            data.nextPageToken || null;
    } while (pageToken);

    return draftsByThread;
}

async function createGmailDraft({
    accessToken,
    threadId,
    raw
}) {
    const data =
        await gmailRequest(
            accessToken,
            "https://gmail.googleapis.com/" +
            "gmail/v1/users/me/drafts",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    message: {
                        threadId,
                        raw
                    }
                })
            }
        );

    if (!data.id) {
        throw new Error(
            "Gmail did not return a draft ID."
        );
    }

    return data.id;
}

async function sendGmailReply({
    accessToken,
    threadId,
    raw
}) {
    const data =
        await gmailRequest(
            accessToken,
            "https://gmail.googleapis.com/" +
            "gmail/v1/users/me/messages/send",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    threadId,
                    raw
                })
            }
        );

    if (!data.id) {
        throw new Error(
            "Gmail did not return a sent message ID."
        );
    }

    return data.id;
}

function pruneProcessedMessages(
    processedMessages
) {
    const entries =
        Object.entries(processedMessages);

    if (
        entries.length <=
        MAX_PROCESSED_RECORDS
    ) {
        return;
    }

    entries.sort(
        ([, left], [, right]) =>
            String(
                right?.processedAt || ""
            ).localeCompare(
                String(
                    left?.processedAt || ""
                )
            )
    );

    for (
        const [messageId] of
        entries.slice(
            MAX_PROCESSED_RECORDS
        )
    ) {
        delete processedMessages[
            messageId
        ];
    }
}

async function saveProcessedMessage(
    processedMessages,
    messageId,
    record,
    extraStorage = {}
) {
    processedMessages[messageId] =
        record;

    pruneProcessedMessages(processedMessages);

    await chrome.storage.local.set({
        autoReplyProcessedMessages:
            processedMessages,
        ...extraStorage
    });
}

function createCheckSummary({
    checked,
    draftsCreated,
    autoSent,
    manualReview,
    skipped
}) {
    return {
        message:
            "Checked " +
            checked +
            " new emails: " +
            draftsCreated +
            " draft created, " +
            autoSent +
            " sent, " +
            manualReview +
            " require manual review.",
        checked,
        draftsCreated,
        autoSent,
        manualReview,
        skipped
    };
}

async function collectAutomaticCandidates({
    accessToken,
    lastHistoryId,
    lastFullReconciliationAt
}) {
    const profile =
        await fetchGmailProfile(
            accessToken
        );
    const candidateIds = new Set();
    const now = Date.now();
    const lastFull =
        Date.parse(
            lastFullReconciliationAt || ""
        ) || 0;
    const fullReconciliationDue =
        now - lastFull >=
        FULL_RECONCILIATION_INTERVAL_MS;
    let newestHistoryId =
        String(
            lastHistoryId ||
            profile.historyId ||
            ""
        );
    let completedFullReconciliationAt =
        lastFullReconciliationAt || null;

    const reconcile = async () => {
        const messages =
            await listUnreadInboxMessages(
                accessToken
            );

        for (const message of messages) {
            if (message?.id) {
                candidateIds.add(message.id);
            }
        }

        completedFullReconciliationAt =
            new Date().toISOString();
    };

    if (!lastHistoryId) {
        await reconcile();
    } else {
        try {
            const history =
                await listAddedHistoryMessages(
                    accessToken,
                    lastHistoryId
                );

            for (
                const messageId of
                history.messageIds
            ) {
                candidateIds.add(messageId);
            }

            newestHistoryId =
                history.newestHistoryId;
        } catch (error) {
            if (error?.status !== 404) {
                throw error;
            }

            await reconcile();
            newestHistoryId =
                String(
                    profile.historyId ||
                    lastHistoryId
                );
        }

        if (
            fullReconciliationDue &&
            !completedFullReconciliationAt
        ) {
            await reconcile();
        }
    }

    return {
        candidateIds: [...candidateIds],
        ownEmail:
            String(
                profile.emailAddress || ""
            ).toLowerCase(),
        newestHistoryId,
        completedFullReconciliationAt
    };
}

async function runWithConcurrency(
    items,
    limit,
    worker
) {
    let nextIndex = 0;

    const runNext = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            await worker(items[index]);
        }
    };

    const workerCount = Math.min(
        limit,
        items.length
    );

    await Promise.all(
        Array.from(
            { length: workerCount },
            () => runNext()
        )
    );
}

function createProcessingRecord({
    status,
    decision = {},
    reason,
    detectedAt,
    classifiedAt,
    completedAt,
    processingDurationMs,
    draftId,
    sentMessageId
}) {
    return {
        status,
        category:
            decision.category || "unclear",
        actionRecommendation:
            decision.actionRecommendation ||
            "manual_review",
        riskLevel:
            decision.riskLevel || "high",
        confidence:
            Number(decision.confidence) || 0,
        ...(draftId ? { draftId } : {}),
        ...(sentMessageId
            ? { sentMessageId }
            : {}),
        reason:
            String(reason || "").slice(
                0,
                300
            ),
        detectedAt,
        classifiedAt:
            classifiedAt || null,
        completedAt,
        processingDurationMs,
        processedAt: completedAt
    };
}

async function persistAutomaticRecord(
    state,
    messageId,
    record,
    extraStorage = {}
) {
    state.persistChain =
        state.persistChain.then(
            () =>
                saveProcessedMessage(
                    state.processedMessages,
                    messageId,
                    record,
                    extraStorage
                )
        );

    await state.persistChain;
}

async function processAutomaticCandidate(
    incomingMessageId,
    state
) {
    if (
        !incomingMessageId ||
        state.processedMessages[
            incomingMessageId
        ]
    ) {
        state.counters.skipped += 1;
        return;
    }

    state.counters.checked += 1;

    const startedAt = Date.now();
    const detectedAt =
        new Date().toISOString();
    let classifiedAt = null;
    let threadId = null;
    let threadLocked = false;

    const finish = async (
        status,
        decision,
        reason,
        extra = {}
    ) => {
        const completedAt =
            new Date().toISOString();
        const processingDurationMs =
            Date.now() - startedAt;

        state.durations.push(
            processingDurationMs
        );

        await persistAutomaticRecord(
            state,
            incomingMessageId,
            createProcessingRecord({
                status,
                decision,
                reason,
                detectedAt,
                classifiedAt,
                completedAt,
                processingDurationMs,
                ...extra
            }),
            extra.extraStorage || {}
        );
    };

    try {
        const fullMessage =
            await fetchFullMessage(
                state.accessToken,
                incomingMessageId
            );
        const labelIds =
            Array.isArray(fullMessage.labelIds)
                ? fullMessage.labelIds
                : [];

        if (
            !labelIds.includes("INBOX") ||
            !labelIds.includes("UNREAD") ||
            labelIds.includes("SENT")
        ) {
            state.counters.ignored += 1;
            await finish(
                "ignored",
                {},
                "Message is no longer an unread incoming inbox message."
            );
            return;
        }

        threadId = fullMessage.threadId;

        if (!threadId) {
            throw new Error(
                "The Gmail thread ID is missing."
            );
        }

        if (state.threadLocks.has(threadId)) {
            state.counters.skipped += 1;
            return;
        }

        state.threadLocks.add(threadId);
        threadLocked = true;

        const headers =
            fullMessage.payload?.headers || [];
        const subject =
            getEmailHeader(
                headers,
                "Subject"
            ) || "No subject";
        const sender =
            getEmailHeader(
                headers,
                "From"
            ) || "Unknown sender";
        const automatedReason =
            getAutomatedMessageReason({
                headers,
                sender,
                ownEmail: state.ownEmail
            });

        if (automatedReason) {
            state.counters.ignored += 1;
            await finish(
                "no_reply_needed",
                {
                    category:
                        "automated_notification",
                    actionRecommendation:
                        "no_reply_needed",
                    riskLevel: "high",
                    confidence: 1
                },
                automatedReason
            );
            return;
        }

        const thread =
            await fetchCompleteThread(
                state.accessToken,
                threadId
            );
        const messages =
            createBackendThreadMessages(
                thread
            );
        const hasAttachment =
            payloadHasAttachment(
                fullMessage.payload
            ) ||
            (thread.messages || []).some(
                (message) =>
                    payloadHasAttachment(
                        message.payload
                    )
            );
        const searchableText = [
            subject,
            sender,
            ...messages.map(
                (message) => message.body
            )
        ].join(" ");

        const decision =
            await requestAutoReplyDecision({
                subject,
                sender,
                messages,
                settings:
                    state.replySettings
            });

        classifiedAt =
            new Date().toISOString();
        state.counters.classified += 1;

        const classifierFailedClosed =
            decision.category ===
                "unclear" &&
            decision.riskLevel ===
                "high" &&
            Number(decision.confidence) ===
                0 &&
            decision.requiresHumanDecision ===
                true;

        if (classifierFailedClosed) {
            state.counters.manualReview += 1;
            await finish(
                "manual_review",
                decision,
                decision.reason ||
                "Classification requires manual review."
            );
            return;
        }

        if (
            decision.shouldReply !== true ||
            decision.isAutomated === true ||
            decision.isBulk === true ||
            decision.isSpam === true ||
            ["ignore", "no_reply_needed"]
                .includes(
                    decision.actionRecommendation
                )
        ) {
            state.counters.ignored += 1;
            await finish(
                decision.actionRecommendation ===
                    "ignore"
                    ? "ignored"
                    : "no_reply_needed",
                decision,
                decision.reason ||
                "No reply is needed."
            );
            return;
        }

        const existingDraftId =
            state.gmailDraftsByThread.get(
                threadId
            ) ||
            state.createdDraftsByThread[
                threadId
            ]?.draftId;

        if (existingDraftId) {
            state.counters.manualReview += 1;
            await finish(
                "manual_review",
                decision,
                "An existing Gmail draft already covers this thread."
            );
            return;
        }

        const replyTo =
            getEmailHeader(
                headers,
                "Reply-To"
            );
        const recipient =
            extractEmailAddress(
                replyTo || sender
            );
        const messageIdHeader =
            getEmailHeader(
                headers,
                "Message-ID"
            );
        const references =
            getEmailHeader(
                headers,
                "References"
            );

        if (
            !recipient ||
            !messageIdHeader ||
            recipient.toLowerCase() ===
                state.ownEmail ||
            isAutomatedSender(recipient)
        ) {
            state.counters.manualReview += 1;
            await finish(
                "manual_review",
                decision,
                "A safe threaded reply recipient could not be verified."
            );
            return;
        }

        let reply;

        try {
            reply =
                await requestProfessionalAutoReply({
                    subject,
                    sender,
                    messages,
                    settings:
                        state.replySettings,
                    classification:
                        decision
                });
        } catch (error) {
            if (
                error?.transient ||
                error instanceof TypeError
            ) {
                throw error;
            }

            state.counters.manualReview += 1;
            await finish(
                "manual_review",
                decision,
                error instanceof Error
                    ? error.message
                    : "Reply quality validation failed."
            );
            return;
        }

        const raw =
            createReplyRawMessage({
                recipient,
                subject,
                messageId:
                    messageIdHeader,
                references,
                reply
            });
        const currentDate =
            new Date()
                .toISOString()
                .slice(0, 10);
        const sentToday =
            Number(
                state.dailyUsage[
                    currentDate
                ]
            ) || 0;
        const dailyLimitReached =
            sentToday >=
            DAILY_AUTO_SEND_LIMIT;
        const mayAutoSend =
            passesAutoReplySafetyGate({
                decision,
                sender,
                searchableText,
                hasAttachment,
                autoReplySettings:
                    state.autoReplySettings,
                blockedHeader:
                    Boolean(automatedReason),
                existingDraft:
                    Boolean(existingDraftId),
                alreadyProcessed:
                    Boolean(
                        state.processedMessages[
                            incomingMessageId
                        ]
                    ),
                dailyLimitReached
            });

        if (mayAutoSend) {
            state.dailyUsage[currentDate] =
                sentToday + 1;

            let sentMessageId;

            try {
                sentMessageId =
                    await sendGmailReply({
                        accessToken:
                            state.accessToken,
                        threadId,
                        raw
                    });
            } catch (error) {
                state.dailyUsage[
                    currentDate
                ] = sentToday;
                throw error;
            }

            state.counters.autoSent += 1;
            await finish(
                "auto_sent",
                decision,
                decision.reason,
                {
                    sentMessageId,
                    extraStorage: {
                        autoReplyDailyUsage:
                            state.dailyUsage
                    }
                }
            );
            return;
        }

        const draftId =
            await createGmailDraft({
                accessToken:
                    state.accessToken,
                threadId,
                raw
            });
        const createdAt =
            new Date().toISOString();

        state.createdDraftsByThread[
            threadId
        ] = {
            draftId,
            createdAt
        };
        state.gmailDraftsByThread.set(
            threadId,
            draftId
        );
        state.counters.draftsCreated += 1;

        const status =
            dailyLimitReached
                ? "daily_limit_reached"
                : state.autoReplySettings
                    .mode === "dry_run"
                    ? "draft_created"
                    : "draft_created_for_review";

        await finish(
            status,
            decision,
            dailyLimitReached
                ? "Daily auto-send limit reached; a draft was created."
                : decision.reason,
            {
                draftId,
                extraStorage: {
                    createdDraftsByThread:
                        state.createdDraftsByThread
                }
            }
        );
    } catch (error) {
        state.counters.transientErrors += 1;
        console.error(
            "Retryable automatic email processing error:",
            error instanceof Error
                ? error.message
                : "Unknown error"
        );
    } finally {
        if (threadLocked) {
            state.threadLocks.delete(
                threadId
            );
        }
    }
}

async function runAutomaticReplyCheck() {
    if (autoReplyCheckRunning) {
        return {
            message:
                "An automatic email check is already running.",
            checked: 0,
            classified: 0,
            autoSent: 0,
            draftsCreated: 0,
            manualReview: 0,
            ignored: 0,
            skipped: 0,
            transientErrors: 0,
            averageProcessingMs: 0
        };
    }

    autoReplyCheckRunning = true;
    const runStartedAt =
        new Date().toISOString();

    try {
        const storedData =
            await chrome.storage.local.get([
                "autoReplySettings",
                "autoReplyProcessedMessages",
                "autoReplyDailyUsage",
                "replySettings",
                "createdDraftsByThread",
                "autoReplyLastHistoryId",
                "autoReplyLastFullReconciliationAt"
            ]);
        const autoReplySettings = {
            enabled: false,
            mode: "dry_run",
            ...getStoredObject(
                storedData.autoReplySettings
            )
        };

        autoReplySettings.enabled =
            Boolean(
                autoReplySettings.enabled
            );
        autoReplySettings.mode =
            autoReplySettings.mode ===
                "auto_send"
                ? "auto_send"
                : "dry_run";

        const counters = {
            checked: 0,
            classified: 0,
            autoSent: 0,
            draftsCreated: 0,
            manualReview: 0,
            ignored: 0,
            skipped: 0,
            transientErrors: 0
        };

        if (!autoReplySettings.enabled) {
            const summary = {
                message:
                    "Automatic Reply Agent is disabled.",
                ...counters,
                averageProcessingMs: 0,
                startedAt: runStartedAt,
                completedAt:
                    new Date().toISOString()
            };

            await chrome.storage.local.set({
                autoReplyLastRunSummary:
                    summary
            });
            return summary;
        }

        const accessToken =
            await getGmailAccessToken();
        const [
            synchronization,
            gmailDraftsByThread
        ] = await Promise.all([
            collectAutomaticCandidates({
                accessToken,
                lastHistoryId:
                    storedData
                        .autoReplyLastHistoryId,
                lastFullReconciliationAt:
                    storedData
                        .autoReplyLastFullReconciliationAt
            }),
            fetchExistingDraftsByThread(
                accessToken
            )
        ]);
        const state = {
            accessToken,
            ownEmail:
                synchronization.ownEmail,
            autoReplySettings,
            processedMessages:
                getStoredObject(
                    storedData
                        .autoReplyProcessedMessages
                ),
            dailyUsage:
                getStoredObject(
                    storedData
                        .autoReplyDailyUsage
                ),
            replySettings:
                getStoredObject(
                    storedData.replySettings
                ),
            createdDraftsByThread:
                getStoredObject(
                    storedData
                        .createdDraftsByThread
                ),
            gmailDraftsByThread,
            threadLocks: new Set(),
            counters,
            durations: [],
            persistChain:
                Promise.resolve()
        };

        await runWithConcurrency(
            synchronization.candidateIds,
            PROCESSING_CONCURRENCY,
            (messageId) =>
                processAutomaticCandidate(
                    messageId,
                    state
                )
        );
        await state.persistChain;

        const totalProcessingMs =
            state.durations.reduce(
                (total, duration) =>
                    total + duration,
                0
            );
        const averageProcessingMs =
            state.durations.length
                ? Math.round(
                    totalProcessingMs /
                    state.durations.length
                )
                : 0;
        const completedAt =
            new Date().toISOString();
        const summary = {
            message:
                "Checked " +
                counters.checked +
                " new emails: " +
                counters.autoSent +
                " auto-sent, " +
                counters.draftsCreated +
                " drafts created, " +
                counters.manualReview +
                " manual review, " +
                counters.ignored +
                " ignored.",
            ...counters,
            averageProcessingMs,
            startedAt: runStartedAt,
            completedAt
        };
        const syncStorage = {
            autoReplyLastRunSummary:
                summary,
            autoReplyProcessedMessages:
                state.processedMessages
        };

        if (
            counters.transientErrors === 0 &&
            synchronization.newestHistoryId
        ) {
            syncStorage.autoReplyLastHistoryId =
                synchronization
                    .newestHistoryId;
        }

        if (
            synchronization
                .completedFullReconciliationAt
        ) {
            syncStorage
                .autoReplyLastFullReconciliationAt =
                synchronization
                    .completedFullReconciliationAt;
        }

        await chrome.storage.local.set(
            syncStorage
        );

        return summary;
    } finally {
        autoReplyCheckRunning = false;
    }
}

