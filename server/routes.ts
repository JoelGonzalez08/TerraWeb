import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertSensorSchema, insertMeasurementSchema, insertDataFileSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { setupAuth, requireAuth, requireRole } from "./auth";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Sensor routes
  app.get("/api/sensors", async (req, res) => {
    try {
      const sensors = await storage.getSensors();
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sensors" });
    }
  });

  app.post("/api/sensors/connect", requireRole("technician"), async (req, res) => {
    try {
      // Simulate Bluetooth connection
      const sensor = await storage.createSensor({
        name: `Sensor #${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        type: "environmental",
        isActive: true,
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      });
      
      res.json({ message: "Sensor connected successfully", sensor });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect sensor" });
    }
  });

  app.post("/api/sensors/extract", requireRole("technician"), async (req, res) => {
    try {
      const sensors = await storage.getSensors();
      const activeSensors = sensors.filter(s => s.isActive);
      
      if (activeSensors.length === 0) {
        return res.status(400).json({ message: "No active sensors connected" });
      }

      // Generate sample measurements for connected sensors
      const measurements = [];
      for (const sensor of activeSensors.slice(0, 1)) { // Only use first sensor to avoid too much data
        const types = ["CO2", "temperature", "humidity"];
        for (const type of types) {
          let value: number;
          let unit: string;
          
          switch (type) {
            case "CO2":
              value = 350 + Math.random() * 150; // 350-500 ppm
              unit = "ppm";
              break;
            case "temperature":
              value = 20 + Math.random() * 10; // 20-30°C
              unit = "C";
              break;
            case "humidity":
              value = 40 + Math.random() * 40; // 40-80%
              unit = "%";
              break;
            default:
              value = Math.random() * 100;
              unit = "unit";
          }

          const measurement = await storage.createMeasurement({
            sensorId: sensor.id,
            measurementType: type,
            value: Math.round(value * 100) / 100,
            unit,
            latitude: sensor.latitude || 37.7749,
            longitude: sensor.longitude || -122.4194,
            status: value > (type === "CO2" ? 400 : 75) ? "moderate" : "good",
          });
          measurements.push(measurement);
        }
      }

      res.json({ 
        message: "Data extracted successfully", 
        measurements: measurements.length 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to extract data" });
    }
  });

  // Measurement routes
  app.get("/api/measurements", async (req, res) => {
    try {
      const measurements = await storage.getMeasurements();
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurements" });
    }
  });

  app.get("/api/measurements/recent", async (req, res) => {
    try {
      const measurements = await storage.getRecentMeasurements(3);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent measurements" });
    }
  });

  app.get("/api/measurements/export", requireRole("technician"), async (req, res) => {
    try {
      const measurements = await storage.getMeasurements();
      
      const csv = [
        "timestamp,latitude,longitude,measurementType,value,unit,status",
        ...measurements.map(m => 
          `${m.timestamp.toISOString()},${m.latitude},${m.longitude},${m.measurementType},${m.value},${m.unit},${m.status || 'good'}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="terra-measurements.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export measurements" });
    }
  });

  app.post("/api/measurements", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMeasurementSchema.parse(req.body);
      const measurement = await storage.createMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      res.status(400).json({ message: "Invalid measurement data" });
    }
  });

  // File upload routes
  app.get("/api/uploads", requireAuth, async (req, res) => {
    try {
      const dataFiles = await storage.getDataFiles();
      res.json(dataFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch uploaded files" });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return passwords in the response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["admin", "technician", "user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(id, role);
      // Don't return password in response
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if ((error as Error).message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/uploads", requireRole("technician"), upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      
      // Validate file type
      if (!file.originalname.endsWith('.csv') && !file.originalname.endsWith('.json')) {
        return res.status(400).json({ message: "Invalid file type. Only CSV and JSON files are supported." });
      }

      // Process file content
      let recordCount = 0;
      const fileContent = file.buffer.toString('utf-8');
      
      if (file.originalname.endsWith('.csv')) {
        const lines = fileContent.split('\n').filter(line => line.trim());
        recordCount = Math.max(0, lines.length - 1); // Subtract header row
        
        // Parse CSV and create measurements (simplified)
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < Math.min(lines.length, 11); i++) { // Limit to 10 records for demo
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length >= 6) {
              try {
                const sensors = await storage.getSensors();
                let sensorId = sensors[0]?.id;
                
                if (!sensorId) {
                  // Create a default sensor if none exists
                  const sensor = await storage.createSensor({
                    name: "Imported Sensor",
                    type: "environmental",
                    isActive: false,
                    latitude: parseFloat(values[1]) || 37.7749,
                    longitude: parseFloat(values[2]) || -122.4194,
                  });
                  sensorId = sensor.id;
                }

                await storage.createMeasurement({
                  sensorId,
                  measurementType: values[3] || "CO2",
                  value: parseFloat(values[4]) || 0,
                  unit: values[5] || "ppm",
                  latitude: parseFloat(values[1]) || 37.7749,
                  longitude: parseFloat(values[2]) || -122.4194,
                  status: "good",
                });
              } catch (error) {
                console.error("Error parsing measurement:", error);
              }
            }
          }
        }
      } else if (file.originalname.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(fileContent);
          recordCount = Array.isArray(jsonData) ? jsonData.length : 1;
        } catch (error) {
          return res.status(400).json({ message: "Invalid JSON file" });
        }
      }

      // Save file metadata
      const dataFile = await storage.createDataFile({
        filename: file.originalname,
        size: file.size,
        recordCount,
      });

      res.status(201).json({ 
        message: "File uploaded successfully", 
        file: dataFile,
        recordsProcessed: recordCount 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
