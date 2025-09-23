import { type Sensor, type InsertSensor, type Measurement, type InsertMeasurement, type DataFile, type InsertDataFile } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  // Sensor methods
  getSensors(): Promise<Sensor[]>;
  getSensor(id: string): Promise<Sensor | undefined>;
  createSensor(sensor: InsertSensor): Promise<Sensor>;
  updateSensor(id: string, updates: Partial<Sensor>): Promise<Sensor>;
  deleteSensor(id: string): Promise<boolean>;

  // Measurement methods
  getMeasurements(): Promise<Measurement[]>;
  getMeasurement(id: string): Promise<Measurement | undefined>;
  getRecentMeasurements(limit?: number): Promise<Measurement[]>;
  getMeasurementsBySensor(sensorId: string): Promise<Measurement[]>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  deleteMeasurement(id: string): Promise<boolean>;

  // Data file methods
  getDataFiles(): Promise<DataFile[]>;
  getDataFile(id: string): Promise<DataFile | undefined>;
  createDataFile(dataFile: InsertDataFile): Promise<DataFile>;
  deleteDataFile(id: string): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private sensors: Map<string, Sensor>;
  private measurements: Map<string, Measurement>;
  private dataFiles: Map<string, DataFile>;
  public sessionStore: session.Store;

  constructor() {
    this.sensors = new Map();
    this.measurements = new Map();
    this.dataFiles = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

    // Sensor methods
  // Sensor methods
  async getSensors(): Promise<Sensor[]> {
    return Array.from(this.sensors.values());
  }

  async getSensor(id: string): Promise<Sensor | undefined> {
    return this.sensors.get(id);
  }

  async createSensor(insertSensor: InsertSensor): Promise<Sensor> {
    const id = randomUUID();
    const sensor: Sensor = { 
      ...insertSensor, 
      id,
      lastSeen: new Date(),
      isActive: insertSensor.isActive ?? false,
      latitude: insertSensor.latitude ?? null,
      longitude: insertSensor.longitude ?? null,
    };
    this.sensors.set(id, sensor);
    return sensor;
  }

  async updateSensor(id: string, updates: Partial<Sensor>): Promise<Sensor> {
    const sensor = this.sensors.get(id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }
    const updatedSensor = { ...sensor, ...updates };
    this.sensors.set(id, updatedSensor);
    return updatedSensor;
  }

  async deleteSensor(id: string): Promise<boolean> {
    return this.sensors.delete(id);
  }

  // Measurement methods
  async getMeasurements(): Promise<Measurement[]> {
    return Array.from(this.measurements.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getMeasurement(id: string): Promise<Measurement | undefined> {
    return this.measurements.get(id);
  }

  async getRecentMeasurements(limit: number = 10): Promise<Measurement[]> {
    const measurements = await this.getMeasurements();
    return measurements.slice(0, limit);
  }

  async getMeasurementsBySensor(sensorId: string): Promise<Measurement[]> {
    return Array.from(this.measurements.values())
      .filter(m => m.sensorId === sensorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createMeasurement(insertMeasurement: InsertMeasurement): Promise<Measurement> {
    const id = randomUUID();
    const measurement: Measurement = { 
      ...insertMeasurement, 
      id,
      timestamp: new Date(),
      status: insertMeasurement.status ?? "good",
      satelliteData: insertMeasurement.satelliteData ?? null,
      vegetationIndex: insertMeasurement.vegetationIndex ?? null,
    };
    this.measurements.set(id, measurement);
    return measurement;
  }

  async deleteMeasurement(id: string): Promise<boolean> {
    return this.measurements.delete(id);
  }

  // Data file methods
  async getDataFiles(): Promise<DataFile[]> {
    return Array.from(this.dataFiles.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getDataFile(id: string): Promise<DataFile | undefined> {
    return this.dataFiles.get(id);
  }

  async createDataFile(insertDataFile: InsertDataFile): Promise<DataFile> {
    const id = randomUUID();
    const dataFile: DataFile = { 
      ...insertDataFile, 
      id,
      uploadedAt: new Date(),
      recordCount: insertDataFile.recordCount ?? 0,
    };
    this.dataFiles.set(id, dataFile);
    return dataFile;
  }

  async deleteDataFile(id: string): Promise<boolean> {
    return this.dataFiles.delete(id);
  }
}

export const storage = new MemStorage();
