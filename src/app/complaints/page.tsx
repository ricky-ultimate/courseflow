'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';


interface ComplaintFormInput {
  name: string;
  department: string;
  email: string;
  message: string;
}

export default function ComplaintForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComplaintFormInput>();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: ComplaintFormInput) => {
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setSuccess(true);
    } else {
      setSuccess(false);
    }
  };

  return (
    <div className="complaint-form-container">
      <h1 className="form-title">Submit a Complaint</h1>
      {success && <p className="success-message">Your complaint has been submitted!</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="complaint-form">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            type="text"
            {...register('name', { required: true })}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && <p className="error-message">Name is required</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Department</label>
          <input
            type="text"
            {...register('department', { required: true })}
            className={`form-input ${errors.department ? 'input-error' : ''}`}
          />
          {errors.department && <p className="error-message">Department is required</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            {...register('email', { required: true })}
            className={`form-input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <p className="error-message">Email is required</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            {...register('message', { required: true })}
            className={`form-textarea ${errors.message ? 'input-error' : ''}`}
          />
          {errors.message && <p className="error-message">Message is required</p>}
        </div>

        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
}
