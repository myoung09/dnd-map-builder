import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders map generator app', () => {
  render(<App />);
  const heading = screen.getByText(/Procedural Map Generator/i);
  expect(heading).toBeInTheDocument();
});

test('renders generate button', () => {
  render(<App />);
  const button = screen.getByText(/Generate Map/i);
  expect(button).toBeInTheDocument();
});
