'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const books = global.books;

    const reviews = [
      // Harry Potter reviews
      {
        id: uuidv4(),
        reviewerName: 'BookLover42',
        rating: 5,
        comment: 'An amazing start to the series. The world-building is incredible!',
        bookId: books.find(b => b.title === 'Harry Potter and the Philosopher\'s Stone').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        reviewerName: 'LiteraryEnthusiast',
        rating: 4,
        comment: 'Great story, but some parts were a bit slow.',
        bookId: books.find(b => b.title === 'Harry Potter and the Philosopher\'s Stone').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // 1984 reviews
      {
        id: uuidv4(),
        reviewerName: 'HistoryBuff',
        rating: 5,
        comment: 'A timeless classic that remains relevant today.',
        bookId: books.find(b => b.title === '1984').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        reviewerName: 'PhilosophyStudent',
        rating: 5,
        comment: 'Profound and thought-provoking. A must-read for everyone.',
        bookId: books.find(b => b.title === '1984').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Pride and Prejudice reviews
      {
        id: uuidv4(),
        reviewerName: 'ClassicsFan',
        rating: 4,
        comment: 'Beautiful prose and memorable characters.',
        bookId: books.find(b => b.title === 'Pride and Prejudice').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        reviewerName: 'ModernReader',
        rating: 3,
        comment: 'Interesting but found the language a bit difficult to follow at times.',
        bookId: books.find(b => b.title === 'Pride and Prejudice').id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('Reviews', reviews);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Reviews', null, {});
  }
};