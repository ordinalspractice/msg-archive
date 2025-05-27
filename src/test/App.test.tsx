import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the folder picker on initial load', () => {
    render(<App />);

    expect(screen.getByText('Welcome to Messenger Archive Viewer')).toBeInTheDocument();
    expect(screen.getByText('Select Messages Folder')).toBeInTheDocument();
  });
});
