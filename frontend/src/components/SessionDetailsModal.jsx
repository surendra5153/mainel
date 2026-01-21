import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updateSessionDetails } from '../api/sessions';
import { notifySuccess, notifyError } from '../utils/toast';
import { X, Calendar, Clock, Video, FileText, Lock } from 'lucide-react';

export default function SessionDetailsModal({ session, onClose, onUpdate }) {
    const user = useAuthStore((s) => s.user);
    const [activeTab, setActiveTab] = useState('details'); // details, agenda, notes
    const [agenda, setAgenda] = useState(session.agenda || '');
    const [learnerNotes, setLearnerNotes] = useState(session.learnerNotes || '');
    const [saving, setSaving] = useState(false);

    const isMentor = session.mentor._id === user._id;
    const isLearner = session.learner._id === user._id;

    // Sync state if session prop updates
    useEffect(() => {
        setAgenda(session.agenda || '');
        setLearnerNotes(session.learnerNotes || '');
    }, [session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {};
            if (isMentor) payload.agenda = agenda;
            if (isLearner) payload.learnerNotes = learnerNotes;

            const res = await updateSessionDetails(session._id, payload);
            notifySuccess('Details updated successfully');
            if (onUpdate) onUpdate(); // Refresh parent list
            onClose();
        } catch (err) {
            console.error(err);
            notifyError('Failed to save details');
        } finally {
            setSaving(false);
        }
    };

    if (!session) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Session Details</h3>
                        <p className="text-sm text-gray-500">
                            {session.skillName} • {new Date(session.scheduledAt).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-4 mb-6 border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'agenda' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Agenda
                        </button>
                        {isLearner && (
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Private Notes
                            </button>
                        )}
                    </div>

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                    <Video className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">Meeting Link</h4>
                                    {session.meetingLink ? (
                                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                                            {session.meetingLink}
                                        </a>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No link provided yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Participants</h4>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-gray-700 w-16">Mentor:</span>
                                        <span className="text-sm text-gray-900">{session.mentor.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700 w-16">Learner:</span>
                                        <span className="text-sm text-gray-900">{session.learner.name}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Time & Status</h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(session.scheduledAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.durationMins} mins)
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${session.status === 'confirmed' || session.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                                                session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'agenda' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 mb-4">
                                <FileText className="w-5 h-5 flex-shrink-0" />
                                <p>The agenda is shared between Mentor and Learner to align on session goals.</p>
                            </div>

                            {isMentor ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Agenda</label>
                                    <textarea
                                        value={agenda}
                                        onChange={(e) => setAgenda(e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                                        placeholder="Outline the topics you plan to cover..."
                                    />
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                                        >
                                            {saving ? 'Saving...' : 'Save Agenda'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[200px]">
                                    {agenda ? (
                                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{agenda}</p>
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            <p>No agenda has been set by the mentor yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && isLearner && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 mb-4">
                                <Lock className="w-5 h-5 flex-shrink-0" />
                                <p>These notes are private. Only you can see them.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">My Private Notes</label>
                                <textarea
                                    value={learnerNotes}
                                    onChange={(e) => setLearnerNotes(e.target.value)}
                                    rows={8}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                                    placeholder="Take notes during your session..."
                                />
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        {saving ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions for non-editing tabs */}
                {activeTab === 'details' && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50">
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
