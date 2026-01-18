import { prisma } from "@/lib/prisma";

export type LogAction = 
    | "CREATE" 
    | "UPDATE" 
    | "DELETE" 
    | "LOGIN" 
    | "LOGOUT" 
    | "APPROVE" 
    | "REJECT" 
    | "ARCHIVE" 
    | "RESTORE"
    | "SUBMIT";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogParams {
    action: LogAction;
    entity: string;
    entityId?: string;
    actorEmail: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

interface StructuredLogParams {
    level: LogLevel;
    message: string;
    context?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    error?: Error;
}

/**
 * Structured logging function for application logs
 * In production, this should integrate with a logging service (e.g., Sentry, LogRocket)
 */
export function log(level: LogLevel, message: string, context?: string, data?: any, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        context: context || "APPLICATION",
        ...(data && { data }),
        ...(error && { 
            error: {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        })
    };

    // In production, send to logging service
    // For now, use console with structured format
    if (level === "ERROR") {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(logEntry));
    } else if (level === "WARN") {
        // eslint-disable-next-line no-console
        console.warn(JSON.stringify(logEntry));
    } else if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(logEntry));
    }
}

/**
 * Audit logging for user actions
 */
export async function logActivity({ action, entity, entityId, actorEmail, metadata }: LogParams) {
    try {
        const actor = await prisma.member.findUnique({
            where: { email: actorEmail }
        });

        await prisma.log.create({
            data: {
                action,
                entity,
                entityId,
                actorId: actor?.id,
                metadata: metadata ? (typeof metadata === 'object' ? metadata : { info: metadata }) : undefined
            }
        });
    } catch (error) {
        log("ERROR", "Failed to create audit log", "AUDIT_LOG", { actorEmail, action, entity }, error instanceof Error ? error : new Error(String(error)));
        // Fail silently to not block main thread action
    }
}
