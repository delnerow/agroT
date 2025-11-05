import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()

app.use(cors())
app.use(express.json())

// Plants endpoints
app.post('/api/plants', async (req, res) => {
  try {
    console.log('Creating plant:', req.body)
    const plant = await prisma.plant.create({
      data: req.body
    })
    console.log('Plant created:', plant)
    res.json(plant)
  } catch (error) {
    console.error('Error creating plant:', error)
    res.status(500).json({ error: String(error) })
  }
})

app.get('/api/plants', async (_req, res) => {
  try {
    const plants = await prisma.plant.findMany({
      include: { sensorData: true }
    })
    res.json(plants)
  } catch (error) {
    console.error('Error fetching plants:', error)
    res.status(500).json({ error: String(error) })
  }
})

app.put('/api/plants/:id', async (req, res) => {
  try {
    const plant = await prisma.plant.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(plant)
  } catch (error) {
    console.error('Error updating plant:', error)
    res.status(500).json({ error: String(error) })
  }
})

app.delete('/api/plants/:id', async (req, res) => {
  try {
    await prisma.plant.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting plant:', error)
    res.status(500).json({ error: String(error) })
  }
})

// Farm endpoints
app.get('/api/farm', async (_req, res) => {
  try {
    let farm = await prisma.farm.findFirst()
    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          id: 'default-farm',
          areaHa: 40,
          modulosFiscais: 4,
          uf: 'SP',
          tipoSolo: 'Argiloso'
        }
      })
    }
    res.json(farm)
  } catch (error) {
    console.error('Error fetching farm:', error)
    res.status(500).json({ error: String(error) })
  }
})

app.put('/api/farm', async (req, res) => {
  try {
    const farm = await prisma.farm.upsert({
      where: { id: req.body.id || 'default-farm' },
      update: req.body,
      create: {
        id: 'default-farm',
        ...req.body
      }
    })
    res.json(farm)
  } catch (error) {
    console.error('Error updating farm:', error)
    res.status(500).json({ error: String(error) })
  }
})

// Sensor data endpoints
app.post('/api/sensor-data', async (req, res) => {
  try {
    const data = await prisma.sensorData.create({
      data: req.body
    })
    res.json(data)
  } catch (error) {
    console.error('Error creating sensor data:', error)
    res.status(500).json({ error: String(error) })
  }
})

app.get('/api/sensor-data/:plantId', async (req, res) => {
  try {
    const data = await prisma.sensorData.findMany({
      where: { plantId: req.params.plantId },
      orderBy: { timestamp: 'desc' },
      take: 100
    })
    res.json(data)
  } catch (error) {
    console.error('Error fetching sensor data:', error)
    res.status(500).json({ error: String(error) })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})