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

interface LogParams {
    action: LogAction;
    entity: string;
    entityId?: string;
    actorEmail: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

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
        console.error("Failed to create audit log", error);
        // Fail silently to not block main thread action
    }
}
