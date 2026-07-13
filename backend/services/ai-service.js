import OpenAI from "openai";

function createOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "OPENAI_API_KEY is missing from the backend .env file."
        );
    }

    return new OpenAI({
        apiKey
    });
}

function formatEmailThread(messages) {
    return messages
        .slice(-10)
        .map((message, index) => {
            return `
Message ${index + 1}

From: ${message.from || "Unknown sender"}
To: ${message.to || "Unknown recipient"}
Date: ${message.date || "Unknown date"}

${message.body || "No email body"}
      `.trim();
        })
        .join("\n\n--------------------\n\n");
}

export async function generateEmailReply({
    subject,
    sender,
    messages,
    settings = {},
    customInstruction = ""
}) {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error(
            "At least one email message is required."
        );
    }

    const client = createOpenAIClient();

    const formattedThread =
        formatEmailThread(messages);

    const allowedTones = [
        "professional",
        "friendly",
        "formal",
        "concise"
    ];

    const allowedLengths = [
        "short",
        "medium",
        "detailed"
    ];

    const safeSettings =
        settings &&
        typeof settings === "object" &&
        !Array.isArray(settings)
            ? settings
            : {};

    const requestedTone =
        typeof safeSettings.tone === "string"
            ? safeSettings.tone
            : "professional";

    const requestedLength =
        typeof safeSettings.length === "string"
            ? safeSettings.length
            : "medium";

    const replySettings = {
        tone:
            allowedTones.includes(requestedTone)
                ? requestedTone
                : "professional",

        length:
            allowedLengths.includes(requestedLength)
                ? requestedLength
                : "medium",

        name:
            typeof safeSettings.name === "string" &&
            safeSettings.name.trim()
                ? safeSettings.name.trim()
                : "Hassan Tanveer",

        role:
            typeof safeSettings.role === "string"
                ? safeSettings.role.trim()
                : "",

        signature:
            typeof safeSettings.signature === "string" &&
            safeSettings.signature.trim()
                ? safeSettings.signature.trim()
                : "Best regards,\nHassan Tanveer"
    };

    const safeCustomInstruction =
        typeof customInstruction === "string"
            ? customInstruction
                .trim()
                .slice(0, 1000)
            : "";

    const response =
        await client.responses.create({
            model:
                process.env.OPENAI_MODEL ||
                "gpt-5-mini",

            reasoning: {
                effort: "low"
            },

            instructions: `
You are writing an email reply on behalf of ${replySettings.name}.

Role:
${replySettings.role || "Not specified"}

Required tone:
${replySettings.tone}

Required length:
${replySettings.length}

Required signature:
${replySettings.signature}

Custom instruction from the user:
${safeCustomInstruction || "No additional instruction was provided."}

Rules:

- Read the complete email thread before writing the reply.
- Reply in the language used by the latest sender, unless the custom instruction explicitly requests another language.
- Follow the selected tone and length.
- Follow the custom instruction when it is relevant and possible.
- Use the custom instruction as user-provided direction, but do not invent supporting facts.
- If the custom instruction mentions availability, dates, prices, deadlines or commitments, use only the exact information provided in that instruction or in the email thread.
- Never invent missing dates, prices, availability, links, promises, payment details or business terms.
- Do not accept contracts, refunds, payments or legal terms unless the user explicitly provided that exact decision in the custom instruction.
- If the custom instruction conflicts with the latest email context, produce a cautious reply that asks for clarification instead of inventing information.
- Keep the reply natural and professional.
- Use the provided signature exactly once at the end.
- Use the provided role only when relevant.
- Do not mention that AI generated the reply.
- Do not include an email subject.
- Return only the reply body.
      `.trim(),

            input: `
Email subject:
${subject || "No subject"}

Latest sender:
${sender || "Unknown sender"}

Complete email conversation:

${formattedThread}

Write the most appropriate reply using the required settings.
      `.trim()
        });

    const reply =
        response.output_text?.trim();

    if (!reply) {
        throw new Error(
            "The AI model did not return a reply."
        );
    }

    return reply;
}
const CLASSIFIER_MODEL =
    process.env.OPENAI_CLASSIFIER_MODEL ||
    "gpt-5.6-luna";

