'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BookDetails', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pageCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      language: {
        type: Sequelize.STRING,
        allowNull: true
      },
      publisher: {
        type: Sequelize.STRING,
        allowNull: true
      },
      edition: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bookId: {
        type: Sequelize.UUID,
        references: {
          model: 'Books',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('BookDetails');
  }
};