import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

export const config: AppConfig = {
  server: {
    port: parseInt(getEnvVar('PORT', '80')),
    host: getEnvVar('HOST', '0.0.0.0'),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    logLevel: getEnvVar('LOG_LEVEL', 'info')
  },
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '5432')),
    database: getEnvVar('DB_NAME', 'taskmanager'),
    username: getEnvVar('DB_USER', 'postgres'),
    password: getEnvVar('DB_PASSWORD', 'postgres'),
    ssl: getEnvVar('DB_SSL', 'false') === 'true',
    maxConnections: parseInt(getEnvVar('DB_MAX_CONNECTIONS', '20'))
  }
};

export function createDatabasePool(): Pool {
  return new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
    ssl: config.database.ssl,
    max: config.database.maxConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}