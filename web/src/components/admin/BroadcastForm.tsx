'use client';

import { useState } from 'react';
import api from '@/lib/api'; // Assuming you have an api helper
import { toast } from 'sonner';

const BroadcastForm = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Please fill in both title and message.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/broadcast', { title, body });
      toast.success('Broadcast sent successfully!');
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Failed to send broadcast', error);
      toast.error('Failed to send broadcast. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Send Broadcast Notification</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-bold mb-2">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded text-gray-700"
            placeholder="E.g., Company Announcement"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="body" className="block text-gray-700 font-bold mb-2">Message</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 border rounded text-gray-700"
            placeholder="Enter your message here..."
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send to All Users'}
        </button>
      </form>
    </div>
  );
};

export default BroadcastForm;