const REPLY_MODEL =
    process.env.OPENAI_REPLY_MODEL ||
    "gpt-5.6-terra";

export const EMAIL_CATEGORIES = [
    "acknowledgement",
    "thank_you",
    "received_message",
    "simple_confirmation",
    "simple_question",
    "information_request",
    "project_inquiry",
    "customer_support",
    "meeting_request",
    "availability_request",
    "deadline_or_commitment",
    "payment_or_invoice",
    "contract_or_legal",
    "security_or_credentials",
    "refund_or_cancellation",
    "complaint",
    "job_or_salary",
    "personal_sensitive",
    "newsletter",
    "marketing",
    "automated_notification",
    "spam",
    "unclear",
    "other"
];

export const EMAIL_ACTIONS = [
    "ignore",
    "no_reply_needed",
    "auto_send",
    "create_draft",
    "manual_review"
];

export const RISK_LEVELS = [
    "low",
    "medium",
    "high"
];

const CLASSIFICATION_REQUIRED_FIELDS = [
    "category",
    "actionRecommendation",
    "riskLevel",
    "confidence",
    "shouldReply",
    "shouldAutoSend",
    "requiresHumanDecision",
    "isAutomated",
    "isBulk",
    "isSpam",
    "language",
    "urgency",
    "missingInformation",
    "sensitiveTopics",
    "replyGoal",
    "reason"
];

const AUTO_REPLY_CLASSIFICATION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        category: {
            type: "string",
            enum: EMAIL_CATEGORIES
        },
        actionRecommendation: {
            type: "string",
            enum: EMAIL_ACTIONS
        },
        riskLevel: {
            type: "string",
            enum: RISK_LEVELS
        },
        confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
        },
        shouldReply: {
            type: "boolean"
        },
        shouldAutoSend: {
            type: "boolean"
        },
        requiresHumanDecision: {
            type: "boolean"
        },
        isAutomated: {
            type: "boolean"
        },
        isBulk: {
            type: "boolean"
        },
        isSpam: {
            type: "boolean"
        },
        language: {
            type: "string",
            maxLength: 20
        },
        urgency: {
            type: "string",
            enum: [
                "low",
                "normal",
                "high"
            ]
        },
        missingInformation: {
            type: "array",
            maxItems: 10,
            items: {
                type: "string",
                maxLength: 150
            }
        },
        sensitiveTopics: {
            type: "array",
            maxItems: 10,
            items: {
                type: "string",
                maxLength: 150
            }
        },
        replyGoal: {
            type: "string",
            maxLength: 300
        },
        reason: {
            type: "string",
            maxLength: 500
        }
    },
    required:
        CLASSIFICATION_REQUIRED_FIELDS
};

function getFailClosedClassification() {
    return {
        category: "unclear",
        actionRecommendation:
            "manual_review",
        riskLevel: "high",
        confidence: 0,
        shouldReply: false,
        shouldAutoSend: false,
        requiresHumanDecision: true,
        isAutomated: false,
        isBulk: false,
        isSpam: false,
        language: "unknown",
        urgency: "normal",
        missingInformation: [],
        sensitiveTopics: [],
        replyGoal:
            "Manual review required.",
        reason:
            "The email classification could not be validated."
    };
}

function normalizeThreadText(
    value,
    maximumLength
) {
    return String(value || "")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maximumLength);
}

