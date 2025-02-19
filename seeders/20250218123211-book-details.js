'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const books = global.books;

    const bookDetails = [
      {
        id: uuidv4(),
        pageCount: 223,
        language: 'English',
        publisher: 'Bloomsbury',
        edition: 'First Edition',
        bookId: books.find(b => b.title === 'Harry Potter and the Philosopher\'s Stone').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        pageCount: 328,
        language: 'English',
        publisher: 'Secker & Warburg',
        edition: 'First Edition',
        bookId: books.find(b => b.title === '1984').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        pageCount: 432,
        language: 'English',
        publisher: 'T. Egerton, Whitehall',
        edition: 'First Edition',
        bookId: books.find(b => b.title === 'Pride and Prejudice').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('BookDetails', bookDetails);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('BookDetails', null, {});
  }
};