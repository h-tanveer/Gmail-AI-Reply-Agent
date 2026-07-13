import "dotenv/config";

import express from "express";
import cors from "cors";

import {
    generateEmailReply,
    classifyEmailForAutoReply,
    generateProfessionalAutoReply,
    isValidAutoReplyClassification
} from "./services/ai-service.js";

const app = express();

const port =
    Number(process.env.PORT) || 3000;

/*
 * Development mein Chrome extension ko
 * localhost backend access karne deta hai.
 */
app.use(
    cors({
        origin: true
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);

function isPlainObject(value) {
    return (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function hasValidAutomaticRequest({
    subject,
    sender,
    messages,
    settings
}) {
    return (
        typeof subject === "string" &&
        typeof sender === "string" &&
        Array.isArray(messages) &&
        messages.length > 0 &&
        messages.every(isPlainObject) &&
        isPlainObject(settings)
    );
}

/*
 * Backend test endpoint.
 */
app.get("/", (request, response) => {
    response.status(200).json({
        success: true,
        message: "Gmail AI Reply Agent backend is running."
    });
});

app.get("/health", (request, response) => {
    response.status(200).json({
        success: true,
        message:
            "Gmail AI Reply Agent backend is running."
    });
});

/*
 * Professional email reply generate karta hai.
 */
app.post(
    "/api/generate-reply",
    async (request, response) => {
        try {
            const {
                subject,
                sender,
                messages,
                settings,
                customInstruction
            } = request.body || {};

            if (
                !Array.isArray(messages) ||
                messages.length === 0
            ) {
                return response.status(400).json({
                    success: false,
                    error:
                        "A valid email thread is required."
                });
            }

            const reply =
                await generateEmailReply({
                    subject:
                        typeof subject === "string"
                            ? subject
                            : "",

                    sender:
                        typeof sender === "string"
                            ? sender
                            : "",

                    messages,

                    settings:
                        settings &&
                        typeof settings === "object" &&
                        !Array.isArray(settings)
                            ? settings
                            : {},

                    customInstruction:
                        typeof customInstruction === "string"
                            ? customInstruction
                                .trim()
                                .slice(0, 1000)
                            : ""
                });

            return response.status(200).json({
                success: true,
                reply
            });
        } catch (error) {
            console.error(
                "Generate reply error:",
                error
            );

            return response.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to generate the email reply."
            });
        }
    }
);

app.post(
    "/api/auto-reply-decision",
    async (request, response) => {
        try {
            const {
                subject,
                sender,
                messages,
                settings
            } = request.body || {};

            if (!hasValidAutomaticRequest({
                subject,
                sender,
                messages,
                settings
            })) {
                return response.status(400).json({
                    success: false,
                    error:
                        "A valid automatic-reply request is required."
                });
            }

            const decision =
                await classifyEmailForAutoReply({
                    subject:
                        subject,

                    sender:
                        sender,

                    messages,

                    settings
                });

            return response.status(200).json({
                success: true,
                decision
            });
        } catch (error) {
            console.error(
                "Auto-reply decision error:",
                error instanceof Error
                    ? error.message
                    : "Unknown error"
            );

            return response.status(503).json({
                success: false,
                error:
                    "Unable to classify the email right now."
            });
        }
    }
);

app.post(
    "/api/generate-auto-reply",
    async (request, response) => {
        try {
            const {
                subject,
                sender,
                messages,
                settings,
                classification
            } = request.body || {};

            if (
                !hasValidAutomaticRequest({
                    subject,
                    sender,
                    messages,
                    settings
                }) ||
                !isValidAutoReplyClassification(
                    classification
                )
            ) {
                return response.status(400).json({
                    success: false,
                    error:
                        "A valid classified email thread is required."
                });
            }

            const result =
                await generateProfessionalAutoReply({
                    subject,
                    sender,
                    messages,
                    settings,
                    classification
                });

            if (!result.validation.valid) {
                return response.status(422).json({
                    success: false,
                    error:
                        "Generated reply did not pass quality validation.",
                    validation:
                        result.validation
                });
            }

            return response.status(200).json({
                success: true,
                reply:
                    result.reply,
                validation: {
                    valid: true
                }
            });
        } catch (error) {
            console.error(
                "Generate auto-reply error:",
                error instanceof Error
                    ? error.message
                    : "Unknown error"
            );

            return response.status(503).json({
                success: false,
                error:
                    "Unable to generate the automatic reply right now."
            });
        }
    }
);

app.listen(port, () => {
    console.log(
        `Backend running at http://localhost:${port}`
    );
});