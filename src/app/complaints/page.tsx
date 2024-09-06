'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import './ComplaintForm.css'; // Add this for external CSS

interface ComplaintFormInputs {
  name: string;
  department: string;
  email: string;
  message: string;
}

export default function ComplaintForm() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ComplaintFormInputs>();

  const onSubmit = async (data: ComplaintFormInputs) => {
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setSuccess(true);
      reset();  // Reset form after successful submission
    } else {
      setSuccess(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Submit a Complaint</h1>
      {success && <p className="success-message">Your complaint has been submitted!</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="complaint-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && <p className="error-message">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            {...register('department', { required: 'Department is required' })}
            className={`form-input ${errors.department ? 'input-error' : ''}`}
          />
          {errors.department && <p className="error-message">{errors.department.message}</p>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address',
              },
            })}
            className={`form-input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <p className="error-message">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            {...register('message', { required: 'Message is required' })}
            className={`form-input ${errors.message ? 'input-error' : ''}`}
          />
          {errors.message && <p className="error-message">{errors.message.message}</p>}
        </div>

        <button type="submit" className="submit-btn">Submit</button>
      </form>
    </div>
  );
}
