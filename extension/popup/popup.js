const connectButton =
    document.getElementById("connectButton");

const connectionTitle =
    document.getElementById("connectionTitle");

const inboxCard =
    document.getElementById("inboxCard");

const emailDetailsCard =
    document.getElementById(
        "emailDetailsCard"
    );

const selectedEmailSubject =
    document.getElementById(
        "selectedEmailSubject"
    );

const selectedEmailSender =
    document.getElementById(
        "selectedEmailSender"
    );

const emailDetailsStatus =
    document.getElementById(
        "emailDetailsStatus"
    );

const threadMessages =
    document.getElementById(
        "threadMessages"
    );

const closeEmailButton =
    document.getElementById(
        "closeEmailButton"
    );

const generateReplyButton =
    document.getElementById(
        "generateReplyButton"
    );

const createDraftButton =
    document.getElementById("createDraftButton");

const draftStatus =
    document.getElementById("draftStatus");

const openDraftsButton =
    document.getElementById(
        "openDraftsButton"
    );

const replyTone =
    document.getElementById("replyTone");

const replyLength =
    document.getElementById("replyLength");

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const emailSignature =
    document.getElementById("emailSignature");

const saveSettingsButton =
    document.getElementById(
        "saveSettingsButton"
    );

const settingsStatus =
    document.getElementById(
        "settingsStatus"
    );

const autoReplyEnabled =
    document.getElementById(
        "autoReplyEnabled"
    );

const autoReplyMode =
    document.getElementById(
        "autoReplyMode"
    );

const runAutoReplyCheckButton =
    document.getElementById(
        "runAutoReplyCheckButton"
    );

const autoReplyStatus =
    document.getElementById(
        "autoReplyStatus"
    );

const autoReplyLastCheck =
    document.getElementById(
        "autoReplyLastCheck"
    );

const autoReplyLastResult =
    document.getElementById(
        "autoReplyLastResult"
    );

const customReplyInstruction =
    document.getElementById(
        "customReplyInstruction"
    );

const instructionCharacterCount =
    document.getElementById(
        "instructionCharacterCount"
    );

const clearInstructionButton =
    document.getElementById(
        "clearInstructionButton"
    );

const riskWarning =
    document.getElementById(
        "riskWarning"
    );

const riskTitle =
    document.getElementById(
        "riskTitle"
    );

const riskMessage =
    document.getElementById(
        "riskMessage"
    );

const riskCategories =
    document.getElementById(
        "riskCategories"
    );

const riskReviewCheckbox =
    document.getElementById(
        "riskReviewCheckbox"
    );

const DEFAULT_REPLY_SETTINGS = {
    tone: "professional",
    length: "medium",
    name: "Hassan Tanveer",
    role: "Full-Stack Developer",
    signature:
        "Best regards,\nHassan Tanveer"
};

const DEFAULT_AUTO_REPLY_SETTINGS = {
    enabled: false,
    mode: "dry_run"
};

const EMAIL_RISK_RULES = [
    {
        category: "Payment or Banking",
        keywords: [
            "payment",
            "invoice",
            "bank",
            "bank account",
            "account number",
            "wire transfer",
            "transfer money",
            "credit card",
            "debit card",
            "paypal",
            "wise",
            "stripe",
            "payment details",
            "bank details",
            "iban",
            "swift code",
            "transaction",
            "deposit",
            "advance payment",
            "paisa",
            "payment bhej",
            "bank detail"
        ]
    },
    {
        category: "Contract or Legal",
        keywords: [
            "contract",
            "agreement",
            "legal",
            "lawyer",
            "attorney",
            "terms and conditions",
            "terms of service",
            "nda",
            "non-disclosure",
            "liability",
            "lawsuit",
            "court",
            "sign this",
            "signature required",
            "legal notice"
        ]
    },
    {
        category: "Security or Password",
        keywords: [
            "password",
            "passcode",
            "otp",
            "verification code",
            "security code",
            "login code",
            "two-factor",
            "2fa",
            "reset password",
            "account access",
            "credentials",
            "api key",
            "secret key",
            "private key"
        ]
    },
    {
        category: "Refund or Cancellation",
        keywords: [
            "refund",
            "chargeback",
            "cancel",
            "cancellation",
            "return payment",
            "money back",
            "reimburse",
            "reimbursement",
            "refund approve",
            "order cancellation"
        ]
    },
    {
        category: "Salary or Job Offer",
        keywords: [
            "salary",
            "compensation",
            "job offer",
            "employment offer",
            "offer letter",
            "joining date",
            "employment contract",
            "monthly pay",
            "annual salary",
            "pay rate",
            "hourly rate"
        ]
    },
    {
        category: "Deadline or Commitment",
        keywords: [
            "deadline",
            "final date",
            "due date",
            "delivery date",
            "commitment",
            "guarantee",
            "promise",
            "complete by",
            "deliver by",
            "available tomorrow",
            "confirm availability",
            "urgent",
            "immediately",
            "as soon as possible"
        ]
    }
];

let selectedThread = null;
let draftCreationInProgress = false;
let currentCreatedDraftId = null;
let currentCreatedDraftThreadId = null;
let currentRiskAssessment = {
    isSensitive: false,
    categories: []
};
let inboxNextPageToken = null;
let inboxLoading = false;

const loadedInboxMessageIds =
    new Set();

const connectionMessage =
    document.getElementById("connectionMessage");

const statusIndicator =
    document.getElementById("statusIndicator");

const checkInboxButton =
    document.getElementById("checkInboxButton");

