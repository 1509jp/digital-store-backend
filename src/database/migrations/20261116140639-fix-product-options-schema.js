'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_options', 'shape', {
      type: Sequelize.ENUM('square', 'circle'),
      allowNull: false,
      defaultValue: 'square',
    });

    await queryInterface.changeColumn('product_options', 'type', {
      type: Sequelize.ENUM('text', 'color'),
      allowNull: false,
      defaultValue: 'text',
    });

    await queryInterface.changeColumn('product_options', 'values', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_options', 'shape', {
      type: Sequelize.ENUM('square', 'circle'),
      allowNull: false,
    });

    await queryInterface.changeColumn('product_options', 'type', {
      type: Sequelize.ENUM('text', 'color'),
      allowNull: false,
    });

    await queryInterface.changeColumn('product_options', 'values', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};
