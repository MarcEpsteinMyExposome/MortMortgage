import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IdentityForm from '../components/IdentityForm'

describe('IdentityForm', () => {
  test('renders and submits with valid data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<IdentityForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'User' } })
    fireEvent.change(screen.getByLabelText(/SSN/i), { target: { value: '123-45-6789' } })

    fireEvent.click(screen.getByText(/Save & Continue/i))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  test('shows validation error when name missing', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<IdentityForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByText(/Save & Continue/i))

    expect(screen.getByText(/First and last name are required/i)).toBeInTheDocument()
  })
})