function formatAutoReplyThread(messages) {
    const recentMessages =
        messages.slice(-8);

    const sections =
        recentMessages.map(
            (message, index) => {
                const isLatest =
                    index ===
                    recentMessages.length - 1;

                const body =
                    normalizeThreadText(
                        message.body ||
                            "No email body",
                        isLatest
                            ? 12000
                            : 4000
                    );

                return [
                    "Message " +
                        (index + 1) +
                        (isLatest
                            ? " (latest)"
                            : ""),
                    "From: " +
                        normalizeThreadText(
                            message.from ||
                                "Unknown sender",
                            500
                        ),
                    "To: " +
                        normalizeThreadText(
                            message.to ||
                                "Unknown recipient",
                            500
                        ),
                    "Date: " +
                        normalizeThreadText(
                            message.date ||
                                "Unknown date",
                            200
                        ),
                    "Subject: " +
                        normalizeThreadText(
                            message.subject ||
                                "No subject",
                            1000
                        ),
                    "",
                    body
                ].join("\n");
            }
        );

    const selectedSections = [];
    let remaining = 30000;

    for (
        let index = sections.length - 1;
        index >= 0 && remaining > 0;
        index -= 1
    ) {
        const separatorLength =
            selectedSections.length > 0
                ? 26
                : 0;

        const available =
            remaining - separatorLength;

        if (available <= 0) {
            break;
        }

        const section =
            sections[index].slice(
                0,
                available
            );

        selectedSections.unshift(section);

        remaining -=
            section.length +
            separatorLength;
    }

    return selectedSections.join("\n\n--------------------\n\n");
}

function normalizeReplySettings(settings) {
    const safeSettings =
        settings &&
        typeof settings === "object" &&
        !Array.isArray(settings)
            ? settings
            : {};

    const allowedTones = [
        "professional",
        "friendly",
        "formal",
        "concise"
    ];

    const allowedLengths = [
        "short",
        "medium",
        "detailed"
    ];

    const tone =
        allowedTones.includes(
            safeSettings.tone
        )
            ? safeSettings.tone
            : "professional";

    const length =
        allowedLengths.includes(
            safeSettings.length
        )
            ? safeSettings.length
            : "medium";

    return {
        tone,
        length,
        name:
            typeof safeSettings.name ===
                "string" &&
            safeSettings.name.trim()
                ? safeSettings.name
                    .trim()
                    .slice(0, 100)
                : "Hassan Tanveer",
        role:
            typeof safeSettings.role ===
                "string"
                ? safeSettings.role
                    .trim()
                    .slice(0, 120)
                : "",
        signature:
            typeof safeSettings.signature ===
                "string" &&
            safeSettings.signature.trim()
                ? safeSettings.signature
                    .trim()
                    .slice(0, 500)
                : "Best regards,\nHassan Tanveer"
    };
}

function hasValidStringArray(
    value,
    maximumItems
) {
    return (
        Array.isArray(value) &&
        value.length <= maximumItems &&
        value.every(
            (item) =>
                typeof item === "string" &&
                item.length <= 150
        )
    );
}

export function isValidAutoReplyClassification(
    value
) {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        Object.keys(value).length !==
            CLASSIFICATION_REQUIRED_FIELDS.length ||
        !CLASSIFICATION_REQUIRED_FIELDS.every(
            (field) =>
                Object.prototype
                    .hasOwnProperty.call(
                        value,
                        field
                    )
        )
    ) {
        return false;
    }

    return (
        EMAIL_CATEGORIES.includes(
            value.category
        ) &&
        EMAIL_ACTIONS.includes(
            value.actionRecommendation
        ) &&
        RISK_LEVELS.includes(
            value.riskLevel
        ) &&
        Number.isFinite(
            value.confidence
        ) &&
        value.confidence >= 0 &&
        value.confidence <= 1 &&
        typeof value.shouldReply ===
            "boolean" &&
        typeof value.shouldAutoSend ===
            "boolean" &&
        typeof value.requiresHumanDecision ===
            "boolean" &&
        typeof value.isAutomated ===
            "boolean" &&
        typeof value.isBulk ===
            "boolean" &&
        typeof value.isSpam ===
            "boolean" &&
        typeof value.language ===
            "string" &&
        value.language.length <= 20 &&
        [
            "low",
            "normal",
            "high"
        ].includes(value.urgency) &&
        hasValidStringArray(
            value.missingInformation,
            10
        ) &&
        hasValidStringArray(
            value.sensitiveTopics,
            10
        ) &&
        typeof value.replyGoal ===
            "string" &&
        value.replyGoal.length <= 300 &&
        typeof value.reason ===
            "string" &&
        value.reason.length <= 500
    );
}

