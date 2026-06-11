import React from 'react';
import { Play, Facebook, Instagram, Youtube, Hash } from 'lucide-react';

const VideoColumn = ({ platform }) => {
  const mockVideos = {
    "News Channels": [
      { id: 1, title: "Breaking: Major Policy Changes in 2025", thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop", duration: "2:34", views: "45K" },
      { id: 2, title: "Economic Forecast for Q4 2025", thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop", duration: "5:12", views: "32K" }
    ],
    "Facebook": [
      { id: 3, title: "Viral Dance Challenge from Kerala", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop", duration: "1:45", views: "2.1M" },
      { id: 4, title: "Amazing Street Food Tour", thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=225&fit=crop", duration: "3:22", views: "890K" }
    ],
    "Instagram": [
      { id: 5, title: "Behind the Scenes: Dubai Fashion Week", thumbnail: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=225&fit=crop", duration: "4:18", views: "1.5M" },
      { id: 6, title: "Reel: Traditional Art Forms Revival", thumbnail: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=225&fit=crop", duration: "2:58", views: "756K" }
    ],
    "TikTok": [
      { id: 7, title: "#TechTrends2025 Compilation", thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop", duration: "1:30", views: "5.2M" },
      { id: 8, title: "Quick Tips: Sustainable Living", thumbnail: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=225&fit=crop", duration: "0:59", views: "3.8M" }
    ]
  };

  const videos = mockVideos[platform] || [];

  const getIcon = () => {
    switch (platform) {
      case "Facebook": return <Facebook className="w-5 h-5" />;
      case "Instagram": return <Instagram className="w-5 h-5" />;
      case "TikTok": return <Hash className="w-5 h-5" />;
      default: return <Youtube className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="font-display font-semibold text-lg text-gray-900">{platform}</h3>
        </div>
      </div>
      
      <div className="space-y-4 p-4">
        {videos.map((video) => (
          <div key={video.id} className="group cursor-pointer">
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <h4 className="font-medium text-gray-900 mt-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
              {video.title}
            </h4>
            <p className="text-sm text-gray-500">{video.views} views</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button className="w-full text-center text-indigo-700 font-medium hover:text-indigo-800 transition-colors">
          View More on {platform}
        </button>
      </div>
    </div>
  );
};

export default VideoColumn;