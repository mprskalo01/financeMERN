import Account from "../models/Account.js";

const accountController = {
  initializeAccountAndTransactions: async (userId) => {
    try {
      // Get the current month index (0 for January, 1 for February, ..., 8 for September)
      const currentMonthIndex = new Date().getMonth(); // September is month 8

      // List of months
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];

      // Initialize monthly data with zero values for revenue and expenses up to the current month
      const monthlyData = months
        .slice(0, currentMonthIndex + 1)
        .map((month) => ({
          month: month,
          revenue: 0, // Initialize as 0 dollars, will be converted to cents by the setter
          expenses: 0, // Initialize as 0 dollars, will be converted to cents by the setter
        }));

      // Create a new account with initialized values
      const newAccount = new Account({
        userId: userId,
        currentBalance: 0, // Initialize currentBalance to 0 dollars, will be converted to cents by the setter
        monthlyData: monthlyData,
      });

      await newAccount.save();
      console.log(`Account initialized for user ${userId}`);
      return newAccount;
    } catch (error) {
      console.error("Error initializing account:", error);
      throw error;
    }
  },

  getUserAccount: async (req, res) => {
    try {
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching account", error: error.message });
    }
  },

  updateAccount: async (req, res) => {
    try {
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      console.log(`here ${account}`);
      if (req.body.currentBalance !== undefined)
        account.currentBalance = req.body.currentBalance;
      if (req.body.totalRevenue !== undefined)
        account.totalRevenue = req.body.totalRevenue;
      if (req.body.totalExpenses !== undefined)
        account.totalExpenses = req.body.totalExpenses;

      await account.save();
      res.json(account);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating account", error: error.message });
    }
  },
  editMonthlyData: async (req, res) => {
    try {
      const { month, revenue, expenses } = req.body;

      console.log("Request body:", req.body); // Log request data

      // Validate request body
      if (!month || revenue === undefined || expenses === undefined) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const account = await Account.findOne({ userId: req.user.id });

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      let monthData = account.monthlyData.find(
        (m) => m.month.toLowerCase() === month.toLowerCase()
      );
      if (!monthData) {
        monthData = { month, revenue: 0, expenses: 0 };
        account.monthlyData.push(monthData);
      }

      monthData.revenue = revenue;
      monthData.expenses = expenses;

      await account.save();
      res.status(200).json(account);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error editing monthly data", error: error.message });
    }
  },
  getAccountStats: async (req, res) => {
    try {
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      const stats = {
        currentBalance: account.currentBalance,
        totalRevenue: account.totalRevenue,
        totalExpenses: account.totalExpenses,
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching account stats",
        error: error.message,
      });
    }
  },
  // Accounts transactions CRUD
  getUserTransactions: async (req, res) => {
    try {
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account.transactions);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching transactions", error: error.message });
    }
  },
  addTransaction: async (req, res) => {
    try {
      const { date, amount, type, description } = req.body;
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const newTransaction = { date, amount, type, description };
      account.transactions.push(newTransaction);

      if (type === "revenue") {
        account.currentBalance += amount;
        account.totalRevenue += amount;
      } else if (type === "expense") {
        account.currentBalance -= amount;
        account.totalExpenses += amount;
      }

      await updateMonthlyData(account, date, amount, type);
      await account.save();
      res.json({ account, transaction: newTransaction });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error adding transaction", error: error.message });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const { date, amount, type, description } = req.body;
      const { id: transactionId } = req.params;
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const transaction = account.transactions.id(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Revert old transaction
      await updateMonthlyData(
        account,
        transaction.date,
        -transaction.amount,
        transaction.type
      );
      if (transaction.type === "revenue") {
        account.currentBalance -= transaction.amount;
        account.totalRevenue -= transaction.amount;
      } else if (transaction.type === "expense") {
        account.currentBalance += transaction.amount;
        account.totalExpenses -= transaction.amount;
      }

      // Update transaction
      transaction.date = date;
      transaction.amount = amount;
      transaction.type = type;
      transaction.description = description;

      await updateMonthlyData(account, date, amount, type);
      if (type === "revenue") {
        account.currentBalance += amount;
        account.totalRevenue += amount;
      } else if (type === "expense") {
        account.currentBalance -= amount;
        account.totalExpenses += amount;
      }

      await account.save();
      res.json({ account, transaction });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating transaction", error: error.message });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const { id: transactionId } = req.params;
      const account = await Account.findOne({ userId: req.user.id });
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const transaction = account.transactions.id(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Revert transaction
      await updateMonthlyData(
        account,
        transaction.date,
        -transaction.amount,
        transaction.type
      );
      if (transaction.type === "revenue") {
        account.currentBalance -= transaction.amount;
        account.totalRevenue -= transaction.amount;
      } else if (transaction.type === "expense") {
        account.currentBalance += transaction.amount;
        account.totalExpenses -= transaction.amount;
      }

      // Remove transaction
      transaction.deleteOne();
      await account.save();
      res.json({ message: "Transaction deleted successfully", account });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res
        .status(500)
        .json({ message: "Error deleting transaction", error: error.message });
    }
  },
};

async function updateMonthlyData(account, date, amount, type) {
  // Update monthly data
  const monthStr = new Date(date)
    .toLocaleString("default", { month: "long" })
    .toLowerCase(); // Ensure month is lowercase
  let monthData = account.monthlyData.find(
    (month) => month.month.toLowerCase() === monthStr
  );
  if (!monthData) {
    monthData = { month: monthStr, revenue: 0, expenses: 0 };
    account.monthlyData.push(monthData);
  }
  if (type === "revenue") monthData.revenue += amount;
  else monthData.expenses += amount;
}

export default accountController;