function responseContainsRefusal(response) {
    const output =
        Array.isArray(response?.output)
            ? response.output
            : [];

    return output.some(
        (item) =>
            Array.isArray(item?.content) &&
            item.content.some(
                (content) =>
                    content?.type ===
                    "refusal"
            )
    );
}

function isTransientOpenAIError(error) {
    const status =
        Number(error?.status);

    return (
        status === 408 ||
        status === 409 ||
        status === 429 ||
        status >= 500 ||
        error?.name ===
            "APIConnectionError" ||
        error?.name ===
            "APIConnectionTimeoutError"
    );
}

function parseStructuredClassification(
    response
) {
    if (
        response?.status !== "completed" ||
        responseContainsRefusal(response) ||
        !response.output_text
    ) {
        return getFailClosedClassification();
    }

    try {
        const decision =
            JSON.parse(
                response.output_text
            );

        return isValidAutoReplyClassification(
            decision
        )
            ? decision
            : getFailClosedClassification();
    } catch {
        return getFailClosedClassification();
    }
}

export async function classifyEmailForAutoReply({
    subject,
    sender,
    messages,
    settings = {}
}) {
    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {
        throw new Error(
            "At least one email message is required."
        );
    }

    const client = createOpenAIClient();

    const formattedThread =
        formatAutoReplyThread(messages);

    const replySettings =
        normalizeReplySettings(settings);

    const instructions = [
        "You are a conservative email-routing and auto-reply classifier.",
        "",
        "Read the supplied thread, but classify only the latest incoming message.",
        "Your output controls whether an email may be sent automatically, so uncertainty must reduce confidence and prevent auto-send.",
        "",
        "Rules:",
        "- Identify the latest incoming sender's intent.",
        "- Distinguish reply-worthy personal messages from automated or bulk messages.",
        "- shouldReply is false for newsletters, spam, no-reply mail, system notifications, delivery failures and receipts that need no response.",
        "- shouldAutoSend may be true only when the email is low-risk, completely understood and requires no personal decision.",
        "- shouldAutoSend must be false when any important fact, decision or commitment is missing.",
        "- requiresHumanDecision is true when Hassan must decide availability, price, timeline, acceptance, rejection, refund, payment, contract terms or another commitment.",
        "- Never assume Hassan's schedule, price, opinion, agreement or availability.",
        "- Payments, invoices, contracts, legal matters, security, passwords, OTPs, refunds, complaints, salary and personal sensitive information are medium or high risk.",
        "- Meeting and availability requests require a human decision unless the exact answer is explicitly present in verified settings or the supplied thread.",
        "- Treat attachment-bearing messages conservatively.",
        "- Classify mailing lists, newsletters, marketing messages and automated alerts accurately.",
        "- A polite thank-you does not always need a reply.",
        "- Confidence reflects actual certainty, not desired certainty.",
        "- When uncertain, choose unclear, manual_review and lower confidence.",
        "- Do not generate the final email reply.",
        "- Return only schema-compliant structured data.",
        "",
        "Configured user:",
        "Name: " + replySettings.name,
        "Role: " +
            (replySettings.role ||
                "Not specified"),
        "Tone: " + replySettings.tone
    ].join("\n");

    const input = [
        "Email subject:",
        normalizeThreadText(
            subject || "No subject",
            1000
        ),
        "",
        "Latest sender:",
        normalizeThreadText(
            sender || "Unknown sender",
            500
        ),
        "",
        "Normalized email thread:",
        "",
        formattedThread
    ].join("\n");

    try {
        const response =
            await client.responses.create(
                {
                    model:
                        CLASSIFIER_MODEL,
                    reasoning: {
                        effort: "none"
                    },
                    store: false,
                    max_output_tokens: 500,
                    text: {
                        format: {
                            type:
                                "json_schema",
                            name:
                                "email_auto_reply_classification",
                            description:
                                "A conservative routing decision for the latest incoming email.",
                            schema:
                                AUTO_REPLY_CLASSIFICATION_SCHEMA,
                            strict: true
                        }
                    },
                    instructions,
                    input
                },
                {
                    timeout: 12000,
                    maxRetries: 0
                }
            );

        return parseStructuredClassification(
            response
        );
    } catch (error) {
        if (
            isTransientOpenAIError(error)
        ) {
            throw error;
        }

        return getFailClosedClassification();
    }
}

