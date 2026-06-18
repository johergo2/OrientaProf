import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { messageSchema } from "@/lib/validations"
import { successResponse, unauthorizedResponse, validationErrorResponse, serverErrorResponse, notFoundResponse } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const userId = session.user.id
    const url = new URL(req.url)
    const requestId = url.searchParams.get("requestId")

    if (requestId) {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          title: true,
          status: true,
          clientId: true,
          professionalId: true,
          client: { select: { id: true, username: true, fullName: true } },
          professional: { select: { id: true, username: true, fullName: true } },
        },
      })

      if (!request) return notFoundResponse("La conversación")

      const isParticipant =
        userId === request.clientId || userId === request.professionalId
      if (!isParticipant) return unauthorizedResponse("No eres participante de esta conversación")

      const messages = await prisma.message.findMany({
        where: { requestId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          senderId: true,
          receiverId: true,
          read: true,
          createdAt: true,
          messageType: true,
          structuredData: true,
        },
      })

      const otherUser =
        userId === request.clientId ? request.professional : request.client

      return successResponse({
        currentUserId: userId,
        currentUserRole: session.user.role,
        request: {
          id: request.id,
          title: request.title,
          status: request.status,
          clientId: request.clientId,
          professionalId: request.professionalId,
        },
        otherUser: otherUser
          ? { id: otherUser.id, username: otherUser.username, fullName: otherUser.fullName }
          : null,
        messages,
      })
    }

    const userMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        senderId: true,
        receiverId: true,
        read: true,
        createdAt: true,
        requestId: true,
      },
    })

    const grouped = new Map<string, {
      requestId: string
      messages: typeof userMessages
      unreadCount: number
    }>()

    for (const msg of userMessages) {
      if (!msg.requestId) continue
      const group = grouped.get(msg.requestId)
      if (group) {
        group.messages.push(msg)
        if (msg.receiverId === userId && !msg.read) {
          group.unreadCount++
        }
      } else {
        grouped.set(msg.requestId, {
          requestId: msg.requestId,
          messages: [msg],
          unreadCount: msg.receiverId === userId && !msg.read ? 1 : 0,
        })
      }
    }

    const requestIds = Array.from(grouped.keys())

    const requests = await prisma.request.findMany({
      where: { id: { in: requestIds } },
      select: {
        id: true,
        title: true,
        clientId: true,
        professionalId: true,
        client: { select: { id: true, username: true, fullName: true } },
        professional: { select: { id: true, username: true, fullName: true } },
      },
    })

    const requestMap = new Map(requests.map((r) => [r.id, r]))

    const conversations = Array.from(grouped.entries())
      .map(([reqId, group]) => {
        const req = requestMap.get(reqId)
        if (!req) return null

        const otherUser =
          userId === req.clientId ? req.professional : req.client

        const lastMsg = group.messages[0]

        return {
          requestId: reqId,
          requestTitle: req.title,
          otherUser: otherUser
            ? { id: otherUser.id, username: otherUser.username, fullName: otherUser.fullName }
            : null,
          lastMessage: {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt.toISOString(),
            senderId: lastMsg.senderId,
          },
          unreadCount: group.unreadCount,
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())

    const isProfessional = session.user.role === "PROFESSIONAL"

    const pendingProposals = isProfessional
      ? conversations.filter((c) => {
          const req = requestMap.get(c.requestId)
          return req && req.professionalId === userId && c.lastMessage.senderId !== userId
        }).length
      : 0

    return successResponse({
      conversations,
      currentUserRole: session.user.role,
      totalUnread: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      pendingProposals,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return serverErrorResponse("Error al obtener mensajes")
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return unauthorizedResponse()

    const userId = session.user.id
    const body = await req.json()
    const parsed = messageSchema.safeParse(body)

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors)
    }

    const { receiverId, requestId, content, messageType, structuredData } = parsed.data

    if (receiverId === userId) {
      return validationErrorResponse({ receiverId: ["No puedes enviarte un mensaje a ti mismo"] })
    }

    if (requestId) {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: { id: true, clientId: true, professionalId: true },
      })

      if (!request) return notFoundResponse("La consulta")

      const isParticipant =
        userId === request.clientId || userId === request.professionalId
      if (!isParticipant) {
        return unauthorizedResponse("No eres participante de esta consulta")
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        requestId: requestId ?? null,
        content,
        messageType: (messageType as any) ?? "REGULAR",
        structuredData: structuredData ?? undefined,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        receiverId: true,
        read: true,
        createdAt: true,
        requestId: true,
        messageType: true,
        structuredData: true,
      },
    })

    return successResponse(message, 201)
  } catch (error) {
    console.error("Error sending message:", error)
    return serverErrorResponse("Error al enviar mensaje")
  }
}
