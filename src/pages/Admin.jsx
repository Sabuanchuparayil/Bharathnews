import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, Users, BarChart3, Settings, FileText, Globe, Layout as LayoutIcon, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user, isAdmin, loading, loginWithGoogle } = useAuth();
  const [news, setNews] = useState([
    { id: 1, title: "സാമ്പിൾ വാർത്ത", status: "പ്രസിദ്ധീകരിച്ചു" },
    // Add more mock news
  ]);
  const [categories, setCategories] = useState(['ബിസിനസ്', 'സാങ്കേതികം', 'സമൂഹം']);
  const [topics, setTopics] = useState(['ഇന്ത്യ', 'ജി.സി.സി', 'ആഗോളം']);
  const [headerText, setHeaderText] = useState('The Bharath News');
  const [footerText, setFooterText] = useState('© 2024 The Bharath News');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleAddNews = () => {
    // Logic to add news
  };

  const handleEditNews = (id) => {
    // Logic to edit news
  };

  const handleDeleteNews = (id) => {
    // Logic to delete news
  };

  const handleAddCategory = () => {
    const newCategory = prompt('Add new category:');
    if (newCategory) setCategories([...categories, newCategory]);
  };

  const handleEditCategory = (index) => {
    const edited = prompt('Edit category:', categories[index]);
    if (edited) {
      const updated = [...categories];
      updated[index] = edited;
      setCategories(updated);
    }
  };

  const handleDeleteCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the admin panel.</p>
            <button onClick={loginWithGoogle} className="btn-primary">Sign in with Google</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">Admin role required.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false} mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
        
        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card-solid rounded-2xl p-6">
            <FileText className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
            <h3 className="font-display font-semibold text-lg">Moderation</h3>
            <p className="text-gray-600 mb-3">Review creator applications and UGC submissions.</p>
            <Link to="/admin/moderation" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Open Moderation Queue →
            </Link>
          </div>
          <div className="glass-card-solid rounded-2xl p-6">
            <Users className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
            <h3 className="font-display font-semibold text-lg">User Management</h3>
            <p className="text-gray-600">Manage users and permissions.</p>
          </div>
          <div className="glass-card-solid rounded-2xl p-6">
            <BarChart3 className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
            <h3 className="font-display font-semibold text-lg">Analytics</h3>
            <p className="text-gray-600 mb-3">View site statistics and reports.</p>
            <Link to="/admin/dashboard" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Open Analytics Dashboard →
            </Link>
          </div>
          <div className="glass-card-solid rounded-2xl p-6">
            <Settings className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-4" />
            <h3 className="font-display font-semibold text-lg">Settings</h3>
            <p className="text-gray-600">Configure site preferences.</p>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="glass-card-solid rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-xl mb-4">Upload Logo</h2>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-brand-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Logo</span>
            </label>
            {logoPreview && (
              <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 object-cover rounded-lg" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Upload a new logo image (PNG, JPG, etc.). Recommended size: 128x128px. To upload, select a file and save changes.
          </p>
        </div>

        {/* Edit Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Categories */}
          <div className="glass-card-solid rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Edit Categories</h2>
              <button onClick={handleAddCategory} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <ul className="space-y-2">
              {categories.map((cat, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>{cat}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditCategory(index)} className="text-brand-600 dark:text-brand-400">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(index)} className="text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          <div className="glass-card-solid rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Edit Topics</h2>
              <button onClick={() => setTopics([...topics, prompt('Add new topic:') || ''])} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <ul className="space-y-2">
              {topics.map((topic, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>{topic}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => {
                      const edited = prompt('Edit topic:', topic);
                      if (edited) {
                        const updated = [...topics];
                        updated[index] = edited;
                        setTopics(updated);
                      }
                    }} className="text-brand-600 dark:text-brand-400">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTopics(topics.filter((_, i) => i !== index))} className="text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Header and Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-xl mb-4">Edit Header</h2>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-xl mb-4">Edit Footer</h2>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* News Management */}
        <div className="glass-card-solid rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-bold text-xl">Manage News</h2>
            <button onClick={handleAddNews} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add News</span>
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.title}</td>
                  <td className="py-2">{item.status}</td>
                  <td className="py-2 flex space-x-2">
                    <button onClick={() => handleEditNews(item.id)} className="text-brand-600 dark:text-brand-400">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteNews(item.id)} className="text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </Layout>
  );
};

export default Admin;