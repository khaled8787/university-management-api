import { AuditAction, Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";

export interface CreateAuditLogInput {
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  oldData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entity?: string;
  actorId?: string;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export const createAuditLog = async (
  payload: CreateAuditLogInput,
) => {
  return prisma.auditLog.create({
    data: {
      actorId: payload.actorId ?? null,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId ?? null,
      description: payload.description ?? null,
      oldData: payload.oldData ?? undefined,
      newData: payload.newData ?? undefined,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
    },
  });
};

export const getAuditLogs = async (
  query: GetAuditLogsQuery,
) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (query.action) {
    where.action = query.action;
  }

  if (query.entity) {
    where.entity = {
      equals: query.entity,
      mode: "insensitive",
    };
  }

  if (query.actorId) {
    where.actorId = query.actorId;
  }

  if (query.search?.trim()) {
    where.OR = [
      {
        entity: {
          contains: query.search.trim(),
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search.trim(),
          mode: "insensitive",
        },
      },
      {
        entityId: {
          contains: query.search.trim(),
          mode: "insensitive",
        },
      },
    ];
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: query.sortOrder || "desc",
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getAuditLogById = async (
  id: string,
) => {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};