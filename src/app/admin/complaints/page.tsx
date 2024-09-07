'use client';

import { useEffect, useState } from 'react';

interface Complaint {
  id: number;
  name: string;
  department: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints');
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) {
    return <p className="text-white">Loading complaints...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-6">User Complaints</h1>
      <div className="overflow-x-auto bg-gray-900 shadow-md rounded-lg">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-800 text-white text-left">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No complaints available.
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-6 py-4">{complaint.name}</td>
                  <td className="px-6 py-4">{complaint.department}</td>
                  <td className="px-6 py-4">{complaint.email}</td>
                  <td className="px-6 py-4 max-w-xs overflow-hidden overflow-ellipsis whitespace-pre-wrap">
                    {complaint.message}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(complaint.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