const refreshInboxButton =
    document.getElementById(
        "refreshInboxButton"
    );

const loadMoreButton =
    document.getElementById(
        "loadMoreButton"
    );

const inboxStatus =
    document.getElementById("inboxStatus");

const emailList =
    document.getElementById("emailList");

const emailCount =
    document.getElementById("emailCount");

const replyPreview =
    document.getElementById("replyPreview");

const generatedReply =
    document.getElementById("generatedReply");

const replyStatus =
    document.getElementById("replyStatus");

function getReplySettingsFromForm() {
    return {
        tone:
            replyTone.value ||
            DEFAULT_REPLY_SETTINGS.tone,

        length:
            replyLength.value ||
            DEFAULT_REPLY_SETTINGS.length,

        name:
            userName.value.trim() ||
            DEFAULT_REPLY_SETTINGS.name,

        role:
            userRole.value.trim(),

        signature:
            emailSignature.value.trim() ||
            DEFAULT_REPLY_SETTINGS.signature
    };
}


function getCustomReplyInstruction() {
    return customReplyInstruction
        .value
        .trim();
}


function updateInstructionCharacterCount() {
    const currentLength =
        customReplyInstruction.value.length;

    instructionCharacterCount.textContent =
        `${currentLength} / 1000`;

    clearInstructionButton.disabled =
        currentLength === 0;
}


function clearCustomReplyInstruction() {
    customReplyInstruction.value = "";

    updateInstructionCharacterCount();
}


function normalizeRiskText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}


function getThreadRiskText(
    thread,
    subject = ""
) {
    const parts = [
        subject
    ];

    const messages =
        Array.isArray(thread?.messages)
            ? thread.messages
            : [];

    for (const message of messages) {
        const headers =
            message.payload?.headers || [];

        parts.push(
            getEmailHeader(
                headers,
                "From"
            )
        );

        parts.push(
            getEmailHeader(
                headers,
                "To"
            )
        );

        parts.push(
            getEmailHeader(
                headers,
                "Subject"
            )
        );

        parts.push(
            extractMessageBody(
                message.payload
            )
        );
    }

    return normalizeRiskText(
        parts.filter(Boolean).join(" ")
    );
}


function detectEmailRisks(
    thread,
    subject = ""
) {
    const searchableText =
        getThreadRiskText(
            thread,
            subject
        );

    const categories = [];

    for (const rule of EMAIL_RISK_RULES) {
        const hasMatch =
            rule.keywords.some(
                (keyword) =>
                    searchableText.includes(
                        normalizeRiskText(
                            keyword
                        )
                    )
            );

        if (hasMatch) {
            categories.push(
                rule.category
            );
        }
    }

    return {
        isSensitive:
            categories.length > 0,

        categories:
            [...new Set(categories)]
    };
}


function renderRiskAssessment(
    assessment
) {
    currentRiskAssessment = {
        isSensitive:
            Boolean(
                assessment?.isSensitive
            ),

        categories:
            Array.isArray(
                assessment?.categories
            )
                ? assessment.categories
                : []
    };

    riskCategories.replaceChildren();
    riskReviewCheckbox.checked = false;

    if (
        !currentRiskAssessment.isSensitive
    ) {
        riskWarning.hidden = true;

        return;
    }

    riskWarning.hidden = false;

    riskTitle.textContent =
        "Sensitive Email Detected";

    riskMessage.textContent =
        "This email may involve sensitive information or an important commitment. Review the generated reply carefully before creating a Gmail Draft.";

    for (
        const category
        of currentRiskAssessment.categories
    ) {
        const categoryElement =
            document.createElement("span");

        categoryElement.className =
            "risk-category";

        categoryElement.textContent =
            category;

        riskCategories.appendChild(
            categoryElement
        );
    }
}


function resetRiskAssessment() {
    currentRiskAssessment = {
        isSensitive: false,
        categories: []
    };

    riskWarning.hidden = true;
    riskReviewCheckbox.checked = false;
    riskCategories.replaceChildren();
}


function isRiskReviewApproved() {
    return (
        !currentRiskAssessment.isSensitive ||
        riskReviewCheckbox.checked
    );
}


function updateDraftButtonForRisk() {
    /*
     * Do not override an existing created-draft state.
     */
    if (currentCreatedDraftId) {
        createDraftButton.disabled = true;
        createDraftButton.textContent =
            "Draft Created";

        return;
    }

    if (draftCreationInProgress) {
        createDraftButton.disabled = true;

        return;
    }

    const hasReply =
        Boolean(
            generatedReply.value.trim()
        );

    const canCreateDraft =
        Boolean(selectedThread) &&
        hasReply &&
        isRiskReviewApproved();

    createDraftButton.disabled =
        !canCreateDraft;

    if (
        currentRiskAssessment.isSensitive &&
        hasReply &&
        !riskReviewCheckbox.checked
    ) {
        draftStatus.textContent =
            "Review the reply and confirm the sensitive-email warning before creating a Gmail Draft.";
    } else if (
        draftStatus.textContent ===
        "Review the reply and confirm the sensitive-email warning before creating a Gmail Draft."
    ) {
        draftStatus.textContent = "";
    }
}


function applyReplySettingsToForm(
    settings
) {
    const safeSettings = {
        ...DEFAULT_REPLY_SETTINGS,
        ...(settings || {})
    };

    replyTone.value =
        safeSettings.tone;

    replyLength.value =
        safeSettings.length;

    userName.value =
        safeSettings.name;

    userRole.value =
        safeSettings.role;

    emailSignature.value =
        safeSettings.signature;
}


