// controllers/tensorflowController.js
import * as tf from "@tensorflow/tfjs-node";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFinancialPredictions = async (req, res) => {
  try {
    console.log("Entered getFinancialPredictions function");
    const modelPath = path.join(__dirname, "model", "model.json");
    console.log(`Loading model from path: ${modelPath}`);
    const model = await tf.loadLayersModel(`file://${modelPath}`);
    console.log("Model loaded successfully");

    const { monthlyData } = req.body;
    console.log("Received monthly data:", monthlyData);

    const allMonths = [
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

    // Extend monthlyData to include all months
    const extendedMonthlyData = allMonths.map((month) => {
      const data = monthlyData.find(
        (data) => data.month.toLowerCase() === month
      );
      return data || { month, revenue: 0, expenses: 0 };
    });

    const revenues = extendedMonthlyData.map((data) => data.revenue);
    const expenses = extendedMonthlyData.map((data) => data.expenses);
    console.log("Revenues:", revenues);
    console.log("Expenses:", expenses);

    const maxRevenue = Math.max(...revenues);
    const maxExpense = Math.max(...expenses);

    const normalizedRevenues = revenues.map((revenue) => revenue / maxRevenue);
    const normalizedExpenses = expenses.map((expense) => expense / maxExpense);
    console.log("Normalized revenues:", normalizedRevenues);
    console.log("Normalized expenses:", normalizedExpenses);

    const sequences = normalizedRevenues.map((revenue, index) => [
      [revenue, normalizedExpenses[index]],
    ]);
    console.log("Sequences created:", sequences);

    const inputTensor = tf.tensor3d(sequences);
    console.log("Input tensor created");

    const predictions = model.predict(inputTensor).abs();
    let predictedRevenues = predictions
      .arraySync()
      .map((pred) => pred[0] * maxRevenue);
    console.log("Predictions made:", predictions.arraySync());
    console.log("Predicted revenues:", predictedRevenues);

    // Add random noise to the predictions for the months with no data
    predictedRevenues = predictedRevenues.map((revenue, index) => {
      if (
        extendedMonthlyData[index].revenue === 0 &&
        extendedMonthlyData[index].expenses === 0
      ) {
        const noise = Math.random() * 1 * maxRevenue; // Adjust the noise level as needed
        return revenue + noise;
      }
      return revenue;
    });

    console.log("Predicted revenues with noise:", predictedRevenues);

    // Fix the predicted revenues to 2 decimal places
    const fixedPredictedRevenues = predictedRevenues.map((revenue) =>
      revenue.toFixed(2)
    );

    console.log("Fixed predicted revenues:", fixedPredictedRevenues);

    inputTensor.dispose();
    console.log("Input tensor disposed");

    res.json({ predictedRevenues: fixedPredictedRevenues });
  } catch (error) {
    console.error("Error in getFinancialPredictions:", error);
    res.status(500).send("Internal Server Error");
  }
};

export { getFinancialPredictions };
