import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Analytics } from './Analytics';

// mocked hooks since analytics component relies on them
jest.mock('../../hooks/useShifts', () => ({
  useShifts: () => ({ shifts: [], isLoading: false })
}));
jest.mock('../../hooks/useStudySessions', () => ({
  useStudySessions: () => ({ studySessions: [], isLoading: false })
}));
jest.mock('../../hooks/useWorkplaces', () => ({
  useWorkplaces: () => ({ workplaces: [] })
}));

// prevent jsPDF from throwing in tests
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    save: jest.fn(),
  })),
}));

describe('Analytics page', () => {
  it('renders export button and shows menu when clicked', () => {
    render(<Analytics />);
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeInTheDocument();

    // menu not visible initially
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/csv/i)).not.toBeInTheDocument();

    fireEvent.click(exportButton);
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(<Analytics />);
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();

    fireEvent.mouseDown(document);
    expect(screen.queryByText(/pdf/i)).not.toBeInTheDocument();
  });

  it('calls CSV generator when option clicked', async () => {
    const createObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;

    render(<Analytics />);
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    fireEvent.click(screen.getByText(/csv/i));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
  });
});
