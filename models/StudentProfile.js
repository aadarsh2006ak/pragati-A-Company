const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const StudentProfile = sequelize.define('StudentProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  college: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'college_profiles',
      key: 'id'
    }
  },
  onboardingComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  cgpa: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  branch: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getFullYear(),
  },
  skills: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  resumeUrl: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  courses: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  assessments: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  offers: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'student_profiles',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(StudentProfile.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Define association
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = StudentProfile;
