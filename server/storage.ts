import { type User, type InsertUser, type Sensor, type InsertSensor, type Measurement, type InsertMeasurement, type DataFile, type InsertDataFile } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: "admin" | "technician" | "user"): Promise<User>;

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
  private users: Map<string, User>;
  private sensors: Map<string, Sensor>;
  private measurements: Map<string, Measurement>;
  private dataFiles: Map<string, DataFile>;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.sensors = new Map();
    this.measurements = new Map();
    this.dataFiles = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Crear usuario admin por defecto
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    // Only create default admin in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    // Create admin user
    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      username: "admin",
      password: "bce24c110678f942f5134ce1f6b742294ebbd4700d7c3b1da23a0f893c64b7646a1afb043eb9863bb8f6a1893de5d20bb4649333405b175c1cbf70ce26304138.24e4948073392cc2a74dcf6feb2afd40", // admin123
      role: "admin"
    };
    this.users.set(adminId, adminUser);

    // Create client user (role: user)
    const clienteId = randomUUID();
    const clienteUser: User = {
      id: clienteId,
      username: "cliente",
      password: "c57397b911245248ae6960cdb3b1fa45dd6ec7dde558200e941fdb3184d089481624f55f3aeecbc551cb0ed69be29bd3a4820646ec440bb7f2d48692f43a429b.5e853a04f9163ba54f7f6eb27a9fea54", // cliente123
      role: "user"
    };
    this.users.set(clienteId, clienteUser);

    // Create technician user (role: technician)
    const tecnicoId = randomUUID();
    const tecnicoUser: User = {
      id: tecnicoId,
      username: "tecnico",
      password: "ff277dcee4f5e3799cc1a0b59313631392d5b63aadcf7315de57dd1d98d5e59cc138a95768c0d3cc3326001f879a6bfd974bb09690ab24a0855e0381d7df1324.4596ea094fd19c27d5e02e42c8f7c3b9", // tecnico123
      role: "technician"
    };
    this.users.set(tecnicoId, tecnicoUser);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserRole(id: string, role: "admin" | "technician" | "user"): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, role };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

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
