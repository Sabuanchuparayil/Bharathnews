import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Share2, Bookmark, Heart, Clock, Eye, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdSlot from '../components/AdSlot';
import ArticleSchema from '../components/ArticleSchema';
import ChannelFollowCTA from '../components/ChannelFollowCTA';
import ReadingProgress from '../components/ReadingProgress';
import BottomNav from '../components/BottomNav';
import ChatbotWidget from '../components/ChatbotWidget';
import { getArticleBySlug, trackArticleView } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { useInterests } from '../context/InterestContext';

const Article = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { trackRead, trackBookmark } = useInterests();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const fetchArticle = async () => {
      const data = await getArticleBySlug(slug);
      if (data) {
        setArticle(data);
        trackArticleView(data.id);
      }
      setLoading(false);
    };
    fetchArticle();

    return () => {
      if (article) {
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        trackRead(article, duration);
      }
    };
  }, [slug]);

  const handleShare = async () => {
    const shareData = { title: article.title, text: article.summary, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleBookmark = () => {
    if (!user) {
      toast.info('Please sign in to bookmark articles');
      return;
    }
    trackBookmark(article);
    toast.success('Article bookmarked!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
          <Link to="/" className="text-brand-700 mt-4 inline-block">Back to home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <ReadingProgress />
      <Helmet>
        <title>{article.seo?.metaTitle || article.title} | The Bharath News</title>
        <meta name="description" content={article.seo?.metaDescription || article.summary} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://thebharathnews.com/article/${slug}`} />
      </Helmet>
      <ArticleSchema article={article} />

      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-brand-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to news</span>
        </Link>

        <article>
          <header className="mb-8">
            <span className="inline-block bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
              {article.category}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{article.author}</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(article.publishedAt?.seconds ? article.publishedAt.seconds * 1000 : article.publishedAt), { addSuffix: true })}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{article.views?.toLocaleString() || 0} views</span>
              </span>
              {article.source && <span>Source: {article.source}</span>}
            </div>
          </header>

          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
          />

          <AdSlot className="mb-8" />

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8">
            {article.fullContent?.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">{paragraph}</p>
            ))}
          </div>

          <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 mb-8">
            <div className="flex items-center space-x-4">
              <button onClick={handleShare} className="flex items-center space-x-2 text-gray-600 hover:text-brand-700 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
              <button onClick={handleBookmark} className="flex items-center space-x-2 text-gray-600 hover:text-brand-700 transition-colors">
                <Bookmark className="w-5 h-5" />
                <span>Bookmark</span>
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{article.likes || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{article.comments || 0}</span>
              </span>
            </div>
          </div>

          <ChannelFollowCTA />

          <AdSlot className="mt-8" />
        </article>
      </main>

      <Footer />
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
};

export default Article;
