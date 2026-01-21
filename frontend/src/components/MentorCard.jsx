import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import { Star, Shield, Award, ArrowRight } from 'lucide-react';

export default function MentorCard({ mentor }) {
  return (
    <div className="group glass-panel relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
              {mentor.avatarUrl ? (
                <img
                  src={mentor.avatarUrl}
                  alt={mentor.name}
                  className="relative w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <Avatar name={mentor.name} size="64" round={true} className="relative shadow-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-heading font-bold text-lg text-gray-900 truncate leading-tight">{mentor.name}</h3>

                {mentor.rvVerificationStatus === 'verified' && (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200 tracking-wide">RV</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate font-medium">{mentor.title || 'Student Mentor'}</p>

              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-gray-800">{mentor.rating || 0}</span>
                <span className="text-xs text-gray-400">({mentor.reviewsCount || 0} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="mb-6 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Award size={12} /> Can Teach
          </p>
          <div className="flex flex-wrap gap-2">
            {mentor.teaches?.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium border border-gray-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/50 group-hover:text-indigo-600 transition-colors"
              >
                {t.name}
              </span>
            ))}
            {mentor.teaches?.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-400 font-medium">+{mentor.teaches.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4 border-t border-gray-50">
          <Link
            to={`/mentor/${mentor._id}`}
            className="group/btn w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium shadow-lg shadow-gray-200 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/20 active:scale-95"
          >
            <span>View Profile</span>
            <ArrowRight size={16} className="text-white/70 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