async function loadReplySettings() {
    try {
        const result =
            await chrome.storage.local.get(
                "replySettings"
            );

        applyReplySettingsToForm(
            result.replySettings
        );
    } catch (error) {
        console.error(
            "Load reply settings error:",
            error
        );

        applyReplySettingsToForm(
            DEFAULT_REPLY_SETTINGS
        );

        settingsStatus.textContent =
            "Unable to load saved settings.";
    }
}


async function loadAutoReplySettings() {
    try {
        const result =
            await chrome.storage.local.get(
                "autoReplySettings"
            );

        const settings = {
            ...DEFAULT_AUTO_REPLY_SETTINGS,
            ...(result.autoReplySettings || {})
        };

        autoReplyEnabled.checked =
            Boolean(settings.enabled);

        autoReplyMode.value =
            settings.mode === "auto_send"
                ? "auto_send"
                : "dry_run";
    } catch (error) {
        console.error(
            "Load auto-reply settings error:",
            error
        );

        autoReplyEnabled.checked = false;
        autoReplyMode.value = "dry_run";
    }
}


function displayAutoReplyRunSummary(
    summary
) {
    if (
        !summary ||
        typeof summary !== "object"
    ) {
        return;
    }

    const completedAt =
        new Date(summary.completedAt);
    autoReplyLastCheck.textContent =
        Number.isNaN(
            completedAt.getTime()
        )
            ? "Not checked yet"
            : completedAt.toLocaleString();

    autoReplyLastResult.textContent =
        typeof summary.message === "string" &&
        summary.message.trim()
            ? summary.message
            : "No result yet";
}

async function loadAutoReplyRunSummary() {
    try {
        const result =
            await chrome.storage.local.get(
                "autoReplyLastRunSummary"
            );

        displayAutoReplyRunSummary(
            result.autoReplyLastRunSummary
        );
    } catch (error) {
        console.error(
            "Load auto-reply summary error:",
            error
        );

        autoReplyLastResult.textContent =
            "Unable to load the last result.";
    }
}

async function saveAutoReplySettings() {
    const settings = {
        enabled:
            autoReplyEnabled.checked,

        mode:
            autoReplyMode.value ===
            "auto_send"
                ? "auto_send"
                : "dry_run"
    };

    await chrome.storage.local.set({
        autoReplySettings: settings
    });

    return settings;
}


async function saveReplySettings() {
    saveSettingsButton.disabled = true;

    saveSettingsButton.textContent =
        "Saving Settings...";

    settingsStatus.textContent = "";

    try {
        const settings =
            getReplySettingsFromForm();

        await chrome.storage.local.set({
            replySettings: settings
        });

        settingsStatus.textContent =
            "Reply settings saved successfully.";
    } catch (error) {
        console.error(
            "Save reply settings error:",
            error
        );

        settingsStatus.textContent =
            "Unable to save reply settings.";
    } finally {
        saveSettingsButton.disabled = false;

        saveSettingsButton.textContent =
            "Save Reply Settings";
    }
}

function getAccessTokenValue(authResult) {
    if (typeof authResult === "string") {
        return authResult;
    }

    return authResult?.token;
}


function getEmailHeader(headers, headerName) {
    const header = headers.find(
        (item) =>
            item.name.toLowerCase() ===
            headerName.toLowerCase()
    );

    return header?.value || "";
}

function decodeBase64Url(data) {
    if (!data) {
        return "";
    }

    try {
        const normalized = data
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padding =
            "=".repeat(
                (4 - (normalized.length % 4)) % 4
            );

        const binaryString =
            atob(normalized + padding);

        const bytes =
            Uint8Array.from(
                binaryString,
                (character) =>
                    character.charCodeAt(0)
            );

        return new TextDecoder(
            "utf-8"
        ).decode(bytes);
    } catch (error) {
        console.error(
            "Email body decoding failed:",
            error
        );

        return "";
    }
}


function findMessagePart(
    payload,
    requiredMimeType
) {
    if (!payload) {
        return null;
    }

    if (
        payload.mimeType === requiredMimeType &&
        payload.body?.data
    ) {
        return payload.body.data;
    }

    for (const part of payload.parts || []) {
        const foundPart =
            findMessagePart(
                part,
                requiredMimeType
            );

        if (foundPart) {
            return foundPart;
        }
    }

    return null;
}


function htmlToPlainText(html) {
    const parser =
        new DOMParser();

    const documentResult =
        parser.parseFromString(
            html,
            "text/html"
        );

    return (
        documentResult.body.textContent || ""
    ).trim();
}


