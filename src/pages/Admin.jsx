import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Plus, Edit, Trash2, Users, BarChart3, Settings, FileText, Globe, Layout, Upload } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const Admin = () => {
  const [searchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  useEffect(() => {
    const login = searchParams.get('login');
    if (login === 'true') {
      setIsLoggedIn(true);
    }
  }, [searchParams]);

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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please use the correct admin URL to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="w-8 h-8 text-indigo-700 mb-4" />
            <h3 className="font-display font-semibold text-lg">User Management</h3>
            <p className="text-gray-600">Manage users and permissions.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart3 className="w-8 h-8 text-indigo-700 mb-4" />
            <h3 className="font-display font-semibold text-lg">Analytics</h3>
            <p className="text-gray-600 mb-3">View site statistics and reports.</p>
            <Link to="/admin/dashboard" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              Open Analytics Dashboard →
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Settings className="w-8 h-8 text-indigo-700 mb-4" />
            <h3 className="font-display font-semibold text-lg">Settings</h3>
            <p className="text-gray-600">Configure site preferences.</p>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
              className="flex items-center space-x-2 bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-800 transition-colors"
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Edit Categories</h2>
              <button onClick={handleAddCategory} className="bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <ul className="space-y-2">
              {categories.map((cat, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>{cat}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditCategory(index)} className="text-indigo-700">
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Edit Topics</h2>
              <button onClick={() => setTopics([...topics, prompt('Add new topic:') || ''])} className="bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
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
                    }} className="text-indigo-700">
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-display font-bold text-xl mb-4">Edit Header</h2>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-bold text-xl">Manage News</h2>
            <button onClick={handleAddNews} className="bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
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
                    <button onClick={() => handleEditNews(item.id)} className="text-indigo-700">
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
      </main>
      <Footer />
    </div>
  );
};

export default Admin;