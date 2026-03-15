export async function getGmailAccessToken(): Promise<string | null> {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        console.error("[Gmail API] Faltan credenciales en variables de entorno.");
        return null;
    }

    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Gmail API] Error renovando token:", errorText);
            return null;
        }

        const data = await response.json();
        return data.access_token;
    } catch (e) {
        console.error("[Gmail API] Error en petición de token:", e);
        return null;
    }
}

/**
 * Encodes a string (like an email RFC 2822 payload) to base64url format
 */
function encodeBase64URL(str: string): string {
    // Buffer acts as an intermediate to correctly encode utf-8 (accents, emojis) to base64
    const base64 = Buffer.from(str, 'utf-8').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encodes a header value (like Subject or From Name) using MIME Encoded-Word syntax (RFC 1342)
 * so that special UTF-8 characters display correctly in the email client.
 */
function encodeMimeHeader(text: string): string {
    return `=?utf-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;
}

interface EmailAttachment {
    filename: string;
    mimeType: string;
    content: Buffer; // raw file bytes
}

interface SendEmailParams {
    toEmail: string;
    toName?: string;
    ccEmails?: string[];     // Emails en copia
    subject: string;
    htmlBody: string;
    threadId?: string;       // Si es respuesta a un hilo
    inReplyToRef?: string;   // El Message-ID del mensaje al que respondemos
    attachments?: EmailAttachment[];  // Archivos adjuntos
}

export async function sendEmail({ toEmail, toName, ccEmails, subject, htmlBody, threadId, inReplyToRef, attachments }: SendEmailParams) {
    const accessToken = await getGmailAccessToken();
    const fromEmail = process.env.GMAIL_USER_EMAIL || "gestionsancoraomsiniestros@gmail.com";
    const fromName = "Estudio AOM Siniestros · CLARITY";

    if (!accessToken || !fromEmail) {
        return { success: false, error: "Missing config or access token" };
    }

    const safeFromName = encodeMimeHeader(fromName);
    const safeToName = toName ? encodeMimeHeader(toName) : "";
    const to = safeToName ? `"${safeToName}" <${toEmail}>` : toEmail;

    let rawStr = `From: "${safeFromName}" <${fromEmail}>\r\n`;
    rawStr += `To: ${to}\r\n`;
    if (ccEmails && ccEmails.length > 0) {
        rawStr += `Cc: ${ccEmails.join(", ")}\r\n`;
    }
    rawStr += `Subject: ${encodeMimeHeader(subject)}\r\n`;
    rawStr += `MIME-Version: 1.0\r\n`;

    if (inReplyToRef) {
        rawStr += `In-Reply-To: ${inReplyToRef}\r\n`;
        rawStr += `References: ${inReplyToRef}\r\n`;
    }

    if (attachments && attachments.length > 0) {
        // Multipart MIME with attachments
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        rawStr += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
        rawStr += `\r\n`;
        rawStr += `--${boundary}\r\n`;
        rawStr += `Content-Type: text/html; charset=utf-8\r\n`;
        rawStr += `\r\n`;
        rawStr += htmlBody;
        rawStr += `\r\n`;

        for (const att of attachments) {
            const b64 = att.content.toString('base64');
            rawStr += `--${boundary}\r\n`;
            rawStr += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
            rawStr += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
            rawStr += `Content-Transfer-Encoding: base64\r\n`;
            rawStr += `\r\n`;
            // Split base64 into 76-char lines per RFC 2045
            for (let i = 0; i < b64.length; i += 76) {
                rawStr += b64.substring(i, i + 76) + `\r\n`;
            }
        }
        rawStr += `--${boundary}--\r\n`;
    } else {
        // Simple HTML email (no attachments)
        rawStr += `Content-Type: text/html; charset=utf-8\r\n`;
        rawStr += `\r\n${htmlBody}`;
    }

    const rawAscii = encodeBase64URL(rawStr);

    const body: any = { raw: rawAscii };
    if (threadId) {
        body.threadId = threadId;
    }

    try {
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${fromEmail}/messages/send`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const rawError = await response.text();
            console.error("[Gmail API] Error enviando email:", rawError);
            return { success: false, error: rawError };
        }

        const data = await response.json();
        // Returns the messageId inside the thread and the threadId
        return {
            success: true,
            messageId: data.id as string,
            threadId: data.threadId as string,
            responseMessageId: null // We will extract the actual RFC Message-ID later if needed, but the API 'id' often suffices for internal threading references.
        };
    } catch (e: any) {
        console.error("[Gmail API] Catch error enviando email:", e);
        return { success: false, error: e.message };
    }
}
