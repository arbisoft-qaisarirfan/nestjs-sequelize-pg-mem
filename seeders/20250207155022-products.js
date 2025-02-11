'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Products', [
      { name: 'New Product	', description: 'Product Description', price: 50, stock: 100, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Oriental Wooden Towels', description: 'New yellow Bike with ergonomic design for humble comfort', price: 50, stock: 100, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  },
};
