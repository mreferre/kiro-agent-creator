/**
 * Toolbar Component Tests
 * 
 * Tests for the Toolbar component that provides action buttons
 * for file operations and example loading.
 * 
 * Validates: Requirements 1.1, 2.1, 3.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import type { ToolbarProps } from './Toolbar';

describe('Toolbar', () => {
  // Default props for testing
  const defaultProps: ToolbarProps = {
    onNew: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onLoadExample: vi.fn(),
    isValid: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('New Configuration Button', () => {
    it('renders the New Configuration button', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('new-config-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('New Configuration');
    });

    it('calls onNew when clicked', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('new-config-button');
      fireEvent.click(button);
      
      expect(defaultProps.onNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Import Button', () => {
    it('renders the Import button', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('import-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Import');
    });

    it('renders a hidden file input for JSON files', () => {
      render(<Toolbar {...defaultProps} />);
      
      const fileInput = screen.getByTestId('import-file-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.json,application/json');
      expect(fileInput).toHaveClass('hidden');
    });

    it('calls onImport with the selected file', () => {
      render(<Toolbar {...defaultProps} />);
      
      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;
      const testFile = new File(['{"name": "test"}'], 'test.json', { type: 'application/json' });
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
      });
      fireEvent.change(fileInput);
      
      expect(defaultProps.onImport).toHaveBeenCalledTimes(1);
      expect(defaultProps.onImport).toHaveBeenCalledWith(testFile);
    });

    it('does not call onImport when no file is selected', () => {
      render(<Toolbar {...defaultProps} />);
      
      const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;
      
      // Simulate empty file selection
      Object.defineProperty(fileInput, 'files', {
        value: [],
      });
      fireEvent.change(fileInput);
      
      expect(defaultProps.onImport).not.toHaveBeenCalled();
    });
  });

  describe('Export Button', () => {
    it('renders the Export button', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('export-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Export');
    });

    it('is enabled when isValid is true', () => {
      render(<Toolbar {...defaultProps} isValid={true} />);
      
      const button = screen.getByTestId('export-button');
      expect(button).not.toBeDisabled();
    });

    it('is disabled when isValid is false', () => {
      render(<Toolbar {...defaultProps} isValid={false} />);
      
      const button = screen.getByTestId('export-button');
      expect(button).toBeDisabled();
    });

    it('calls onExport when clicked and valid', () => {
      render(<Toolbar {...defaultProps} isValid={true} />);
      
      const button = screen.getByTestId('export-button');
      fireEvent.click(button);
      
      expect(defaultProps.onExport).toHaveBeenCalledTimes(1);
    });

    it('does not call onExport when clicked and invalid', () => {
      render(<Toolbar {...defaultProps} isValid={false} />);
      
      const button = screen.getByTestId('export-button');
      fireEvent.click(button);
      
      expect(defaultProps.onExport).not.toHaveBeenCalled();
    });

    it('has visual indication when disabled', () => {
      render(<Toolbar {...defaultProps} isValid={false} />);
      
      const button = screen.getByTestId('export-button');
      expect(button).toHaveClass('cursor-not-allowed');
      expect(button).toHaveClass('opacity-60');
    });

    it('has tooltip explaining why disabled', () => {
      render(<Toolbar {...defaultProps} isValid={false} />);
      
      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('title', 'Fix validation errors before exporting');
    });
  });

  describe('Load Example Button', () => {
    it('renders the Load Example button', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('load-example-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Load Example');
    });

    it('shows dropdown when clicked', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.getByTestId('load-example-button');
      fireEvent.click(button);
      
      const dropdown = screen.getByTestId('example-dropdown');
      expect(dropdown).toBeInTheDocument();
    });

    it('calls onLoadExample when an example is selected', () => {
      render(<Toolbar {...defaultProps} />);
      
      // Open dropdown
      const button = screen.getByTestId('load-example-button');
      fireEvent.click(button);
      
      // Select an example
      const exampleOption = screen.getByTestId('example-option-rust-backend');
      fireEvent.click(exampleOption);
      
      expect(defaultProps.onLoadExample).toHaveBeenCalledTimes(1);
      expect(defaultProps.onLoadExample).toHaveBeenCalledWith('rust-backend');
    });

    it('closes dropdown after selecting an example', () => {
      render(<Toolbar {...defaultProps} />);
      
      // Open dropdown
      const button = screen.getByTestId('load-example-button');
      fireEvent.click(button);
      
      // Select an example
      const exampleOption = screen.getByTestId('example-option-rust-backend');
      fireEvent.click(exampleOption);
      
      // Dropdown should be closed
      const dropdown = screen.queryByTestId('example-dropdown');
      expect(dropdown).not.toBeInTheDocument();
    });

    it('displays all available examples', () => {
      render(<Toolbar {...defaultProps} />);
      
      // Open dropdown
      const button = screen.getByTestId('load-example-button');
      fireEvent.click(button);
      
      // Check all examples are displayed
      expect(screen.getByTestId('example-option-rust-backend')).toBeInTheDocument();
      expect(screen.getByTestId('example-option-frontend-react')).toBeInTheDocument();
      expect(screen.getByTestId('example-option-devops-aws')).toBeInTheDocument();
    });
  });

  describe('Preview Toggle Button', () => {
    it('does not render when onTogglePreview is not provided', () => {
      render(<Toolbar {...defaultProps} />);
      
      const button = screen.queryByTestId('toggle-preview-button');
      expect(button).not.toBeInTheDocument();
    });

    it('renders when onTogglePreview is provided', () => {
      const onTogglePreview = vi.fn();
      render(<Toolbar {...defaultProps} onTogglePreview={onTogglePreview} isPreviewVisible={true} />);
      
      const button = screen.getByTestId('toggle-preview-button');
      expect(button).toBeInTheDocument();
    });

    it('shows "Hide Preview" when preview is visible', () => {
      const onTogglePreview = vi.fn();
      render(<Toolbar {...defaultProps} onTogglePreview={onTogglePreview} isPreviewVisible={true} />);
      
      const button = screen.getByTestId('toggle-preview-button');
      expect(button).toHaveTextContent('Hide Preview');
    });

    it('shows "Show Preview" when preview is hidden', () => {
      const onTogglePreview = vi.fn();
      render(<Toolbar {...defaultProps} onTogglePreview={onTogglePreview} isPreviewVisible={false} />);
      
      const button = screen.getByTestId('toggle-preview-button');
      expect(button).toHaveTextContent('Show Preview');
    });

    it('calls onTogglePreview when clicked', () => {
      const onTogglePreview = vi.fn();
      render(<Toolbar {...defaultProps} onTogglePreview={onTogglePreview} isPreviewVisible={true} />);
      
      const button = screen.getByTestId('toggle-preview-button');
      fireEvent.click(button);
      
      expect(onTogglePreview).toHaveBeenCalledTimes(1);
    });
  });
});
