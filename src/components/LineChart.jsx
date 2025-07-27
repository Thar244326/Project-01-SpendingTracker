import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  isBefore,
  isAfter,
  isSameMonth,
  isSameDay,
  isSameWeek,
  getMonth,
  getYear,
  getWeeksInMonth,
  getDate,
  getDaysInMonth
} from 'date-fns';

const COLORS = [
  '#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2',
  '#0288d1', '#d32f2f', '#689f38', '#ffa000', '#512da8',
  '#0097a7', '#c2185b', '#5d4037', '#616161', '#ff5722'
];

function getMonthName(monthIdx) {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][monthIdx];
}

const LineChart = ({
  data,
  filteredData,
  timeFilter,
  categories = [],
  groupByCategory = false,
  selectedMonth,
  selectedYear
}) => {
  // Find min/max date in all data
  const allDates = data.map(r => parseISO(r.date));
  const minDate = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : new Date();
  const maxDate = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : new Date();

  // Helper to fill periods
  function getPeriods() {
    let periods = [];
    if (timeFilter === 'All Time' || timeFilter === 'Monthly') {
      // All months from minDate to max(current, maxDate)
      let start = startOfMonth(minDate);
      let end = startOfMonth(maxDate > new Date() ? maxDate : new Date());
      let cur = start;
      while (!isAfter(cur, end)) {
        periods.push(format(cur, 'MMM yyyy'));
        cur = addMonths(cur, 1);
      }
    } else if (timeFilter === 'Daily') {
      // All days in selected month
      const base = new Date(selectedYear, selectedMonth, 1);
      const days = getDaysInMonth(base);
      for (let d = 1; d <= days; d++) {
        periods.push(format(new Date(selectedYear, selectedMonth, d), 'dd MMM'));
      }
    } else if (timeFilter === 'Weekly') {
      // Always 4 weeks for the selected month
      const base = new Date(selectedYear, selectedMonth, 1);
      for (let w = 0; w < 4; w++) {
        const weekStart = addWeeks(startOfMonth(base), w);
        periods.push(format(weekStart, "'W'w MMM"));
      }
    }
    return periods;
  }

  function processDataForChart() {
    if (!data || data.length === 0) return [];

    const periods = getPeriods();
    // Build initial structure
    let chartData = periods.map(period => {
      let obj = { period };
      if (groupByCategory && categories.length > 0) {
        categories.forEach(cat => { obj[cat.category] = 0; });
      } else {
        obj.amount = 0;
        obj.count = 0;
      }
      return obj;
    });

    // Helper to find period index for a record
    function getPeriodIdx(record) {
      const date = parseISO(record.date);
      if (timeFilter === 'All Time' || timeFilter === 'Monthly') {
        const key = format(startOfMonth(date), 'MMM yyyy');
        return periods.indexOf(key);
      } else if (timeFilter === 'Daily') {
        if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
          const key = format(date, 'dd MMM');
          return periods.indexOf(key);
        }
      } else if (timeFilter === 'Weekly') {
        if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
          // Find week number in month
          let weekStart = startOfWeek(date, { weekStartsOn: 0 });
          // Clamp to month start
          if (weekStart.getMonth() !== selectedMonth) weekStart = startOfMonth(date);
          const key = format(weekStart, "'W'w MMM");
          return periods.indexOf(key);
        }
      }
      return -1;
    }

    data.forEach(record => {
      const idx = getPeriodIdx(record);
      if (idx !== -1) {
        if (groupByCategory && categories.length > 0) {
          chartData[idx][record.category] += record.amount;
        } else {
          chartData[idx].amount += record.amount;
          chartData[idx].count += 1;
        }
      }
    });

    return chartData;
  }

  const chartData = processDataForChart();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`Period: ${label}`}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ margin: '5px 0 0 0', color: item.color }}>
              {item.name}: ฿{item.value?.toLocaleString?.() ?? 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        No data available for the selected period
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `฿${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {groupByCategory && categories.length > 0
            ? categories.map((cat, idx) => (
                <Line
                  key={cat.category}
                  type="monotone"
                  dataKey={cat.category}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[idx % COLORS.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS[idx % COLORS.length], strokeWidth: 2 }}
                  name={cat.category}
                  connectNulls
                />
              ))
            : (
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
                name="Spending Amount (฿)"
              />
            )
          }
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;