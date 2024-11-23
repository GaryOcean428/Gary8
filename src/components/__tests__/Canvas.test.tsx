import { render, screen } from '@testing-library/react';
import { Canvas } from '../Canvas';

describe('Canvas Component', () => {
  it('renders canvas element', () => {
    render(<Canvas />);
    const canvasElement = screen.getByRole('img'); // fabric.js canvas has role="img"
    expect(canvasElement).toBeInTheDocument();
  });
}); 