function extractMessageBody(payload) {
    const plainTextPart =
        findMessagePart(
            payload,
            "text/plain"
        );

    if (plainTextPart) {
        return decodeBase64Url(
            plainTextPart
        ).trim();
    }

    const htmlPart =
        findMessagePart(
            payload,
            "text/html"
        );

    if (htmlPart) {
        const html =
            decodeBase64Url(htmlPart);

        return htmlToPlainText(html);
    }

    if (payload?.body?.data) {
        return decodeBase64Url(
            payload.body.data
        ).trim();
    }

    return "Email body could not be displayed.";
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

function clearEmailList() {
    emailList.replaceChildren();
    emailCount.textContent = "0";
}


function showDisconnectedState() {
    connectionTitle.textContent =
        "Gmail not connected";

    connectionMessage.textContent =
        "Connect your Gmail account to start.";

    connectButton.textContent =
        "Connect Gmail";

    connectButton.disabled = false;
    checkInboxButton.disabled = true;
    refreshInboxButton.disabled = true;
    refreshInboxButton.hidden = true;
    loadMoreButton.hidden = true;

    inboxStatus.textContent =
        "Connect Gmail to check your inbox.";

    statusIndicator.classList.remove(
        "connected"
    );

    statusIndicator.classList.add(
        "disconnected"
    );

    inboxNextPageToken = null;
    loadedInboxMessageIds.clear();

    clearEmailList();
}


function showConnectedState(emailAddress) {
    connectionTitle.textContent =
        "Gmail connected";

    connectionMessage.textContent =
        emailAddress
            ? `Connected as ${emailAddress}`
            : "Your Gmail account is connected.";

    connectButton.textContent =
        "Gmail Connected";

    connectButton.disabled = true;
    checkInboxButton.disabled = false;
    refreshInboxButton.disabled = false;
    loadMoreButton.hidden = true;

    inboxStatus.textContent =
        'Click "Check Inbox" to load unread emails.';

    statusIndicator.classList.remove(
        "disconnected"
    );

    statusIndicator.classList.add(
        "connected"
    );
}


async function connectGmail() {
    connectButton.disabled = true;

    connectButton.textContent =
        "Connecting Gmail...";

    connectionTitle.textContent =
        "Waiting for Google";

    connectionMessage.textContent =
        "Complete the authorization process.";

    try {
        const authResult =
            await chrome.identity.getAuthToken({
                interactive: true
            });

        const accessToken =
            getAccessTokenValue(authResult);

        if (!accessToken) {
            throw new Error(
                "Google access token was not returned."
            );
        }

        const profileResponse = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!profileResponse.ok) {
            throw new Error(
                "Gmail profile could not be read."
            );
        }

        const profile =
            await profileResponse.json();

        await chrome.storage.local.set({
            gmailConnected: true,
            gmailEmail:
                profile.emailAddress || ""
        });

        showConnectedState(
            profile.emailAddress
        );
    } catch (error) {
        console.error(
            "Gmail OAuth error:",
            error
        );

        connectionTitle.textContent =
            "Gmail connection failed";

        connectionMessage.textContent =
            error instanceof Error
                ? error.message
                : "Unable to connect Gmail.";

        connectButton.textContent =
            "Try Again";

        connectButton.disabled = false;
        checkInboxButton.disabled = true;
    }
}


async function getGmailToken() {
    const authResult =
        await chrome.identity.getAuthToken({
            interactive: false
        });

    const accessToken =
        getAccessTokenValue(authResult);

    if (!accessToken) {
        throw new Error(
            "Gmail authorization was not found. Please reconnect Gmail."
        );
    }

    return accessToken;
}


