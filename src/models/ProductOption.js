
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductOption = sequelize.define('ProductOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  shape: {
  type: DataTypes.ENUM('square', 'circle'),
  allowNull: false,
  defaultValue: 'square',
},

  radius: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },

  type: {
  type: DataTypes.ENUM('text', 'color'),
  allowNull: false,
  defaultValue: 'text',
},

  values: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'product_options',
  timestamps: false,
});

module.exports = ProductOption;
