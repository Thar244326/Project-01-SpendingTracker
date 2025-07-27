import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import categoryData from '../assets/category_data.json';
import spendingData from '../assets/spending_data.json';
import { format } from 'date-fns';

const Journal = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [spendingRecords, setSpendingRecords] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    // Load data from localStorage and initial data
    const storedSpending = JSON.parse(localStorage.getItem('spendingRecords') || '[]');
    const storedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    setSpendingRecords([...spendingData, ...storedSpending]);
    setCategories([...categoryData, ...storedCategories]);
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleAddRecord = () => {
    if (
      formData.category &&
      formData.amount &&
      formData.date &&
      parseFloat(formData.amount) > 0 // Prevent zero or negative
    ) {
      const newRecord = {
        spending_id: spendingRecords.length + 1,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date
      };

      // Get existing custom records from localStorage
      const existingRecords = JSON.parse(localStorage.getItem('spendingRecords') || '[]');
      const updatedRecords = [...existingRecords, newRecord];
      
      // Save to localStorage
      localStorage.setItem('spendingRecords', JSON.stringify(updatedRecords));
      
      // Update state with all records (initial + custom)
      setSpendingRecords([...spendingData, ...updatedRecords]);
      
      // Reset form
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    }
  };

  const handleDeleteRecord = (recordId) => {
    // Remove from localStorage if present
    const customRecords = JSON.parse(localStorage.getItem('spendingRecords') || '[]');
    const updatedCustomRecords = customRecords.filter(record => record.spending_id !== recordId);
    localStorage.setItem('spendingRecords', JSON.stringify(updatedCustomRecords));

    // Remove from initial JSON data if present (only in UI, not persistent)
    const updatedSpendingRecords = [...spendingData, ...updatedCustomRecords].filter(
      record => record.spending_id !== recordId
    );
    setSpendingRecords(updatedSpendingRecords);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" component="h1" gutterBottom>
          📝 Spending Journal
        </Typography>
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            sx={{ height: 'fit-content' }}
          >
            Go to Dashboard
          </Button>
        </NavLink>
      </Box>

      {/* Add New Expense Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add New Expense
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={handleInputChange('category')}
              >
                {categories
                  .sort((a, b) => a.category.localeCompare(b.category))
                  .map((cat) => (
                    <MenuItem key={cat.spending_id} value={cat.category}>
                      {cat.category}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Enter description"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Amount (฿)"
              type="number"
              value={formData.amount}
              onChange={handleInputChange('amount')}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleInputChange('date')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddRecord}
              sx={{ height: '56px' }}
              startIcon={<Add />}
            >
              Add Record
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Spending Records Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Spending Records
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount (฿)</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {spendingRecords
                .sort((a, b) => b.spending_id - a.spending_id)
                .map((record) => (
                <TableRow key={record.spending_id}>
                  <TableCell>{record.spending_id}</TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell align="right">
                    ฿{record.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRecord(record.spending_id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {spendingRecords.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No spending records found. Add your first expense above!
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Journal;