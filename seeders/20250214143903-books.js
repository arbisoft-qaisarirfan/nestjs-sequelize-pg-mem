'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const books = [
      {
        id: uuidv4(),
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        description: 'The first book in the Harry Potter series.',
        publicationYear: 1997,
        isbn: '9780747532743',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel.',
        publicationYear: 1949,
        isbn: '9780451524935',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'A romantic novel of manners.',
        publicationYear: 1813,
        isbn: '9780141439518',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Store generated IDs for use in other seeders
    const bookIds = books.map((b) => b.id);
    await queryInterface.bulkInsert('Books', books);

    // Save book IDs for other seeders
    global.bookIds = bookIds;
    global.books = books.map(book => ({ id: book.id, title: book.title, author: book.author }));
    return bookIds;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Books', null, {});
  },
};
