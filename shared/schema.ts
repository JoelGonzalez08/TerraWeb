import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin', 'technician', 'user'
});

export const sensors = pgTable("sensors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'CO2', 'temperature', 'humidity', etc.
  isActive: boolean("is_active").default(false),
  lastSeen: timestamp("last_seen"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const measurements = pgTable("measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sensorId: varchar("sensor_id").references(() => sensors.id).notNull(),
  measurementType: text("measurement_type").notNull(), // 'CO2', 'temperature', 'humidity', 'growth_index', 'soil_moisture', 'ndvi', 'chlorophyll'
  value: real("value").notNull(),
  unit: text("unit").notNull(), // 'ppm', 'C', '%', 'index', 'kg/m2'
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").default("good"), // 'good', 'moderate', 'poor'
  satelliteData: text("satellite_data"), // JSON data from satellite imagery
  vegetationIndex: real("vegetation_index"), // NDVI or similar index
});

export const dataFiles = pgTable("data_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  size: integer("size").notNull(),
  recordCount: integer("record_count").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters"),
  role: z.enum(["admin", "technician", "user"]).optional(),
});

export const insertSensorSchema = createInsertSchema(sensors).omit({
  id: true,
  lastSeen: true,
});

export const insertMeasurementSchema = createInsertSchema(measurements).omit({
  id: true,
  timestamp: true,
});

export const insertDataFileSchema = createInsertSchema(dataFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSensor = z.infer<typeof insertSensorSchema>;
export type Sensor = typeof sensors.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type Measurement = typeof measurements.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;
export type DataFile = typeof dataFiles.$inferSelect;
