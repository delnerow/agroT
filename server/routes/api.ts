import { prisma } from '../lib/prisma'
import express, { Request, Response } from 'express'

const router = express.Router()

// Get farm details
router.get('/farm', async (req, res) => {
  try {
    const farm = await prisma.farm.findFirst({
      include: {
        plants: true
      }
    })
    res.json(farm)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching farm data' })
  }
})

// Update farm details
router.put('/farm', async (req, res) => {
  try {
    const farm = await prisma.farm.upsert({
      where: {
        id: req.body.id || 'default-farm'
      },
      update: {
        areaHa: req.body.areaHa,
        modulosFiscais: req.body.modulosFiscais,
        uf: req.body.uf,
        tipoSolo: req.body.tipoSolo,
        lat: req.body.lat,
        lng: req.body.lng
      },
      create: {
        id: 'default-farm',
        ...req.body
      }
    })
    res.json(farm)
  } catch (error) {
    res.status(500).json({ error: 'Error updating farm data' })
  }
})

// Get all plants
router.get('/plants', async (req, res) => {
  try {
    const plants = await prisma.plant.findMany({
      include: {
        sensorData: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    })
    res.json(plants)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching plants' })
  }
})

// Add new plant
router.post('/plants', async (req, res) => {
  try {
    const plant = await prisma.plant.create({
      data: {
        ...req.body,
        farmId: req.body.farmId || 'default-farm'
      }
    })
    res.json(plant)
  } catch (error) {
    res.status(500).json({ error: 'Error creating plant' })
  }
})

// Update plant
router.put('/plants/:id', async (req, res) => {
  try {
    const plant = await prisma.plant.update({
      where: {
        id: req.params.id
      },
      data: req.body
    })
    res.json(plant)
  } catch (error) {
    res.status(500).json({ error: 'Error updating plant' })
  }
})

// Delete plant
router.delete('/plants/:id', async (req, res) => {
  try {
    await prisma.plant.delete({
      where: {
        id: req.params.id
      }
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Error deleting plant' })
  }
})

// Add sensor data
router.post('/sensor-data', async (req, res) => {
  try {
    const sensorData = await prisma.sensorData.create({
      data: {
        plantId: req.body.plantId,
        temperature: req.body.temperature,
        humidity: req.body.humidity
      }
    })
    res.json(sensorData)
  } catch (error) {
    res.status(500).json({ error: 'Error adding sensor data' })
  }
})

// Get sensor data for a plant
router.get('/sensor-data/:plantId', async (req, res) => {
  try {
    const sensorData = await prisma.sensorData.findMany({
      where: {
        plantId: req.params.plantId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100 // Last 100 readings
    })
    res.json(sensorData)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sensor data' })
  }
})

export default router