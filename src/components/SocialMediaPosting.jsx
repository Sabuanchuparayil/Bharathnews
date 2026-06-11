import React, { useState } from 'react';
import { Facebook, Twitter, Instagram, Send, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const SocialMediaPosting = () => {
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [isContentWriter, setIsContentWriter] = useState(false); // Mock role check

  const handlePlatformToggle = (platform) => {
    setPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePost = () => {
    if (!isContentWriter) {
      toast.error('Only content writers can post to social media.');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter content to post.');
      return;
    }
    if (platforms.length === 0) {
      toast.error('Please select at least one platform.');
      return;
    }
    
    // Mock posting
    toast.success(`Posted to ${platforms.join(', ')} successfully!`);
    setContent('');
    setPlatforms([]);
  };

  if (!isContentWriter) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="font-display font-semibold text-yellow-800">Content Writer Access Required</h3>
            <p className="text-yellow-700 mt-1">
              Social media posting is restricted to content writers for monetization purposes. 
              Please contact admin for access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">Social Media Posting</h2>
      
      <div className="space-y-6">
        {/* Content Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your social media post content..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="4"
            maxLength="280"
          />
          <p className="text-sm text-gray-500 mt-1">{content.length}/280 characters</p>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Platforms
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
              { name: 'Twitter', icon: Twitter, color: 'bg-sky-500' },
              { name: 'Instagram', icon: Instagram, color: 'bg-pink-600' }
            ].map((platform) => (
              <button
                key={platform.name}
                onClick={() => handlePlatformToggle(platform.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  platforms.includes(platform.name)
                    ? `${platform.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <platform.icon className="w-4 h-4" />
                <span>{platform.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Post Button */}
        <button
          onClick={handlePost}
          disabled={!content.trim() || platforms.length === 0}
          className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Send className="w-5 h-5" />
          <span>Post to Selected Platforms</span>
        </button>

        {/* Monetization Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Social media posts are part of our monetization strategy. 
            All content is reviewed for quality and engagement potential.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaPosting;