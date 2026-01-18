import { prisma } from "./prisma";
import { log } from "./logger";

export type AuditAction = 
    | 'CREATE' 
    | 'UPDATE' 
    | 'DELETE' 
    | 'LOGIN' 
    | 'LOGOUT' 
    | 'view' 
    | 'ACCESS_DENIED';

export type AuditResource = 
    | 'PLAYBOOK' 
    | 'MEMBER' 
    | 'OPERATION' 
    | 'SYSTEM'
    | 'MEDIA'
    | 'EXPERIMENT'
    | 'GUIDE'
    | 'EVENT'
    | 'PROGRAM'
    | 'MEDIA_KIT';

interface AuditLogParams {
    action: string;
    resource: string;
    resourceId?: string;
    actorId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

export async function logAudit(params: AuditLogParams) {
    try {
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                actorId: params.actorId || null,
                metadata: params.metadata || {},
            }
        });

        // HARDENING: Output to stdout for external log ingestion (Axiom/Datadog)
        // This ensures an immutable record exists outside the database.
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
            level: 'INFO',
            context: 'AUDIT_LOG',
            timestamp: new Date().toISOString(),
            ...params
        }));
    } catch (error) {
        log("ERROR", "Failed to write audit log", "AUDIT", {
            action: params.action,
            resource: params.resource,
            resourceId: params.resourceId
        }, error instanceof Error ? error : new Error(String(error)));
        // Fail silent to not crash the main request
    }
}
