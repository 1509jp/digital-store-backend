
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      shape: {
        type: Sequelize.ENUM('square', 'circle'),
        allowNull: false,
      },

      radius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      type: {
        type: Sequelize.ENUM('text', 'color'),
        allowNull: false,
      },

      values: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
