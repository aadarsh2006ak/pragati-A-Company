const { DataTypes } = require('sequelize');
const connectDB = require('../config/db');
const sequelize = connectDB.sequelize;
const User = require('./User');

const CompanyProfile = sequelize.define('CompanyProfile', {
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  drives: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'company_profiles',
  timestamps: true,
});

// Compatibility layer for _id
Object.defineProperty(CompanyProfile.prototype, '_id', {
  get() {
    return this.id;
  }
});

// Define association
CompanyProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = CompanyProfile;