async function fetchUnreadMessageIds(
    accessToken,
    pageToken = null
) {
    const parameters =
        new URLSearchParams();

    parameters.set(
        "maxResults",
        "5"
    );

    parameters.set(
        "q",
        "is:unread in:inbox"
    );

    if (pageToken) {
        parameters.set(
            "pageToken",
            pageToken
        );
    }

    const url =
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/messages" +
        `?${parameters.toString()}`;

    const response = await fetch(url, {
        headers: {
            Authorization:
                `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData =
            await response.json().catch(
                () => null
            );

        console.error(
            "Unread messages API error:",
            errorData
        );

        throw new Error(
            "Unable to retrieve unread emails."
        );
    }

    const data =
        await response.json();

    return {
        messages:
            Array.isArray(data.messages)
                ? data.messages
                : [],

        nextPageToken:
            data.nextPageToken || null,

        resultSizeEstimate:
            Number.isFinite(
                data.resultSizeEstimate
            )
                ? data.resultSizeEstimate
                : null
    };
}


async function fetchEmailDetails(
    accessToken,
    messageId
) {
    const parameters =
        new URLSearchParams();

    parameters.set("format", "metadata");

    parameters.append(
        "metadataHeaders",
        "From"
    );

    parameters.append(
        "metadataHeaders",
        "Subject"
    );

    parameters.append(
        "metadataHeaders",
        "Date"
    );

    const url =
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/messages/" +
        `${messageId}?${parameters.toString()}`;

    const response = await fetch(url, {
        headers: {
            Authorization:
                `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(
            "Unable to read email details."
        );
    }

    return response.json();
}

async function fetchInboxEmailBatch(
    accessToken,
    messageReferences
) {
    const batchMessageIds =
        new Set();

    const uniqueReferences =
        messageReferences.filter(
            (message) => {
                if (
                    !message?.id ||
                    loadedInboxMessageIds.has(
                        message.id
                    ) ||
                    batchMessageIds.has(
                        message.id
                    )
                ) {
                    return false;
                }

                batchMessageIds.add(
                    message.id
                );

                return true;
            }
        );

    const emails =
        await Promise.all(
            uniqueReferences.map(
                (message) =>
                    fetchEmailDetails(
                        accessToken,
                        message.id
                    )
            )
        );

    for (const email of emails) {
        if (email?.id) {
            loadedInboxMessageIds.add(
                email.id
            );
        }
    }

    return emails;
}

async function fetchEmailThread(
    accessToken,
    threadId
) {
    const url =
        "https://gmail.googleapis.com/" +
        "gmail/v1/users/me/threads/" +
        `${threadId}?format=full`;

    const response = await fetch(url, {
        headers: {
            Authorization:
                `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData =
            await response.json().catch(
                () => null
            );

        console.error(
            "Thread API error:",
            errorData
        );

        throw new Error(
            "Unable to read the complete email thread."
        );
    }

    return response.json();
}

function displayEmailThread(thread) {
    selectedThread = thread;

    threadMessages.replaceChildren();

    const messages =
        thread.messages || [];

    if (messages.length === 0) {
        emailDetailsStatus.textContent =
            "No messages were found in this thread.";

        generateReplyButton.disabled = true;

        return;
    }

    for (const message of messages) {
        const headers =
            message.payload?.headers || [];

        const from =
            getEmailHeader(
                headers,
                "From"
            ) || "Unknown sender";

        const to =
            getEmailHeader(
                headers,
                "To"
            ) || "Unknown recipient";

        const date =
            getEmailHeader(
                headers,
                "Date"
            ) || "Date unavailable";

        const body =
            extractMessageBody(
                message.payload
            );

        const messageCard =
            document.createElement("article");

        messageCard.className =
            "thread-message";

        const messageHeader =
            document.createElement("div");

        messageHeader.className =
            "thread-message-header";

        const fromElement =
            document.createElement("p");

        fromElement.textContent =
            `From: ${from}`;

        const toElement =
            document.createElement("p");

        toElement.textContent =
            `To: ${to}`;

        const dateElement =
            document.createElement("p");

        dateElement.textContent =
            `Date: ${date}`;

        messageHeader.append(
            fromElement,
            toElement,
            dateElement
        );

        const bodyElement =
            document.createElement("p");

        bodyElement.className =
            "thread-message-body";

        bodyElement.textContent =
            body;

        messageCard.append(
            messageHeader,
            bodyElement
        );

        threadMessages.appendChild(
            messageCard
        );
    }

    emailDetailsStatus.textContent =
        `${messages.length} message(s) loaded from this conversation.`;

    /*
     * AI backend abhi ready nahi,
     * is liye button disabled hai.
     */
    generateReplyButton.disabled = false;
}


async function openEmailThread(email) {
    clearCustomReplyInstruction();
    resetRiskAssessment();

    inboxCard.hidden = true;

    emailDetailsCard.hidden = false;

    selectedEmailSubject.textContent =
        "Loading email...";

    selectedEmailSender.textContent =
        "";

    emailDetailsStatus.textContent =
        "Reading complete conversation...";

    threadMessages.replaceChildren();

    generateReplyButton.disabled = true;

    try {
        if (!email?.threadId) {
            throw new Error(
                "This email does not include a Gmail thread ID."
            );
        }

        const accessToken =
            await getGmailToken();

        const thread =
            await fetchEmailThread(
                accessToken,
                email.threadId
            );

        console.log("Thread loaded", thread);

        const headers =
            email.payload?.headers || [];

        selectedEmailSubject.textContent =
            getEmailHeader(
                headers,
                "Subject"
            ) || "No subject";

        selectedEmailSender.textContent =
            getEmailHeader(
                headers,
                "From"
            ) || "Unknown sender";

        displayEmailThread(thread);

        const riskAssessment =
            detectEmailRisks(
                thread,
                selectedEmailSubject
                    .textContent
                    ?.trim() || ""
            );

        renderRiskAssessment(
            riskAssessment
        );

        await restoreDraftStateForThread(
            thread.id
        );

        updateDraftButtonForRisk();

        emailDetailsCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        console.error(
            "Email thread loading error:",
            error
        );

        selectedEmailSubject.textContent =
            "Email could not be loaded";

        emailDetailsStatus.textContent =
            error instanceof Error
                ? error.message
                : "Unable to read email.";
    }
}

function displayEmails(
    emails,
    append = false
) {
    if (!append) {
        emailList.replaceChildren();
    }

    if (
        !Array.isArray(emails) ||
        emails.length === 0
    ) {
        if (!append) {
            emailCount.textContent = "0";

            inboxStatus.textContent =
                "No unread emails were found.";
        }

        return;
    }

    for (const email of emails) {
        const headers =
            email.payload?.headers || [];

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

        const date =
            getEmailHeader(
                headers,
                "Date"
            );

        const emailItem =
            document.createElement("article");

        emailItem.className =
            "email-item";

        const subjectElement =
            document.createElement("h3");

        subjectElement.className =
            "email-subject";

        subjectElement.textContent =
            subject;

        const senderElement =
            document.createElement("p");

        senderElement.className =
            "email-sender";

        senderElement.textContent =
            sender;

        const dateElement =
            document.createElement("p");

        dateElement.className =
            "email-date";

        dateElement.textContent =
            date || "Date unavailable";

        const readEmailButton =
            document.createElement("button");

        readEmailButton.type =
            "button";

        readEmailButton.className =
            "read-email-button";

        readEmailButton.textContent =
            "Read Email";

        readEmailButton.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "Read Email clicked",
                    email
                );

                console.log(
                    "Thread ID",
                    email.threadId
                );

                openEmailThread(email);
            }
        );

        emailItem.append(
            subjectElement,
            senderElement,
            dateElement,
            readEmailButton
        );

        emailList.appendChild(
            emailItem
        );
    }

    const displayedCount =
        emailList.querySelectorAll(
            ".email-item"
        ).length;

    emailCount.textContent =
        String(displayedCount);
}


async function loadInbox({
    refresh = false,
    loadMore = false
} = {}) {
    if (inboxLoading) {
        return;
    }

    inboxLoading = true;

    checkInboxButton.disabled = true;
    refreshInboxButton.disabled = true;
    loadMoreButton.disabled = true;

    if (refresh) {
        inboxStatus.textContent =
            "Refreshing unread emails...";

        inboxNextPageToken = null;
        loadedInboxMessageIds.clear();
        loadMoreButton.hidden = true;

        emailList.replaceChildren();
        emailCount.textContent = "0";
    } else if (loadMore) {
        inboxStatus.textContent =
            "Loading more unread emails...";
    } else {
        inboxStatus.textContent =
            "Reading your unread emails...";

        inboxNextPageToken = null;
        loadedInboxMessageIds.clear();
        loadMoreButton.hidden = true;

        emailList.replaceChildren();
        emailCount.textContent = "0";
    }

    try {
        const accessToken =
            await getGmailToken();

        const pageToken =
            loadMore
                ? inboxNextPageToken
                : null;

        if (
            loadMore &&
            !pageToken
        ) {
            inboxStatus.textContent =
                "No more unread emails are available.";

            loadMoreButton.hidden = true;

            return;
        }

        const result =
            await fetchUnreadMessageIds(
                accessToken,
                pageToken
            );

        inboxNextPageToken =
            result.nextPageToken;

        const emails =
            await fetchInboxEmailBatch(
                accessToken,
                result.messages
            );

        displayEmails(
            emails,
            loadMore
        );

        const displayedCount =
            emailList.querySelectorAll(
                ".email-item"
            ).length;

        emailCount.textContent =
            String(displayedCount);

        if (displayedCount === 0) {
            inboxStatus.textContent =
                "No unread emails were found.";
        } else if (
            loadMore &&
            emails.length === 0
        ) {
            inboxStatus.textContent =
                "No new unread emails were added.";
        } else {
            inboxStatus.textContent =
                `${displayedCount} unread email(s) loaded.`;
        }

        refreshInboxButton.hidden = false;

        loadMoreButton.hidden =
            !inboxNextPageToken;
    } catch (error) {
        console.error(
            "Inbox loading error:",
            error
        );

        inboxStatus.textContent =
            error instanceof Error
                ? error.message
                : "Unable to load Gmail inbox.";
    } finally {
        inboxLoading = false;

        checkInboxButton.disabled = false;
        refreshInboxButton.disabled = false;
        loadMoreButton.disabled = false;

        checkInboxButton.textContent =
            "Check Inbox";

        refreshInboxButton.textContent =
            "Refresh Inbox";

        loadMoreButton.textContent =
            "Load More Emails";
    }
}


async function checkInbox() {
    checkInboxButton.textContent =
        "Loading Inbox...";

    await loadInbox({
        refresh: false,
        loadMore: false
    });
}


async function refreshInbox() {
    refreshInboxButton.textContent =
        "Refreshing...";

    await loadInbox({
        refresh: true,
        loadMore: false
    });
}


async function loadMoreEmails() {
    loadMoreButton.textContent =
        "Loading More...";

    await loadInbox({
        refresh: false,
        loadMore: true
    });
}


async function loadConnectionStatus() {
    try {
        const savedData =
            await chrome.storage.local.get([
                "gmailConnected",
                "gmailEmail"
            ]);

        if (savedData.gmailConnected) {
            showConnectedState(
                savedData.gmailEmail
            );

            return;
        }

        showDisconnectedState();
    } catch (error) {
        console.error(
            "Could not load connection status:",
            error
        );

        showDisconnectedState();
    }
}


connectButton.addEventListener(
    "click",
    connectGmail
);

checkInboxButton.addEventListener(
    "click",
    checkInbox
);

refreshInboxButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        await refreshInbox();
    }
);

loadMoreButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        await loadMoreEmails();
    }
);

autoReplyEnabled.addEventListener(
    "change",
    async () => {
        await saveAutoReplySettings();

        autoReplyStatus.textContent =
            autoReplyEnabled.checked
                ? "Automatic email checking enabled."
                : "Automatic email checking disabled.";
    }
);

autoReplyMode.addEventListener(
    "change",
    async () => {
        await saveAutoReplySettings();

        autoReplyStatus.textContent =
            autoReplyMode.value ===
            "auto_send"
                ? "Auto Send enabled for strict low-risk categories."
                : "Dry Run enabled. Safe replies will be saved as drafts.";
    }
);

runAutoReplyCheckButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        runAutoReplyCheckButton.disabled =
            true;

        runAutoReplyCheckButton.textContent =
            "Checking Emails...";

        autoReplyStatus.textContent =
            "Classifying new unread emails...";

        try {
            const result =
                await chrome.runtime.sendMessage({
                    type:
                        "RUN_AUTO_REPLY_CHECK"
                });

            if (!result?.success) {
                throw new Error(
                    result?.error ||
                    "Automatic email check failed."
                );
            }

            autoReplyStatus.textContent =
                result.message ||
                "Email check completed.";
            displayAutoReplyRunSummary(
                result
            );
        } catch (error) {
            console.error(
                "Manual auto-reply check error:",
                error
            );

            autoReplyStatus.textContent =
                error instanceof Error
                    ? error.message
                    : "Unable to check new emails.";
            autoReplyLastCheck.textContent =
                new Date().toLocaleString() +
                " (failed)";
            autoReplyLastResult.textContent =
                autoReplyStatus.textContent;
        } finally {
            runAutoReplyCheckButton.disabled =
                false;

            runAutoReplyCheckButton.textContent =
                "Check New Emails Now";
        }
    }
);

saveSettingsButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        await saveReplySettings();
    }
);

customReplyInstruction.addEventListener(
    "input",
    () => {
        updateInstructionCharacterCount();
    }
);

clearInstructionButton.addEventListener(
    "click",
    (event) => {
        event.preventDefault();
        event.stopPropagation();

        clearCustomReplyInstruction();

        customReplyInstruction.focus();
    }
);

riskReviewCheckbox.addEventListener(
    "change",
    () => {
        updateDraftButtonForRisk();
    }
);

chrome.storage.onChanged.addListener(
    (changes, areaName) => {
        if (
            areaName === "local" &&
            changes.autoReplyLastRunSummary
        ) {
            displayAutoReplyRunSummary(
                changes
                    .autoReplyLastRunSummary
                    .newValue
            );
        }
    }
);

loadConnectionStatus();
loadReplySettings();
loadAutoReplySettings();
loadAutoReplyRunSummary();
updateInstructionCharacterCount();

closeEmailButton.addEventListener(
    "click",
    () => {
        clearCustomReplyInstruction();
        resetRiskAssessment();

        createDraftButton.disabled = true;
        createDraftButton.textContent =
            "Create Gmail Draft";

        draftStatus.textContent = "";
        draftCreationInProgress = false;
        currentCreatedDraftId = null;
        currentCreatedDraftThreadId = null;
        openDraftsButton.hidden = true;

        emailDetailsCard.hidden = true;
        inboxCard.hidden = false;

        threadMessages.replaceChildren();

        selectedThread = null;

        generateReplyButton.disabled = true;

        replyPreview.hidden = true;
        generatedReply.value = "";
        replyStatus.textContent = "";
    }
);

function extractEmailAddress(value) {
    if (!value) {
        return "";
    }

    const match = value.match(/<([^>]+)>/);

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
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}


function getLatestReplyTarget(thread) {
    const messages =
        Array.isArray(thread?.messages)
            ? [...thread.messages].reverse()
            : [];

    for (const message of messages) {
        const headers =
            message.payload?.headers || [];

        const replyTo =
            getEmailHeader(headers, "Reply-To");

        const from =
            getEmailHeader(headers, "From");

        const recipient =
            extractEmailAddress(replyTo || from);

        if (recipient) {
            return {
                message,
                recipient,
                headers
            };
        }
    }

    return null;
}

async function generateAIReply() {
    openDraftsButton.hidden = true;

    console.log("Generate AI Reply clicked");
    console.log("Selected thread:", selectedThread);

    if (!selectedThread) {
        emailDetailsStatus.textContent =
            "Please load the complete email first.";

        return;
    }

    const messages =
        createBackendThreadMessages(
            selectedThread
        );

    if (messages.length === 0) {
        emailDetailsStatus.textContent =
            "No email messages are available.";

        return;
    }

    if (currentRiskAssessment.isSensitive) {
        riskReviewCheckbox.checked = false;
    }

    updateDraftButtonForRisk();

    generateReplyButton.disabled = true;
    generateReplyButton.textContent =
        "Generating Reply...";

    replyPreview.hidden = false;
    replyStatus.textContent =
        "Generating...";

    generatedReply.value = "";

    const replySettings =
        getReplySettingsFromForm();

    const customInstruction =
        getCustomReplyInstruction();

    try {
        const response = await fetch(
            "http://localhost:3000/api/generate-reply",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    subject:
                        selectedEmailSubject
                            .textContent
                            ?.trim() || "",

                    sender:
                        selectedEmailSender
                            .textContent
                            ?.trim() || "",

                    messages,

                    settings:
                        replySettings,

                    customInstruction
                })
            }
        );

        const data =
            await response.json().catch(
                () => null
            );

        console.log("Backend response:", data);

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                "Unable to generate the reply."
            );
        }

        if (!data?.reply?.trim()) {
            throw new Error(
                "Backend returned an empty reply."
            );
        }

        generatedReply.value =
            data.reply;

        const storedDraft =
            await getStoredDraftForThread(
                selectedThread?.id
            );

        if (storedDraft?.draftId) {
            showDraftAlreadyCreatedState(
                storedDraft
            );
        } else {
            createDraftButton.disabled = false;

            createDraftButton.textContent =
                "Create Gmail Draft";

            draftStatus.textContent = "";
        }

        updateDraftButtonForRisk();

        replyStatus.textContent =
            "Reply generated";

        emailDetailsStatus.textContent =
            "Professional reply generated successfully.";
    } catch (error) {
        console.error(
            "Generate AI reply error:",
            error
        );

        replyStatus.textContent =
            "Failed";

        emailDetailsStatus.textContent =
            error instanceof TypeError
                ? "Could not reach the AI reply backend at localhost:3000."
                : error instanceof Error
                    ? error.message
                    : "Unable to generate AI reply.";
    } finally {
        generateReplyButton.disabled =
            false;

        generateReplyButton.textContent =
            "Regenerate AI Reply";
    }
}
generateReplyButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await generateAIReply();
    }
);

async function getCreatedDraftsByThread() {
    const result =
        await chrome.storage.local.get(
            "createdDraftsByThread"
        );

    const storedDrafts =
        result.createdDraftsByThread;

    if (
        !storedDrafts ||
        typeof storedDrafts !== "object" ||
        Array.isArray(storedDrafts)
    ) {
        return {};
    }

    return storedDrafts;
}


async function getStoredDraftForThread(
    threadId
) {
    if (!threadId) {
        return null;
    }

    const createdDrafts =
        await getCreatedDraftsByThread();

    return createdDrafts[threadId] || null;
}


async function saveCreatedDraftForThread({
    threadId,
    draftId
}) {
    if (!threadId || !draftId) {
        return;
    }

    const createdDrafts =
        await getCreatedDraftsByThread();

    createdDrafts[threadId] = {
        draftId,
        createdAt:
            new Date().toISOString()
    };

    await chrome.storage.local.set({
        createdDraftsByThread:
            createdDrafts
    });
}


function showDraftAlreadyCreatedState(
    draftRecord
) {
    currentCreatedDraftId =
        draftRecord?.draftId || null;

    currentCreatedDraftThreadId =
        selectedThread?.id || null;

    createDraftButton.disabled = true;

    createDraftButton.textContent =
        "Draft Created";

    draftStatus.textContent =
        "A Gmail Draft has already been created for this email.";

    openDraftsButton.hidden = false;
}


function showDraftAvailableState() {
    currentCreatedDraftId = null;
    currentCreatedDraftThreadId = null;

    createDraftButton.disabled =
        !generatedReply.value.trim();

    createDraftButton.textContent =
        "Create Gmail Draft";

    draftStatus.textContent = "";

    openDraftsButton.hidden = true;
}


async function restoreDraftStateForThread(
    threadId
) {
    if (!threadId) {
        showDraftAvailableState();
        return;
    }

    try {
        const storedDraft =
            await getStoredDraftForThread(
                threadId
            );

        if (storedDraft?.draftId) {
            showDraftAlreadyCreatedState(
                storedDraft
            );

            return;
        }

        showDraftAvailableState();
    } catch (error) {
        console.error(
            "Restore draft state error:",
            error
        );

        showDraftAvailableState();
    }
}

async function createGmailDraft() {
    openDraftsButton.hidden = true;

    const replyBody =
        generatedReply.value.trim();

    if (!selectedThread) {
        draftStatus.textContent =
            "Please load an email conversation first.";

        return;
    }

    if (!replyBody) {
        draftStatus.textContent =
            "Please generate or write a reply first.";

        return;
    }

    if (
        currentRiskAssessment.isSensitive &&
        !riskReviewCheckbox.checked
    ) {
        updateDraftButtonForRisk();

        draftStatus.textContent =
            "Please review the sensitive-email warning and confirm it before creating a Gmail Draft.";

        return;
    }

    const selectedThreadId =
        selectedThread.id;

    if (!selectedThreadId) {
        draftStatus.textContent =
            "The Gmail thread ID is missing.";

        return;
    }

    if (draftCreationInProgress) {
        draftStatus.textContent =
            "A Gmail Draft is already being created.";

        return;
    }

    createDraftButton.disabled = true;

    const existingDraft =
        await getStoredDraftForThread(
            selectedThreadId
        );

    if (existingDraft?.draftId) {
        showDraftAlreadyCreatedState(
            existingDraft
        );

        return;
    }

    const replyTarget =
        getLatestReplyTarget(selectedThread);

    if (!replyTarget) {
        draftStatus.textContent =
            "The recipient could not be identified.";

        return;
    }

    const {
        recipient,
        headers
    } = replyTarget;

    const originalSubject =
        getEmailHeader(headers, "Subject") ||
        selectedEmailSubject.textContent ||
        "Email reply";

    const messageId =
        getEmailHeader(headers, "Message-ID");

    const existingReferences =
        getEmailHeader(headers, "References");

    const references = [
        existingReferences,
        messageId
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    const mimeHeaders = [
        `To: ${sanitizeEmailHeader(recipient)}`,
        `Subject: ${sanitizeEmailHeader(originalSubject)}`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit"
    ];

    if (messageId) {
        mimeHeaders.push(
            `In-Reply-To: ${sanitizeEmailHeader(messageId)}`
        );
    }

    if (references) {
        mimeHeaders.push(
            `References: ${sanitizeEmailHeader(references)}`
        );
    }

    const mimeMessage =
        `${mimeHeaders.join("\r\n")}\r\n\r\n${replyBody}`;

    const rawMessage =
        encodeBase64Url(mimeMessage);

    draftCreationInProgress = true;
    createDraftButton.disabled = true;
    createDraftButton.textContent =
        "Creating Draft...";

    draftStatus.textContent =
        "Saving reply to Gmail Drafts...";

    let draftCreatedSuccessfully = false;

    try {
        const accessToken =
            await getGmailToken();

        const response = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: {
                        threadId:
                            selectedThread.id,

                        raw:
                            rawMessage
                    }
                })
            }
        );

        const data =
            await response.json().catch(
                () => null
            );

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                "Gmail could not create the draft."
            );
        }

        if (!data?.id) {
            throw new Error(
                "Gmail created the draft but did not return a draft ID."
            );
        }

        await saveCreatedDraftForThread({
            threadId:
                selectedThreadId,

            draftId:
                data.id
        });

        showDraftAlreadyCreatedState({
            draftId:
                data.id
        });

        draftCreatedSuccessfully = true;
    } catch (error) {
        console.error(
            "Create Gmail Draft error:",
            error
        );

        draftStatus.textContent =
            error instanceof Error
                ? error.message
                : "Unable to create Gmail Draft.";
    } finally {
        draftCreationInProgress = false;

        if (!draftCreatedSuccessfully) {
            createDraftButton.disabled = false;

            createDraftButton.textContent =
                "Create Gmail Draft";
        }
    }
}
createDraftButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        await createGmailDraft();
    }
);
openDraftsButton.addEventListener(
    "click",
    async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            await chrome.tabs.create({
                url: "https://mail.google.com/mail/#drafts"
            });
        } catch (error) {
            console.error(
                "Open Gmail Drafts error:",
                error
            );

            draftStatus.textContent =
                "Unable to open Gmail Drafts.";
        }
    }
);
