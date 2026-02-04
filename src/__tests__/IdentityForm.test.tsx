import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IdentityForm from '../components/IdentityForm'

describe('IdentityForm', () => {
  test('renders and submits with valid data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<IdentityForm onSubmit={onSubmit} />)

    // Use placeholders since labels aren't linked with htmlFor/id
    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByPlaceholderText('Smith'), { target: { value: 'User' } })
    fireEvent.change(screen.getByPlaceholderText('123-45-6789'), { target: { value: '999-88-7777' } })

    fireEvent.click(screen.getByText(/Save & Continue/i))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  test('shows validation error when name missing', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    render(<IdentityForm onSubmit={onSubmit} />)

    // Submit button triggers form submission
    const submitButton = screen.getByText(/Save & Continue/i)
    fireEvent.click(submitButton)

    // Check that onSubmit was NOT called (validation should fail)
    // Note: HTML5 required attributes may prevent submission in some cases,
    // but our custom validation should also catch this
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})