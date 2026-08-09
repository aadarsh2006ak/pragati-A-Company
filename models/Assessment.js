const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  type: {
    type: DataTypes.ENUM('quiz', 'coding'),
    defaultValue: 'quiz',
  },
  questions: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'createdBy',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'assessments',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(Assessment.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Compatibility layer for createdBy
Object.defineProperty(Assessment.prototype, 'createdBy', {
  get() {
    return this.getDataValue('createdBy') || this.createdById;
  },
  set(value) {
    if (typeof value === 'object' && value !== null) {
      this.setDataValue('createdBy', value);
    } else {
      this.setDataValue('createdById', value);
    }
  }
});

// Define association
Assessment.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = Assessment;
