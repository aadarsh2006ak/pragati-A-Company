const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const Course = sequelize.define('Course', {
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
  modules: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  assignments: {
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
  tableName: 'courses',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(Course.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Compatibility layer for createdBy getter/setter on prototype to avoid Sequelize name collision
Object.defineProperty(Course.prototype, 'createdBy', {
  get() {
    // Return association if populated, otherwise the ID
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
Course.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = Course;
