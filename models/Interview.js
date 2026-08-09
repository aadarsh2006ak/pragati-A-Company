const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  driveId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
  },
  feedback: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
}, {
  tableName: 'interviews',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(Interview.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Compatibility layer for student
Object.defineProperty(Interview.prototype, 'student', {
  get() {
    return this.getDataValue('student') || this.studentId;
  },
  set(value) {
    if (typeof value === 'object' && value !== null) {
      this.setDataValue('student', value);
    } else {
      this.setDataValue('studentId', value);
    }
  }
});

// Compatibility layer for company
Object.defineProperty(Interview.prototype, 'company', {
  get() {
    return this.getDataValue('company') || this.companyId;
  },
  set(value) {
    if (typeof value === 'object' && value !== null) {
      this.setDataValue('company', value);
    } else {
      this.setDataValue('companyId', value);
    }
  }
});

// Define associations
Interview.belongsTo(User, { foreignKey: 'studentId', as: 'studentUser' });
Interview.belongsTo(User, { foreignKey: 'companyId', as: 'company' });

module.exports = Interview;
