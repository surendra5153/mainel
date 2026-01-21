import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { fetchMe, updateMe } from '../api/auth';
import { client } from '../api/client';
import { addTeachSkill, removeTeachSkillApi, addLearnSkill, removeLearnSkillApi } from '../api/skills';
import { notifySuccess, notifyError } from '../utils/toast';
import { Upload, X, Camera, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import ProfileDemoVideos from '../components/ProfileDemoVideos';

export default function EditProfile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newSkill, setNewSkill] = useState({ name: "", level: "beginner" });
  const [skillType, setSkillType] = useState("teach"); // "teach" or "learn"

  const [form, setForm] = useState({
    name: "",
    email: "",
    avatarUrl: "",
    securityQuestion: "",
    securityAnswer: "",
    bio: "",
    location: "",
    github: "",
    linkedin: "",
    twitter: "",
    website: "",
    title: "",
    yearsOfExperience: 0,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      fetchMe().then(res => {
        if (res.user) {
          setUser(res.user);
          initializeForm(res.user);
        }
      }).catch(() => navigate('/login'));
    } else {
      initializeForm(user);
    }
  }, [user, navigate, setUser]);

  const initializeForm = (userData) => {
    setForm({
      name: userData.name || "",
      email: userData.email || "",
      avatarUrl: userData.avatarUrl || "",
      securityQuestion: userData.securityQuestion || "",
      securityAnswer: "", // Don't show existing hash
      bio: userData.bio || "",
      location: userData.location || "",
      github: userData.github || "",
      linkedin: userData.linkedin || "",
      twitter: userData.twitter || "",
      website: userData.website || "",
      title: userData.title || "",
      yearsOfExperience: userData.yearsOfExperience || 0,
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      notifyError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use the generic upload endpoint we created earlier
      const res = await client.post('/upload', formData);
      setForm(prev => ({ ...prev, avatarUrl: res.url }));
      notifySuccess('Avatar uploaded successfully');
    } catch (err) {
      console.error(err);
      notifyError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Update Security Settings (if provided)
    let securityUpdated = false;
    if (form.securityQuestion && form.securityAnswer) {
      try {
        await client.put('/auth/security-settings', {
          securityQuestion: form.securityQuestion,
          securityAnswer: form.securityAnswer
        });
        securityUpdated = true;
      } catch (err) {
        console.error(err);
        notifyError('Failed to update security question');
      }
    }

    // 2. Update Profile
    try {
      const res = await updateMe(form);
      if (res.user) {
        setUser(res.user);
        notifySuccess(`Profile updated${securityUpdated ? ' & Security settings saved' : ''}`);
        navigate('/profile');
      } else {
        notifyError(res.message || 'Could not update profile');
      }
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      notifyError("Skill name required");
      return;
    }
    try {
      if (skillType === "teach") {
        await addTeachSkill({ name: newSkill.name, level: newSkill.level });
      } else {
        await addLearnSkill({ name: newSkill.name });
      }
      const updated = await fetchMe();
      setUser(updated.user);
      setNewSkill({ name: "", level: "beginner" });
      notifySuccess("Skill added!");
    } catch (e) {
      notifyError(e.message || "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (type, id) => {
    try {
      if (type === "teach") {
        await removeTeachSkillApi(id);
      } else {
        await removeLearnSkillApi(id);
      }
      const updated = await fetchMe();
      setUser(updated.user);
      notifySuccess("Skill removed!");
    } catch (e) {
      notifyError(e.message || "Failed to remove skill");
    }
  };

  if (!user && !form.name) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-500 mt-1">Update your personal information and public profile</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <img
                src={form.avatarUrl || `https://api.dicebear.com/7.x/thumbs/svg?seed=${form.name}`}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Profile Photo</h3>
              <p className="text-sm text-gray-500 mb-2">
                JPG, GIF or PNG. Max size of 5MB.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change photo'}
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g. Senior Full-Stack Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Username
                </label>
                <input
                  type="text"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Username
                </label>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Security Question Section (Opt-in) */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Question (Password Recovery)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Question</label>
                <select
                  value={form.securityQuestion}
                  onChange={(e) => setForm({ ...form, securityQuestion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Disabled --</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="What is your favorite hobby?">What is your favorite hobby?</option>
                  <option value="What is the name of your first school?">What is the name of your first school?</option>
                </select>
              </div>
              {form.securityQuestion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                  <input
                    type="text"
                    value={form.securityAnswer}
                    onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })}
                    placeholder="Your answer (case insensitive)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Keep this safe. It allows password reset.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Skills Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Skills</h2>
          <p className="text-gray-500 mt-1">Manage the skills you teach and want to learn</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <select
                value={skillType}
                onChange={(e) => setSkillType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="teach">I can teach...</option>
                <option value="learn">I want to learn...</option>
              </select>
            </div>
            <div className="flex-[2]">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Skill name (e.g. React, Python)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {skillType === 'teach' && (
              <div className="flex-1">
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            )}
            <button
              onClick={handleAddSkill}
              aria-label="Add skill"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Skills I Teach</h3>
              <div className="space-y-2">
                {user?.teaches?.length > 0 ? (
                  user.teaches.map(skill => (
                    <div key={skill._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{skill.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{skill.level}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill('teach', skill._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills added yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Skills I Want to Learn</h3>
              <div className="space-y-2">
                {user?.learns?.length > 0 ? (
                  user.learns.map(skill => (
                    <div key={skill._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{skill.name}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill('learn', skill._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Videos */}
      <div className="mb-8">
        <ProfileDemoVideos />
      </div>
    </div>
  );
}
