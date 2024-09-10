import BoxHeader from "@/components/BoxHeader";
import DashboardBox from "@/components/DashboardBox";
import FlexBetween from "@/components/FlexBetween";
import { useGetKpisQuery, useGetProductsQuery } from "@/state/api";
import { Box, Typography, useTheme } from "@mui/material";
import { useMemo } from "react";
import {
  Tooltip,
  CartesianGrid,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const pieData = [
  { name: "Group A", value: 600 },
  { name: "Group B", value: 400 },
];

const Row2 = () => {
  const { palette } = useTheme();
  const pieColors = [palette.primary[800], palette.primary[300]];
  const { data: operationalData } = useGetKpisQuery();
  const { data: productData } = useGetProductsQuery();

  const operationalExpenses = useMemo(() => {
    return (
      operationalData &&
      operationalData[0].monthlyData.map(
        ({ month, operationalExpenses, nonOperationalExpenses }) => {
          return {
            name: month.substring(0, 3),
            "Operational Expenses": operationalExpenses,
            "Non Operational Expenses": nonOperationalExpenses,
          };
        }
      )
    );
  }, [operationalData]);

  const productExpenseData = useMemo(() => {
    return (
      productData &&
      productData.map(({ _id, price, expense }) => {
        return {
          id: _id,
          price: price,
          expense: expense,
        };
      })
    );
  }, [productData]);

  const operationalExpensesChange = useMemo(() => {
    if (
      operationalData &&
      operationalData[0] &&
      operationalData[0].monthlyData.length > 1
    ) {
      const latest = operationalData[0].monthlyData.slice(-1)[0];
      const previous = operationalData[0].monthlyData.slice(-2)[0];

      if (latest && previous) {
        const operationalChange =
          previous.operationalExpenses !== 0
            ? ((latest.operationalExpenses - previous.operationalExpenses) /
                previous.operationalExpenses) *
              100
            : 0;

        const nonOperationalChange =
          previous.nonOperationalExpenses !== 0
            ? ((latest.nonOperationalExpenses -
                previous.nonOperationalExpenses) /
                previous.nonOperationalExpenses) *
              100
            : 0;

        // Helper function to add "+" sign for positive values
        const formatChange = (value: number) =>
          value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);

        return {
          operationalText: `Op: ${formatChange(operationalChange)}%`,
          nonOperationalText: `Non-Op: ${formatChange(nonOperationalChange)}%`,
        };
      }
    }
    return {
      operationalText: "Op: 0%",
      nonOperationalText: "Non-Op: 0%",
    }; // Fallback in case of missing data
  }, [operationalData]);

  return (
    <>
      <DashboardBox gridArea="d">
        <BoxHeader
          title={
            <>
              <span style={{ color: palette.secondary[700] }}>Operational</span>{" "}
              &{" "}
              <span style={{ color: palette.secondary[400] }}>
                Non-Operational Expenses
              </span>
            </>
          }
          sideText={
            <>
              <span style={{ color: palette.secondary[700] }}>
                {operationalExpensesChange.operationalText}
              </span>{" "}
              |{" "}
              <span style={{ color: palette.secondary[400] }}>
                {operationalExpensesChange.nonOperationalText}
              </span>
            </>
          }
        />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={operationalExpenses}
            margin={{
              top: 20,
              right: 0,
              left: -10,
              bottom: 55,
            }}
          >
            <CartesianGrid vertical={false} stroke={palette.grey[800]} />
            <XAxis
              dataKey="name"
              tickLine={false}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "10px" }}
            />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Non Operational Expenses"
              stroke={palette.secondary[700]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Operational Expenses"
              stroke={palette.secondary[400]}
            />
          </LineChart>
        </ResponsiveContainer>
      </DashboardBox>
      <DashboardBox gridArea="e">
        <BoxHeader
          title={
            <>
              <span style={{ color: palette.primary[300] }}>Campaigns</span> &{" "}
              <span style={{ color: palette.primary[700] }}>Targets</span>
            </>
          }
          sideText={`+83 Targets | Margins Up 30%`}
        />
        <FlexBetween mt="0.25rem" gap="1.5rem" pr="1rem">
          <PieChart
            width={110}
            height={100}
            margin={{
              top: 0,
              right: -10,
              left: 10,
              bottom: 0,
            }}
          >
            <Pie
              stroke="none"
              data={pieData}
              innerRadius={18}
              outerRadius={38}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index]} />
              ))}
            </Pie>
          </PieChart>
          <Box ml="-0.7rem" flexBasis="40%" textAlign="center">
            <Typography variant="h5">Target Sales</Typography>
            <Typography m="0.3rem 0" variant="h3" color={palette.primary[300]}>
              83
            </Typography>
            <Typography variant="h6">
              Finance goals of the campaign that is desired
            </Typography>
          </Box>
          <Box flexBasis="40%">
            <Typography variant="h5">Losses in Revenue</Typography>
            <Typography variant="h6">Losses are down 25%</Typography>
            <Typography mt="0.4rem" variant="h5">
              Profit Margins
            </Typography>
            <Typography variant="h6">
              Margins are up by 30% from last month.
            </Typography>
          </Box>
        </FlexBetween>
      </DashboardBox>
      <DashboardBox gridArea="f">
        <BoxHeader
          title={
            <>
              <span style={{ color: palette.tertiary[500] }}>
                Product Prices
              </span>{" "}
              & <span style={{ color: palette.secondary[500] }}>Expenses</span>
            </>
          }
          sideText="Margin of products"
        />
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 25,
              bottom: 40,
              left: -10,
            }}
          >
            <CartesianGrid stroke={palette.grey[800]} />
            <XAxis
              type="number"
              dataKey="price"
              name="price"
              axisLine={false}
              tickLine={false}
              style={{ fontSize: "10px" }}
              tickFormatter={(v) => `$${v}`}
              label={{
                value: "Price of Product",
                position: "insideBottom", // Places it below the axis in the center
                offset: 5, // Adjusts the vertical distance (increase to move it lower)
                style: { fontSize: "12px", fill: palette.tertiary[500] },
              }}
            ></XAxis>
            <YAxis
              type="number"
              dataKey="expense"
              name="expense"
              axisLine={false}
              tickLine={false}
              style={{ fontSize: "10px" }}
              tickFormatter={(v) => `$${v}`}
              label={{
                value: "Expense of Product",
                position: "insideBottomLeft", // Places it below the axis in the center
                offset: 30, // Adjusts the vertical distance (increase to move it lower)
                angle: -90,
                style: { fontSize: "12px", fill: palette.secondary[500] },
              }}
            />
            <ZAxis type="number" range={[20]} />
            <Tooltip formatter={(v) => `$${v}`} />
            <Scatter
              name="Product Expense Ratio"
              data={productExpenseData}
              fill={palette.tertiary[500]}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </DashboardBox>
    </>
  );
};

export default Row2;
