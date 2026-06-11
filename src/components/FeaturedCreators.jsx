import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BadgeCheck } from 'lucide-react';
import { getFeaturedCreators } from '../services/creator';

const FeaturedCreators = () => {
  const [creators, setCreators] = useState([]);

  useEffect(() => {
    getFeaturedCreators(6).then(setCreators).catch(() => {});
  }, []);

  if (creators.length === 0) return null;

  return (
    <section>
      <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-brand-600" /> Featured Creators
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {creators.map(creator => (
          <Link
            key={creator.slug}
            to={`/@${creator.slug}`}
            className="glass-card-solid rounded-2xl p-4 card-lift flex items-center gap-3"
          >
            {creator.photoURL ? (
              <img src={creator.photoURL} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                {creator.displayName?.[0] || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center gap-1">
                {creator.displayName}
                {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </p>
              <p className="text-xs text-gray-500">@{creator.slug}</p>
              <p className="text-xs text-gray-400">{creator.followerCount || 0} followers</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCreators;