function escapeRegularExpression(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

function countTextOccurrences(
    text,
    value
) {
    if (!value) {
        return 0;
    }

    const matches =
        text.match(
            new RegExp(
                escapeRegularExpression(
                    value
                ),
                "gi"
            )
        );

    return matches?.length || 0;
}

function validateGeneratedAutoReply({
    reply,
    settings,
    classification
}) {
    const safeReply =
        typeof reply === "string"
            ? reply.trim()
            : "";

    if (!safeReply) {
        return {
            valid: false,
            reason:
                "The generated reply was empty."
        };
    }

    if (safeReply.length > 5000) {
        return {
            valid: false,
            reason:
                "The generated reply was too long."
        };
    }

    if (/^\s*subject\s*:/im.test(safeReply)) {
        return {
            valid: false,
            reason:
                "The generated reply included a subject line."
        };
    }

    if (
        /\b(as an ai|ai-generated|language model)\b/i
            .test(safeReply)
    ) {
        return {
            valid: false,
            reason:
                "The generated reply included prohibited AI wording."
        };
    }

    if (
        /(\[(?:Name|Company|Date|Insert)[^\]]*\]|\bTODO\b)/i
            .test(safeReply)
    ) {
        return {
            valid: false,
            reason:
                "The generated reply included placeholder text."
        };
    }

    if (
        /^(to|from|cc|bcc|content-type|mime-version|in-reply-to|references)\s*:/im
            .test(safeReply)
    ) {
        return {
            valid: false,
            reason:
                "The generated reply included malformed email headers."
        };
    }

    const signature =
        settings.signature.trim();

    const signatureCount =
        countTextOccurrences(
            safeReply,
            signature
        );

    if (signature && signatureCount === 0) {
        return {
            valid: false,
            reason:
                "The configured signature was missing."
        };
    }

    if (signatureCount > 1) {
        return {
            valid: false,
            reason:
                "The configured signature appeared more than once."
        };
    }

    const decisionSensitive =
        classification
            .requiresHumanDecision ||
        classification
            .missingInformation.length > 0;

    const commitmentPattern =
        /\b(i|we)\s+(will|can|agree|accept|approve|confirm)\s+(meet|attend|send|deliver|pay|refund|complete|finish|provide|sign|be available)\b/i;

    const datePattern =
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i;

    if (
        decisionSensitive &&
        (
            commitmentPattern.test(
                safeReply
            ) ||
            datePattern.test(
                safeReply
            )
        )
    ) {
        return {
            valid: false,
            reason:
                "The generated reply included an unsupported decision or commitment."
        };
    }

    return {
        valid: true,
        reason: ""
    };
}

