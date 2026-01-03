import { prisma } from "./prisma";

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
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // Fail silent to not crash the main request
    }
}
