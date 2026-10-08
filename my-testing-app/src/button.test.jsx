import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Button from './Button';

describe('Button Component', () => {
  test('dapat makita ang text sa sulod sa button', () => {
    render(<Button>I-click Ko</Button>);

    const buttonElement = screen.getByRole('button', { name: /i-click ko/i });
    expect(buttonElement).toBeInTheDocument();
  });
});