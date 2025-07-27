import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
  TextField,
  Chip
} from '@mui/material';
import { BarChart, PieChart, AccountBalance } from '@mui/icons-material';
import categoryData from '../assets/category_data.json';
import spendingData from '../assets/spending_data.json';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import LineChart from '../components/lineChart';
import PieChartComponent from '../components/pieChart';

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [spendingRecords, setSpendingRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    // Load initial data and localStorage data
    const storedSpending = JSON.parse(localStorage.getItem('spendingRecords') || '[]');
    const storedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    setSpendingRecords([...spendingData, ...storedSpending]);
    setCategories([...categoryData, ...storedCategories]);
  }, []);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.find(cat => cat.category === newCategory.trim())) {
      const newCat = {
        spending_id: Date.now(),
        category: newCategory.trim(),
        description: `Custom category: ${newCategory.trim()}`
      };
      
      const updatedCategories = [...categories, newCat];
      setCategories(updatedCategories);
      
      // Save to localStorage
      const customCategories = updatedCategories.filter(cat => 
        !categoryData.find(origCat => origCat.category === cat.category)
      );
      localStorage.setItem('categories', JSON.stringify(customCategories));
      
      setNewCategory('');
    }
  };

  const filterSpendingByTime = (records) => {
    const now = new Date();

    switch (timeFilter) {
      case 'Daily':
        const today = startOfDay(now);
        const todayEnd = endOfDay(now);
        return records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= today && recordDate <= todayEnd;
        });
      
      case 'Weekly':
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        return records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });
      
      case 'Monthly':
        return records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        });
      case 'All Time':
        return records;
      default:
        return records;
    }
  };

  const filteredRecords = filterSpendingByTime(spendingRecords);
  const totalAllTime = spendingRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalFiltered = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [...new Set(spendingRecords.map(record => new Date(record.date).getFullYear()))].sort((a, b) => b - a);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" component="h1" gutterBottom>
          📊 Analytics Dashboard
        </Typography>
        <NavLink to="/journal" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            sx={{ height: 'fit-content' }}
          >
            Go to Journal
          </Button>
        </NavLink>
      </Box>

      {/* Categories Management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Manage Categories</Typography>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            label="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            size="small"
          />
          <Button variant="contained" onClick={handleAddCategory}>
            Add Category
          </Button>
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {categories
            .sort((a, b) => a.category.localeCompare(b.category))
            .map((cat) => (
              <Chip key={cat.spending_id} label={cat.category} variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Spending (All Time)
              </Typography>
              <Typography variant="h4">
                ฿{totalAllTime.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary">
                Total ({timeFilter})
              </Typography>
              <Typography variant="h4">
                ฿{totalFiltered.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Filter Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Show by</InputLabel>
            <Select
              value={timeFilter}
              label="Show by"
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <MenuItem value="All Time">All Time</MenuItem>
              <MenuItem value="Daily">Daily</MenuItem>
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          {(timeFilter === 'Monthly' || timeFilter === 'Daily' || timeFilter === 'Weekly') && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Paper>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spending Over Time
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {timeFilter === 'All Time'
                ? 'All Time'
                : `${months[selectedMonth]} ${selectedYear}`}
            </Typography>
            <LineChart
              data={spendingRecords}
              filteredData={filteredRecords}
              timeFilter={timeFilter}
              categories={categories}
              groupByCategory
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {timeFilter === 'All Time'
                ? 'All Time'
                : `${months[selectedMonth]} ${selectedYear}`}
            </Typography>
            {timeFilter === 'All Time'
              ? <PieChartComponent data={spendingRecords} />
              : <PieChartComponent
                  data={spendingRecords.filter(record =>
                    record.date &&
                    new Date(record.date).getMonth() === selectedMonth &&
                    new Date(record.date).getFullYear() === selectedYear
                  )}
                />
            }
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;