export async function generateProfessionalAutoReply({
    subject,
    sender,
    messages,
    settings = {},
    classification
}) {
    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {
        throw new Error(
            "At least one email message is required."
        );
    }

    if (
        !isValidAutoReplyClassification(
            classification
        )
    ) {
        throw new Error(
            "A valid email classification is required."
        );
    }

    const client = createOpenAIClient();

    const replySettings =
        normalizeReplySettings(settings);

    const formattedThread =
        formatAutoReplyThread(messages);

    const instructions = [
        "You write polished email replies on behalf of " +
            replySettings.name +
            ".",
        "",
        "The reply must sound like a competent person wrote it after carefully reading the thread.",
        "",
        "Writing requirements:",
        "- Reply in the latest sender's language unless verified settings explicitly require another language.",
        "- Address the sender by name only when their name is clearly available.",
        "- Use the thread context naturally and start directly.",
        "- Avoid generic openings such as 'Thank you for reaching out', 'I hope this email finds you well' and 'I wanted to take a moment' unless they genuinely fit.",
        "- Do not repeat the complete question or over-explain.",
        "- Avoid exaggerated politeness, filler, corporate jargon and unnecessary enthusiasm.",
        "- Vary sentence structure naturally and match the sender's formality while respecting the configured tone.",
        "- Keep simple acknowledgements very short and specific.",
        "- Use names, dates and details only when they exist in the thread or verified settings.",
        "- Never invent availability, prices, deadlines, links, facts, opinions, decisions or commitments.",
        "- Never agree to a contract, refund, payment, meeting or deadline unless that exact decision is explicitly known.",
        "- Never mention AI, automation, classification or internal rules.",
        "- Do not include a subject line or quote the complete original email.",
        "- Use the configured signature exactly once.",
        "- Return only the final plain-text email body.",
        "",
        "Length guidance:",
        "- short: 1 to 4 short sentences before the signature.",
        "- medium: 1 to 3 compact paragraphs.",
        "- detailed: necessary detail while remaining concise.",
        "",
        "Category guidance:",
        "- acknowledgement: confirm receipt without inventing a later action.",
        "- thank_you: respond only as needed and avoid an unnecessary reply loop.",
        "- received_message: confirm only the exact received item when known.",
        "- simple_confirmation: confirm only facts explicit in the thread.",
        "- simple_question: answer only when the supplied context contains the complete answer.",
        "",
        "Configured tone: " +
            replySettings.tone,
        "Configured length: " +
            replySettings.length,
        "Configured role: " +
            (replySettings.role ||
                "Not specified"),
        "Required signature:",
        replySettings.signature
    ].join("\n");

    const input = [
        "Email subject:",
        normalizeThreadText(
            subject || "No subject",
            1000
        ),
        "",
        "Latest sender:",
        normalizeThreadText(
            sender || "Unknown sender",
            500
        ),
        "",
        "Validated classification:",
        JSON.stringify({
            category:
                classification.category,
            actionRecommendation:
                classification
                    .actionRecommendation,
            riskLevel:
                classification.riskLevel,
            language:
                classification.language,
            urgency:
                classification.urgency,
            replyGoal:
                classification.replyGoal,
            requiresHumanDecision:
                classification
                    .requiresHumanDecision,
            missingInformation:
                classification
                    .missingInformation,
            sensitiveTopics:
                classification
                    .sensitiveTopics
        }),
        "",
        "Normalized email thread:",
        "",
        formattedThread
    ].join("\n");

    const response =
        await client.responses.create(
            {
                model: REPLY_MODEL,
                reasoning: {
                    effort: "low"
                },
                store: false,
                max_output_tokens: 700,
                instructions,
                input
            },
            {
                timeout: 20000,
                maxRetries: 0
            }
        );

    const reply =
        response.output_text?.trim() || "";

    const validation =
        validateGeneratedAutoReply({
            reply,
            settings:
                replySettings,
            classification
        });

    return {
        reply:
            validation.valid
                ? reply
                : "",
        validation
    };
}
