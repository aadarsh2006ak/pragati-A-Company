const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const Dispute = sequelize.define('Dispute', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved'),
    defaultValue: 'pending',
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
}, {
  tableName: 'disputes',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(Dispute.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Compatibility layer for student
Object.defineProperty(Dispute.prototype, 'student', {
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

// Define associations
Dispute.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Dispute.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

module.exports = Dispute;
