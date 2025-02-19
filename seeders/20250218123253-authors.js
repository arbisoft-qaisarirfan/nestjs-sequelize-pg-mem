'use strict';
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const authors = [
      {
        id: uuidv4(),
        firstName: 'J.K.',
        lastName: 'Rowling',
        birthDate: new Date('1965-07-31'),
        biography: 'British author best known for the Harry Potter series.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'George',
        lastName: 'Orwell',
        birthDate: new Date('1903-06-25'),
        biography: 'English novelist known for 1984 and Animal Farm.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Jane',
        lastName: 'Austen',
        birthDate: new Date('1775-12-16'),
        biography: 'English novelist known for Pride and Prejudice.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('Authors', authors);

    // Store author IDs for use in other seeders
    global.authorIds = authors.map((a) => a.id);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Authors', null, {});
  },
};
