const utils = require('../utils/utils');
const { Customer, Account, sequelize } = require('../models');
const { apiError404 } = require('../utils/customError');
// const { apiError404, apiError403 } = require('../utils/customError');

class CustomerService {
  async register({
    name, cpf, rg, bank_id, account,
  }) {
    const t = await sequelize.transaction();
    try {
      const customer = new Customer({
        name, cpf, rg, bank_id,
      });
      await customer.save({ transaction: t });
      const bankId = bank_id;
      const accounts = account.map((acc) => {
        const newAccount = {
          balance: 50,
          number: utils.generateNumberAccount(),
          password: acc.password,
          bank_id: bankId,
          customer_id: customer.id,
        };
        return newAccount;
      });
      await Account.bulkCreate(accounts, { transaction: t, individualHooks: true });
      await t.commit();
    } catch (error) {
      console.log(error);
      await t.rollback();
    }
  }

  async list() {
    const customer = await Customer.findAll({
      attributes: ['id', 'name', 'cpf', 'rg', 'bank_id'],
      include: [{
        model: Account,
        as: 'accounts',
        attributes: ['id', 'balance', 'number'],
      }],
    });
    return customer;
  }

  async find(id) {
    const customer = await Customer.findOne({
      where: { id },
      attributes: ['id', 'name', 'cpf', 'rg', 'bank_id'],
      include: [{
        model: Account,
        as: 'accounts',
        attributes: ['id', 'balance', 'number'],
      }],
    });
    if (!customer) {
      throw apiError404;
    } else {
      return customer;
    }
  }

  async edit(id, name, cpf, rg) {
    const findCustomer = await Customer.findOne({ where: { id } });
    if (!findCustomer) {
      throw apiError404;
    } else {
      await Customer.update({ name, cpf, rg }, { where: { id } });
    }
  }

  async del(id) {
    console.log('TENTOU');
    await Account.destroy({ where: { customer_id: id } });
    await Customer.destroy({ where: { id } });
  }
}

module.exports = CustomerService;
