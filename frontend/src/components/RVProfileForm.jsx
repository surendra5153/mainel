import React, { useState, useEffect } from 'react';
import { updateRVProfile } from '../api/rvVerification';
import { notifySuccess, notifyError } from '../utils/toast';
import { Save } from 'lucide-react';

export default function RVProfileForm({ initialData, onUpdate }) {
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setBranch(initialData.branch || '');
            setYear(initialData.year || '');
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!branch.trim()) {
            notifyError('Please enter your branch');
            return;
        }
        if (!year) {
            notifyError('Please select your year');
            return;
        }

        setLoading(true);
        try {
            await updateRVProfile({
                branch: branch.trim(),
                year: parseInt(year, 10)
            });
            notifySuccess('Academic details saved successfully');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            notifyError(err.message || 'Failed to save details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="rvBranch" className="block text-sm font-medium text-gray-700 mb-1">
                        Department / Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="rvBranch"
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Computer Science, ECE"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        disabled={loading}
                    />
                </div>

                <div className="w-full sm:w-32">
                    <label htmlFor="rvYear" className="block text-sm font-medium text-gray-700 mb-1">
                        Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="rvYear"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        disabled={loading}
                    >
                        <option value="">Select</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year (Arch)</option>
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Academic Details'}
            </button>
        </form>
    );
}
