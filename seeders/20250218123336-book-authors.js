'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bookIds = global.bookIds;
    const authorIds = global.authorIds;

    const bookAuthors = [
      {
        id: uuidv4(),
        bookId: bookIds[0],
        authorId: authorIds[0],
        role: 'Primary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        bookId: bookIds[1],
        authorId: authorIds[1],
        role: 'Primary',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        bookId: bookIds[2],
        authorId: authorIds[2],
        role: 'Primary',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('BookAuthors', bookAuthors);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('BookAuthors', null, {});
  }
};