require('dotenv').config();
const { Client } = require('pg');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;

// Import all models to register them with Sequelize
const User = require('../models/User');
const CollegeProfile = require('../models/CollegeProfile');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Dispute = require('../models/Dispute');
const Interview = require('../models/Interview');

const runMigrations = async () => {
  try {
    console.log('Ensuring target database exists...');
    
    // Connect to the default 'postgres' database to check/create target database
    const client = new Client({
      connectionString: process.env.POSTGRESQL_URI.replace(/\/pragati$/, '/postgres')
    });
    
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='pragati'");
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE pragati");
      console.log("Database 'pragati' created successfully!");
    } else {
      console.log("Database 'pragati' already exists.");
    }
    await client.end();

    console.log('Connecting to PostgreSQL database for migration...');
    await sequelize.authenticate();
    
    console.log('Running migrations (syncing schema)...');
    // force: true drops existing tables and recreates them
    await sequelize.sync({ force: true });
    
    console.log('Migrations executed successfully. Database schema is up to date!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing migrations:', error.message);
    process.exit(1);
  }
};

runMigrations();
