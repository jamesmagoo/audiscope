import { makeAuthenticatedRequest, handleApiResponse } from './api-utils'
import type { AgentSession } from './agent/types'

// The agent server is called directly (no Next.js proxy — the same host also
// serves the /ws/agent WebSocket, which rewrites can't proxy anyway).
// Contract: ai_docs/agent-server-http-contract.md
const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL
const ENDPOINT = `${AGENT_API_URL}/api/agent`

export async function listAgentSessions(limit = 50, offset = 0): Promise<AgentSession[]> {
  try {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())

    const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions?${params.toString()}`)
    const data = await handleApiResponse(response)
    return data.sessions ?? []
  } catch (error) {
    console.error('Error listing agent sessions:', error)
    throw error
  }
}

export async function deleteAgentSession(sessionId: string): Promise<void> {
  try {
    const response = await makeAuthenticatedRequest(`${ENDPOINT}/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    if (response.status !== 204) {
      await handleApiResponse(response)
    }
  } catch (error) {
    console.error('Error deleting agent session:', error)
    throw error
  }
}

const agentClient = {
  listAgentSessions,
  deleteAgentSession,
}

export default agentClient
