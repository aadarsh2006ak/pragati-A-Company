const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.POSTGRESQL_URI, {
  dialect: 'postgres',
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected via Sequelize...');
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB.sequelize = sequelize;

module.exports = connectDB;
