"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import NotAdmin from "@/components/NotAdmin";

interface Complaint {
  id: number;
  name: string;
  department: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch("/api/complaints");
        if (!response.ok) {
          throw new Error("Failed to fetch complaints");
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const resolveComplaint = async (id: number) => {
    try {
      await fetch(`/api/complaints/${id}/resolve`, {
        method: "PUT",
      });
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === id ? { ...complaint, status: "resolved" } : complaint
        )
      );
    } catch (err) {
      console.error("Failed to resolve complaint", err);
    }
  };

  const deleteComplaint = async (id: number) => {
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "DELETE",
      });
      setComplaints((prev) => prev.filter((complaint) => complaint.id !== id));
    } catch (err) {
      console.error("Failed to delete complaint", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto my-20"></div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (session?.user?.role === "ADMIN") {
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
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No complaints available.
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="border-b border-gray-700 hover:bg-gray-800"
                  >
                    <td
                      className="px-6 py-4"
                      title={`Submitted on: ${new Date(
                        complaint.createdAt
                      ).toLocaleString()}`}
                    >
                      {complaint.name}
                    </td>
                    <td className="px-6 py-4">{complaint.department}</td>
                    <td className="px-6 py-4">{complaint.email}</td>
                    <td className="px-6 py-4 max-w-xs overflow-hidden overflow-ellipsis whitespace-pre-wrap">
                      {complaint.message}
                    </td>
                    <td className="px-6 py-4">{complaint.status}</td>
                    <td className="px-6 py-4 flex space-x-2">
                      {complaint.status === "unresolved" && (
                        <button
                          onClick={() => resolveComplaint(complaint.id)}
                          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Resolved
                        </button>
                      )}
                      <button
                        onClick={() => deleteComplaint(complaint.id)}
                        className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>
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

  return (
    <NotAdmin />
  );
}
