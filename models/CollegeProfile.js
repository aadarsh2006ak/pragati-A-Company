const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const CollegeProfile = sequelize.define('CollegeProfile', {
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
  collegeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentRoster: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'college_profiles',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(CollegeProfile.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Define association
CollegeProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = CollegeProfile;
