'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Books', [
      {
        id: uuidv4(),
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A story of decadence and excess.',
        price: 999,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel.',
        price: 1099,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A story of racial inequality and justice.',
        price: 1199,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Books', null, {});
  },
};