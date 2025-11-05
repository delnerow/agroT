const { neon } = require('@neondatabase/serverless')

// Use NETLIFY_DATABASE_URL (set in Netlify) or fall back to DATABASE_URL
const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || null
const sql = connectionString ? neon(connectionString) : null

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' }
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed' }) }
    }

    try {
        if (!sql) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ message: 'Database connection not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL.' })
            }
        }

        // Query plants table. Adjust column names if your schema differs.
        const rows = await sql`
            SELECT id, nome, tipoPlanta, estagioAtual, tipoSolo, areaHa, custoSafraAnterior, receitaSafraAnterior, farmId, createdAt, updatedAt
            FROM plants
            ORDER BY createdAt DESC
        `

        // Map DB columns to frontend-friendly camelCase keys
        const plants = rows.map((r) => ({
            id: r.id,
            nome: r.nome,
            tipoPlanta: r.tipoPlanta,
            estagioAtual: r.estagioAtual,
            tipoSolo: r.tipoSolo,
            areaHa: Number(r.areaHa),
            custoSafraAnterior: Number(r.custoSafraAnterior),
            receitaSafraAnterior: Number(r.receitaSafraAnterior),
            farmId: r.farmId,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        }))

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(plants)
        }
    } catch (err) {
        console.error('Error fetching plants:', err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Error fetching plants' })
        }
    }
}
