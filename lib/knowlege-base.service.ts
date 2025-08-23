import { makeAuthenticatedRequest, handleApiResponse } from './api-utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
const API_PATH = '/v1/knowledge-base';
const ENDPOINT = API_BASE + API_PATH

export async function uploadDocumentAWS(file: File, userId: string): Promise<Document> {
    try {
        const fileContent = await file.arrayBuffer();
        const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileContent)));

        const response = await makeAuthenticatedRequest(`${ENDPOINT}/aws/upload`, {
            method: 'POST',
            body: JSON.stringify({
                title: file.name,
                content: base64Content,
                file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
                metadata: {
                    user_id: userId,
                    original_filename: file.name,
                    upload_timestamp: new Date().toISOString(),
                }
            })
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
}

const kbClient = {
    uploadDocumentAWS
}

export default kbClient
